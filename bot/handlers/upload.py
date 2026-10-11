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

# In-memory cache for pending photo bytes and SEO data per user
PENDING_PHOTO_UPLOADS: dict[int, bytes] = {}
PENDING_SEO_DATA: dict[int, dict] = {}


@router.message(F.photo)
async def handle_product_photo(
    message: types.Message,
    bot: Bot,
    session: AsyncSession
):
    """
    Zero-prompt workflow:
    User uploads raw product photo without writing anything.
    1. Verifies credits.
    2. Downloads and caches photo in memory.
    3. Asks user whether infographics is needed or clean photo is preferred!
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

    # 2. Download and cache photo
    try:
        highest_photo = message.photo[-1]
        file_info = await bot.get_file(highest_photo.file_id)
        photo_bytes_io = io.BytesIO()
        await bot.download_file(file_info.file_path, destination=photo_bytes_io)
        raw_image_bytes = photo_bytes_io.getvalue()
        PENDING_PHOTO_UPLOADS[user_id] = raw_image_bytes

        # 3. Ask about Infographics (Infografika so'ralsin va marketlar yozuvi kerakmas)
        builder = InlineKeyboardBuilder()
        builder.button(text="✨ Ha, infografika bilan", callback_data=f"info_yes:{user_id}")
        builder.button(text="📸 Yo'q, toza fotosurat", callback_data=f"info_no:{user_id}")
        builder.adjust(1)

        ask_infographics_text = (
            "📸 <b>Mahsulot surati qabul qilindi!</b>\n\n"
            "📊 <b>Mahsulot kartochkalariga Infografika qo'shilsinmi?</b>\n\n"
            "✨ <b>Ha, infografika bilan</b> — mahsulotning asosiy afzalliklari, xususiyatlari va vizual belgilari bilan\n"
            "📸 <b>Yo'q, toza fotosurat</b> — hech qanday yozuv va belgilarsiz toza studiya suratlari"
        )

        await message.answer(ask_infographics_text, reply_markup=builder.as_markup(), parse_mode="HTML")

    except Exception as e:
        logger.exception(f"Error caching product photo: {e}")
        await message.answer(
            "❌ <b>Rasmni qabul qilishda xatolik yuz berdi.</b>\n"
            "Iltimos, qaytadan urinib ko'ring.",
            parse_mode="HTML"
        )


@router.callback_query(lambda c: c.data.startswith("info_yes:") or c.data.startswith("info_no:"))
async def handle_infographics_selection(
    callback: types.CallbackQuery,
    session: AsyncSession,
    image_gen_service: ImageGenService,
    google_ai_service: Optional[GoogleAIStudioService] = None
):
    """
    Handles user choice for Infographics (Yes vs No) and proceeds to generate 5 cards.
    """
    user_id = callback.from_user.id
    with_infographics = callback.data.startswith("info_yes:")
    raw_image_bytes = PENDING_PHOTO_UPLOADS.get(user_id)

    if not raw_image_bytes:
        await callback.message.answer(
            "⚠️ Rasm sessiyasi muddati tugadi. Iltimos, mahsulot rasmini qaytadan yuboring.",
            parse_mode="HTML"
        )
        await callback.answer()
        return

    # Check credits
    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or user.credits <= 0:
        await callback.answer("Balansingizda paketlar yetarli emas!", show_alert=True)
        return

    choice_text = (
        "✨ <b>Infografika tanlandi.</b> Mahsulot afzalliklari va belgilari bilan kartochkalar tayyorlanmoqda..."
        if with_infographics
        else "📸 <b>Toza fotosurat tanlandi.</b> Yozuv va belgilarsiz toza studiya suratlari tayyorlanmoqda..."
    )

    status_msg = await callback.message.answer(
        f"⏳ <b>Google AI Studio tahlil qilmoqda...</b>\n<i>{choice_text}</i>",
        parse_mode="HTML"
    )
    await callback.answer()

    try:
        # Step 1: Google AI Studio Gemini Vision & Dynamic Cards
        ai_service = google_ai_service or GoogleAIStudioService()
        catalog_data = await ai_service.analyze_and_generate_cards(
            raw_image_bytes,
            include_infographics=with_infographics
        )

        cards = catalog_data.get("studio_cards", [])
        if not cards or len(cards) < 5:
            cards = await image_gen_service.generate_5_studio_cards(catalog_data)

        # Enforce clean photo if infographics is disabled
        if not with_infographics:
            for c in cards:
                c["badge"] = ""

        # Step 2: Deliver 5 Cards as Telegram Media Group (Album)
        media_group = []
        for idx, card in enumerate(cards):
            caption = ""
            if idx == 0:
                if with_infographics and card.get("badge"):
                    caption = f"📸 <b>Kartochka 1: {card['style']}</b>\n🏷 <i>Afzallik belgisi: {card['badge']}</i>"
                else:
                    caption = f"📸 <b>Kartochka 1: {card['style']}</b>\n✨ <i>Toza studiya fotosessiyasi</i>"

            media_item = types.InputMediaPhoto(
                media=card["image_url"],
                caption=caption,
                parse_mode="HTML" if caption else None
            )
            media_group.append(media_item)

        await callback.message.answer_media_group(media=media_group)

        # Cache SEO data for this user
        PENDING_SEO_DATA[user_id] = catalog_data

        # Step 3: Ask user if they need the SEO copy (NO marketplace brand names!)
        builder = InlineKeyboardBuilder()
        builder.button(text="✅ Ha, SEO matn kerak", callback_data=f"seo_yes:{user_id}")
        builder.button(text="❌ Yo'q, faqat kartochkalar kifoya", callback_data="seo_no")
        builder.adjust(1)

        ask_seo_text = (
            "🎉 <b>5 ta yangi professional studiya kartochkasi tayyor!</b>\n\n"
            "📝 <b>Mahsulot uchun professional SEO tavsifi (sarlavha, afzalliklar va qidiruv teglari) kerakmi?</b>"
        )

        await callback.message.answer(ask_seo_text, reply_markup=builder.as_markup(), parse_mode="HTML")

        # Deduct credit and save database record
        user.credits -= 1
        record = CardGeneration(
            user_id=user_id,
            original_image_url="tg_user_upload",
            product_metadata=catalog_data,
            generated_image_urls=[c["image_url"] for c in cards],
            cost_usd=0.024
        )
        session.add(record)
        await session.commit()

        # Delete progress message
        await status_msg.delete()

    except Exception as e:
        logger.exception(f"Error processing card generation: {e}")
        await status_msg.edit_text(
            "❌ <b>Xatolik yuz berdi.</b>\n"
            "Iltimos, qaytadan urinib ko'ring yoki sifatliroq rasm yuboring.",
            parse_mode="HTML"
        )


@router.callback_query(lambda c: c.data.startswith("seo_yes:"))
async def handle_seo_yes(callback: types.CallbackQuery):
    """Triggered when user clicks 'Ha, SEO matn kerak' (NO marketplace brand names)."""
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
        "🇺🇿 <b>O'zbek tilida:</b>\n"
        f"📌 <b>Sarlavha:</b> <code>{seo_data.get('uzum_title_uz', '')}</code>\n\n"
        f"📋 <b>Afzalliklari:</b>\n{bullets_uz}\n\n"
        f"🏷 <b>Qidiruv teglari:</b> {tags_uz}\n\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        "🇷🇺 <b>На русском языке:</b>\n"
        f"📌 <b>Название:</b> <code>{seo_data.get('uzum_title_ru', '')}</code>\n\n"
        f"📋 <b>Преимущества:</b>\n{bullets_ru}\n\n"
        f"🏷 <b>Поисковые теги:</b> {tags_ru}\n\n"
        "💡 <i>Nusxalab oling va mahsulot kartochkangizga joylashtiring!</i>"
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
