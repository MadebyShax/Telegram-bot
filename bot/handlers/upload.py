import html
import io
import logging
import uuid
from aiogram import Router, types, F, Bot
from aiogram.types import BufferedInputFile
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from database.models import User, CardGeneration
from services.google_ai_studio_service import GoogleAIStudioService, GoogleAIServiceError
from bot.handlers.payment import payment_keyboard
from bot.i18n import t
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="upload")

# Telegram file_id of the last uploaded photo per user.
# Only the short id is kept in memory; the photo itself is downloaded again when generation starts.
PENDING_PHOTOS: dict[int, str] = {}

TELEGRAM_MESSAGE_LIMIT = 4096


async def _reserve_credit(session: AsyncSession, user_id: int) -> bool:
    """Atomically takes one credit. Returns False if the balance is empty (safe against double taps)."""
    stmt = (
        update(User)
        .where(User.telegram_id == user_id, User.credits > 0)
        .values(credits=User.credits - 1)
        .returning(User.credits)
        .execution_options(synchronize_session=False)
    )
    result = await session.execute(stmt)
    reserved = result.scalar_one_or_none() is not None
    await session.commit()
    return reserved


async def _refund_credit(session: AsyncSession, user_id: int):
    stmt = (
        update(User)
        .where(User.telegram_id == user_id)
        .values(credits=User.credits + 1)
        .execution_options(synchronize_session=False)
    )
    await session.execute(stmt)
    await session.commit()


@router.message(F.photo)
async def handle_product_photo(message: types.Message, session: AsyncSession, lang: str):
    """
    Zero-prompt workflow:
    User uploads raw product photo without writing anything.
    1. Verifies credits.
    2. Remembers the photo's file_id.
    3. Asks user whether infographics is needed or clean photo is preferred!
    """
    user_id = message.from_user.id

    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        await message.answer(t(lang, "need_start"), parse_mode="HTML")
        return

    if user.credits <= 0:
        await message.answer(
            t(lang, "no_credits", cards=settings.CARDS_PER_PACKAGE, price=f"{settings.PACKAGE_PRICE_UZS:,}"),
            reply_markup=payment_keyboard(lang, columns=2),
            parse_mode="HTML"
        )
        return

    PENDING_PHOTOS[user_id] = message.photo[-1].file_id

    builder = InlineKeyboardBuilder()
    builder.button(text=t(lang, "btn_info_yes"), callback_data="info_yes")
    builder.button(text=t(lang, "btn_info_no"), callback_data="info_no")
    builder.adjust(1)

    await message.answer(t(lang, "photo_received"), reply_markup=builder.as_markup(), parse_mode="HTML")


# Also matches old buttons in the format "info_yes:<user_id>"
@router.callback_query(F.data.regexp(r"^info_(yes|no)(:\d+)?$"))
async def handle_infographics_selection(
    callback: types.CallbackQuery,
    bot: Bot,
    session: AsyncSession,
    google_ai_service: GoogleAIStudioService,
    lang: str
):
    """
    Handles user choice for Infographics (Yes vs No) and generates 5 cards of the user's own product.
    The credit is taken before generation and refunded if nothing could be generated.
    """
    user_id = callback.from_user.id
    with_infographics = callback.data.startswith("info_yes")

    # pop(): a second tap on the same button cannot start a second generation
    file_id = PENDING_PHOTOS.pop(user_id, None)
    if not file_id:
        await callback.answer(t(lang, "session_expired"), show_alert=True)
        return

    if not await _reserve_credit(session, user_id):
        PENDING_PHOTOS[user_id] = file_id  # keep the photo so the user can continue right after paying
        await callback.answer(t(lang, "not_enough_credits"), show_alert=True)
        await callback.message.answer(t(lang, "topup_then_retry"), reply_markup=payment_keyboard(lang, columns=2))
        return

    await callback.answer()
    try:
        await callback.message.edit_reply_markup(reply_markup=None)
    except Exception:
        pass  # the question message may be too old to edit

    choice_text = t(lang, "choice_infographics" if with_infographics else "choice_clean")
    status_msg = await callback.message.answer(t(lang, "working", choice=choice_text), parse_mode="HTML")

    catalog_data: dict = {}
    try:
        file_info = await bot.get_file(file_id)
        photo_buffer = io.BytesIO()
        await bot.download_file(file_info.file_path, destination=photo_buffer)
        image_bytes = photo_buffer.getvalue()

        # Step 1: product analysis + SEO copy (cards can still be made if this fails)
        try:
            catalog_data = await google_ai_service.analyze_product(image_bytes, badge_language=lang)
        except Exception as e:
            logger.exception(f"Product analysis failed, generating cards without SEO: {e}")

        # Step 2: the user's own product re-shot in 5 random studio scenes
        cards = await google_ai_service.generate_studio_cards(
            image_bytes,
            product_name=str(catalog_data.get("product_name_en", "")),
            badges=catalog_data.get("infographic_badges"),
            include_infographics=with_infographics,
            lang=lang
        )
        if not cards:
            raise GoogleAIServiceError("No studio cards were generated")

        # Step 3: deliver the cards as a Telegram album
        media_group = []
        for idx, card in enumerate(cards):
            caption = None
            if idx == 0:
                styles = "\n".join(f"{i + 1}. {html.escape(c['style'])}" for i, c in enumerate(cards))
                caption = t(lang, "album_caption", styles=styles)
            media_group.append(types.InputMediaPhoto(
                media=BufferedInputFile(card["image_bytes"], filename=f"card_{idx + 1}.png"),
                caption=caption,
                parse_mode="HTML" if caption else None
            ))

        sent_messages = await callback.message.answer_media_group(media=media_group)

    except Exception as e:
        logger.exception(f"Error processing card generation for user {user_id}: {e}")
        await _refund_credit(session, user_id)
        PENDING_PHOTOS[user_id] = file_id  # let the user retry with the same photo
        await status_msg.edit_text(t(lang, "generation_failed"), parse_mode="HTML")
        return

    try:
        await status_msg.delete()
    except Exception:
        pass  # cards are already delivered, a leftover progress message is harmless

    # Save the generation; the SEO button refers to this record instead of in-memory data
    generation_id = uuid.uuid4()
    try:
        session.add(CardGeneration(
            id=generation_id,
            user_id=user_id,
            original_image_url=file_id,
            product_metadata=catalog_data or None,
            generated_image_urls=[m.photo[-1].file_id for m in sent_messages if m.photo],
            cost_usd=None
        ))
        await session.commit()
    except Exception as e:
        logger.exception(f"Could not save card generation for user {user_id}: {e}")
        await session.rollback()
        catalog_data = {}  # without a saved record the SEO button would not work

    ready_text = t(lang, "cards_ready", count=len(cards))

    if not catalog_data.get("title_uz") and not catalog_data.get("title_ru"):
        await callback.message.answer(f"{ready_text}\n\n{t(lang, 'send_next_photo')}", parse_mode="HTML")
        return

    # Ask if the user needs the SEO copy (NO marketplace brand names!)
    builder = InlineKeyboardBuilder()
    builder.button(text=t(lang, "btn_seo_yes"), callback_data=f"seo_yes:{generation_id}")
    builder.button(text=t(lang, "btn_seo_no"), callback_data="seo_no")
    builder.adjust(1)

    await callback.message.answer(
        f"{ready_text}\n\n{t(lang, 'ask_seo')}",
        reply_markup=builder.as_markup(),
        parse_mode="HTML"
    )


