import io
import logging
from aiogram import Router, types, F, Bot
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, CardGeneration
from services.vision_service import VisionService
from services.seo_service import SeoService
from services.image_gen_service import ImageGenService
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="upload")


@router.message(F.photo)
async def handle_product_photo(
    message: types.Message,
    bot: Bot,
    session: AsyncSession,
    vision_service: VisionService,
    seo_service: SeoService,
    image_gen_service: ImageGenService
):
    """
    Zero-prompt workflow:
    User uploads a raw product photo without writing anything.
    Bot verifies credits, executes vision analysis, generates SEO copy,
    renders 5 studio variations, and sends the finished media group!
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
        "⏳ <b>1/3: Mahsulot tahlil qilinmoqda...</b>\n"
        "<i>GPT-4o Vision mahsulot turi, rangi, materiali va shaklini aniqlamoqda...</i>",
        parse_mode="HTML"
    )

    try:
        # Get highest resolution photo
        highest_photo = message.photo[-1]
        file_info = await bot.get_file(highest_photo.file_id)
        photo_bytes_io = io.BytesIO()
        await bot.download_file(file_info.file_path, destination=photo_bytes_io)
        raw_image_bytes = photo_bytes_io.getvalue()

        # Step 3: Vision analysis
        metadata = await vision_service.analyze_product_image(raw_image_bytes)

        await status_msg.edit_text(
            "⏳ <b>2/3: SEO matn tayyorlanmoqda...</b>\n"
            f"<i>Mahsulot aniqlandi: <b>{metadata.get('product_name_uz', 'Mahsulot')}</b>\n"
            "Uzum Market va Wildberries uchun o'zbek/rus tavsiflari yozilmoqda...</i>",
            parse_mode="HTML"
        )

        # Step 4: SEO text generation
        seo_data = await seo_service.generate_marketplace_copy(metadata)

        await status_msg.edit_text(
            "⏳ <b>3/3: 5 xil studiya kartochkalari yaratilmoqda...</b>\n"
            "<i>Flux AI fonni tozalab, 5 xil professional e-commerce interyeriga joylashtirmoqda...</i>",
            parse_mode="HTML"
        )

        # Step 5: Studio Image Generation (5 cards)
        cards = await image_gen_service.generate_5_studio_cards(metadata)

        # Step 6: Deliver as Telegram Media Group (Album)
        media_group = []
        for idx, card in enumerate(cards):
            media_item = types.InputMediaPhoto(
                media=card["image_url"],
                caption=f"📸 <b>Kartochka {idx + 1}: {card['style']}</b>\n🏷 <i>Tavsiya etilgan belgi: {card['badge']}</i>" if idx == 0 else ""
            )
            media_group.append(media_item)

        # Send 5 photos as native Telegram media group
        await message.answer_media_group(media=media_group)

        # Send formatted bilingual SEO text
        seo_caption = (
            "🎉 <b>Tayyor! Mahsulotingiz uchun to'liq ma'lumotlar:</b>\n\n"
            f"🟣 <b>UZUM MARKET (O'zbekcha):</b>\n"
            f"📌 <b>Sarlavha:</b> <code>{seo_data.get('uzum_title_uz', '')}</code>\n\n"
            "📋 <b>Afzalliklari (Bullet points):</b>\n" +
            "\n".join(seo_data.get("bullet_points_uz", [])) +
            f"\n\n🏷 <b>Teglar:</b> {' '.join(seo_data.get('seo_tags_uz', []))}\n\n"
            "━━━━━━━━━━━━━━━━━━━━\n\n"
            f"🟣 <b>UZUM MARKET & WILDBERRIES (Русский):</b>\n"
            f"📌 <b>Название:</b> <code>{seo_data.get('uzum_title_ru', '')}</code>\n\n"
            "📋 <b>Преимущества:</b>\n" +
            "\n".join(seo_data.get("bullet_points_ru", [])) +
            f"\n\n🏷 <b>Теги:</b> {' '.join(seo_data.get('seo_tags_ru', []))}\n\n"
            "💡 <i>Yuqoridagi matnlarni nusxalab, to'g'ridan-to'g'ri sotuvchi kabinetiga joylashtirishingiz mumkin!</i>"
        )

        await message.answer(seo_caption, parse_mode="HTML")

        # Deduct credit and save database record
        user.credits -= 1
        record = CardGeneration(
            user_id=user_id,
            original_image_url=f"tg_file_{highest_photo.file_id}",
            product_metadata=metadata,
            generated_image_urls=[c["image_url"] for c in cards],
            generated_seo_text=seo_caption,
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
