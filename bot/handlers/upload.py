import io
import logging
from typing import Optional
from aiogram import Router, types, F, Bot
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, CardGeneration
from services.vision_service import VisionService
from services.seo_service import SeoService
from services.image_gen_service import ImageGenService
from services.google_ai_studio_service import GoogleAIStudioService
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="upload")

# In-memory cache for pending SEO data per user
PENDING_SEO_DATA: dict[int, dict] = {}


@router.message(F.photo)
async def handle_product_photo(
    message: types.Message,
    bot: Bot,
    session: AsyncSession,
    vision_service: VisionService,
    seo_service: SeoService,
    image_gen_service: ImageGenService,
    google_ai_service: Optional[GoogleAIStudioService] = None
):
    """
    Zero-prompt workflow:
    User uploads raw product photo without writing anything.
    1. Verifies credits.
    2. Sends photo to Google AI Studio Gemini API.
    3. Generates 5 distinct, randomized studio card variations.
    4. Delivers 5 cards first.
    5. Asks the user: "Do you need Uzum & Wildberries SEO text?"
    """
    user_id = message.from_user.id

    # 1. Check user credits
    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or user.credits <= 0:
        builder = InlineKeyboardBuilder()
        builder.button(text="🔵 Click (15,000 UZS)", callback_data="pay_click")
        builder.button(text="🟢 Payme (15,000 UZS)", callback_data="pay_payme")
        builder.adjust(2)

        await message.answer(
            "⚠️ <b>Balansingizda generatsiya paketlari tugadi.</b>\n\n"
            "5 ta professional e-commerce studiya kartochkasi va to'liq SEO tavsif "
            "yaratish uchun hisobingizni to'ldiring (15,000 UZS):",
            reply_markup=builder.as_markup(),
            parse_mode="HTML"
        )
        return

    # 2. Acknowledge and download photo
    status_msg = await message.answer(
        "⏳ <b>1/2: Google AI Studio tahlil qilmoqda...</b>\n"
        "<i>Gemini Vision mahsulot turi, ranglari va shaklini aniqlab, 5 xil yangi fon generatsiya qilmoqda...</i>",
        parse_mode="HTML"
    )

    try:
        # Get highest resolution photo
        highest_photo = message.photo[-1]
        file_info = await bot.get_file(highest_photo.file_id)
        photo_bytes_io = io.BytesIO()
        await bot.download_file(file_info.file_path, destination=photo_bytes_io)
        raw_image_bytes = photo_bytes_io.getvalue()

        # Step 3: Google AI Studio Gemini Vision & Dynamic Cards
        ai_service = google_ai_service or GoogleAIStudioService()
        catalog_data = await ai_service.analyze_and_generate_cards(raw_image_bytes)

        cards = catalog_data.get("studio_cards", [])
        if not cards or len(cards) < 5:
            cards = await image_gen_service.generate_5_studio_cards(catalog_data)

        # Step 4: Deliver 5 Cards as Telegram Media Group (Album)
        media_group = []
        for idx, card in enumerate(cards):
            media_item = types.InputMediaPhoto(
                media=card["image_url"],
                caption=f"📸 <b>Kartochka {idx + 1}: {card['style']}</b>\n🏷 <i>Tavsiya etilgan belgi: {card['badge']}</i>" if idx == 0 else ""
            )
            media_group.append(media_item)

        await message.answer_media_group(media=media_group)

        # Cache SEO data for this user
        PENDING_SEO_DATA[user_id] = catalog_data

        # Step 5: ASK USER if they need the SEO text!
        builder = InlineKeyboardBuilder()
        builder.button(text="✅ Ha, SEO matn kerak", callback_data=f"seo_yes:{user_id}")
        builder.button(text="❌ Yo'q, faqat kartochkalar kifoya", callback_data="seo_no")
        builder.adjust(1)

        ask_text = (
            "🎉 <b>5 ta yangi professional studiya kartochkasi tayyor!</b>\n\n"
            "📝 <b>Uzum Market va Wildberries uchun SEO matn (sarlavha, bullet points va teglar) kerakmi?</b>"
        )

        await message.answer(ask_text, reply_markup=builder.as_markup(), parse_mode="HTML")

        # Deduct credit and save database record
        user.credits -= 1
        record = CardGeneration(
            user_id=user_id,
            original_image_url=f"tg_file_{highest_photo.file_id}",
            product_metadata=catalog_data,
            generated_image_urls=[c["image_url"] for c in cards],
            cost_usd=0.024
        )
        session.add(record)
        await session.commit()

        # Delete progress message
        await status_msg.delete()

    except Exception as e:
        logger.exception(f"Error processing zero-prompt photo upload: {e}")
        await status_msg.edit_text(
            "❌ <b>Xatolik yuz berdi.</b>\n"
            "Iltimos, qaytadan urinib ko'ring yoki sifatliroq rasm yuboring.",
            parse_mode="HTML"
        )


@router.callback_query(lambda c: c.data.startswith("seo_yes:"))
async def handle_seo_yes(callback: types.CallbackQuery):
    """Triggered when user clicks 'Ha, SEO matn kerak'."""
    user_id = callback.from_user.id
    seo_data = PENDING_SEO_DATA.get(user_id)

    if not seo_data:
        await callback.message.answer(
            "Ma'lumotlar yangilandi. Iltimos, yangi mahsulot rasmini yuboring.",
            parse_mode="HTML"
        )
        await callback.answer()
        return

    bullets_uz = "\n".join(seo_data.get("bullet_points_uz", []))
    bullets_ru = "\n".join(seo_data.get("bullet_points_ru", []))
    tags_uz = " ".join(seo_data.get("seo_tags_uz", []))
    tags_ru = " ".join(seo_data.get("seo_tags_ru", []))

    seo_caption = (
        "📋 <b>Sizning mahsulotingiz uchun tayyor SEO tavsifi:</b>\n\n"
        f"🟣 <b>UZUM MARKET (O'zbekcha):</b>\n"
        f"📌 <b>Sarlavha:</b> <code>{seo_data.get('uzum_title_uz', '')}</code>\n\n"
        f"📋 <b>Afzalliklari:</b>\n{bullets_uz}\n\n"
        f"🏷 <b>Teglar:</b> {tags_uz}\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        f"🟣 <b>UZUM & WILDBERRIES (Русский):</b>\n"
        f"📌 <b>Название:</b> <code>{seo_data.get('uzum_title_ru', '')}</code>\n\n"
        f"📋 <b>Преимущества:</b>\n{bullets_ru}\n\n"
        f"🏷 <b>Теги:</b> {tags_ru}\n\n"
        "💡 <i>Yuqoridagi matnlarni nusxalab, to'g'ridan-to'g'ri Uzum yoki Wildberries sotuvchi kabinetiga joylang!</i>"
    )

    await callback.message.answer(seo_caption, parse_mode="HTML")
    await callback.answer("SEO matn yuborildi!")


@router.callback_query(lambda c: c.data == "seo_no")
async def handle_seo_no(callback: types.CallbackQuery):
    """Triggered when user clicks 'Yo'q, faqat kartochkalar kifoya'."""
    await callback.message.answer(
        "👌 <b>Tushunarli!</b> Faqat studiya kartochkalari saqlandi.\n\n"
        "📸 Keyingi mahsulot rasmini yuborishingiz mumkin!",
        parse_mode="HTML"
    )
    await callback.answer()