def _escape_list(values, separator: str) -> str:
    if not isinstance(values, list):
        return ""
    return separator.join(html.escape(str(v)) for v in values)


@router.callback_query(F.data.startswith("seo_yes:"))
async def handle_seo_yes(callback: types.CallbackQuery, session: AsyncSession, lang: str):
    """Triggered when user clicks 'SEO matn kerak' (NO marketplace brand names)."""
    try:
        generation_id = uuid.UUID(callback.data.split(":", 1)[1])
    except ValueError:
        generation_id = None

    seo_data = None
    if generation_id:
        stmt = select(CardGeneration).where(
            CardGeneration.id == generation_id,
            CardGeneration.user_id == callback.from_user.id
        )
        result = await session.execute(stmt)
        record = result.scalar_one_or_none()
        seo_data = record.product_metadata if record else None

    if not seo_data:
        await callback.answer(t(lang, "seo_stale"), show_alert=True)
        return

    title_uz = html.escape(str(seo_data.get("title_uz") or seo_data.get("uzum_title_uz", "")))
    title_ru = html.escape(str(seo_data.get("title_ru") or seo_data.get("uzum_title_ru", "")))

    # The SEO copy itself is always uz + ru (marketplace languages); only header/footer follow the UI language
    part_uz = (
        f"{t(lang, 'seo_header')}\n\n"
        "🇺🇿 <b>O'zbek tilida:</b>\n"
        f"📌 <b>Sarlavha:</b> <code>{title_uz}</code>\n\n"
        f"📋 <b>Afzalliklari:</b>\n{_escape_list(seo_data.get('bullet_points_uz'), chr(10))}\n\n"
        f"🏷 <b>Qidiruv teglari:</b> {_escape_list(seo_data.get('seo_tags_uz'), ' ')}"
    )
    part_ru = (
        "🇷🇺 <b>На русском языке:</b>\n"
        f"📌 <b>Название:</b> <code>{title_ru}</code>\n\n"
        f"📋 <b>Преимущества:</b>\n{_escape_list(seo_data.get('bullet_points_ru'), chr(10))}\n\n"
        f"🏷 <b>Поисковые теги:</b> {_escape_list(seo_data.get('seo_tags_ru'), ' ')}\n\n"
        f"{t(lang, 'seo_footer')}"
    )

    combined = f"{part_uz}\n\n━━━━━━━━━━━━━━━━━━━━\n\n{part_ru}"
    if len(combined) <= TELEGRAM_MESSAGE_LIMIT:
        await callback.message.answer(combined, parse_mode="HTML")
    else:
        await callback.message.answer(part_uz[:TELEGRAM_MESSAGE_LIMIT], parse_mode="HTML")
        await callback.message.answer(part_ru[:TELEGRAM_MESSAGE_LIMIT], parse_mode="HTML")

    await callback.answer(t(lang, "seo_sent"))


@router.callback_query(F.data == "seo_no")
async def handle_seo_no(callback: types.CallbackQuery, lang: str):
    """Triggered when user clicks 'faqat kartochkalar kifoya'."""
    await callback.message.answer(t(lang, "seo_declined"), parse_mode="HTML")
    await callback.answer()
