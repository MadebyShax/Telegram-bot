import logging
from aiogram import Router, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="start")


@router.message(CommandStart())
async def handle_start(message: types.Message, session: AsyncSession):
    """
    Welcomes user, prompts for language and phone registration to grant free bonus pack.
    """
    user_id = message.from_user.id
    username = message.from_user.username
    full_name = message.from_user.full_name

    # Check or create user
    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            telegram_id=user_id,
            username=username,
            full_name=full_name,
            credits=0,  # Given after phone registration
            is_phone_verified=False,
            language="uz"
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    # If phone is not verified, prompt for contact verification to get 1 free bonus pack!
    if not user.is_phone_verified:
        contact_kb = ReplyKeyboardMarkup(
            keyboard=[
                [
                    KeyboardButton(
                        text="📱 Telefon raqamni yuborish (+1 Bepul Paket Olish)",
                        request_contact=True
                    )
                ]
            ],
            resize_keyboard=True,
            one_time_keyboard=True
        )

        welcome_text = (
            f"Assalomu alaykum, <b>{full_name}</b>!\n\n"
            "⚡️ <b>Zero-Prompt E-Commerce AI Botiga xush kelibsiz!</b>\n"
            "Uzum Market, Wildberries va Instagram uchun professional studiya kartochkalari generatori.\n\n"
            "🎁 <b>Xush kelibsiz bonusi:</b>\n"
            "Pastdagi tugmani bosib, telefon raqamingizni tasdiqlang va darhol <b>1 ta bepul paket (5 ta studiya kartochkasi + to'liq SEO tavsif)</b> ga ega bo'ling!"
        )

        await message.answer(welcome_text, reply_markup=contact_kb, parse_mode="HTML")
        return

    # If phone is already verified
    builder = InlineKeyboardBuilder()
    builder.button(text="💳 5 ta kartochka sotib olish (15,000 UZS)", callback_data="buy_credits")
    builder.button(text="🌐 Tilni o'zgartirish / Язык / Language", callback_data="change_lang")
    builder.button(text="ℹ️ Qanday ishlaydi?", callback_data="how_it_works")
    builder.adjust(1)

    text = (
        f"Xush kelibsiz, <b>{full_name}</b>!\n\n"
        "📸 <b>Shunchaki mahsulotingiz rasmini yuboring!</b> Hech qanday prompt yozish shart emas.\n\n"
        f"💰 <b>Sizning balansingiz:</b> <code>{user.credits}</code> ta paket ({user.credits * 5} ta kartochka)\n\n"
        "👉 Boshlash uchun hoziroq mahsulot rasmini chatga tashlang!"
    )

    await message.answer(text, reply_markup=builder.as_markup(), parse_mode="HTML")


@router.message(F.contact)
async def handle_contact_verification(message: types.Message, session: AsyncSession):
    """
    Verifies phone number and grants +1 free trial bonus pack (5 cards).
    """
    contact = message.contact
    user_id = message.from_user.id

    # Security check: verify contact belongs to the user
    if contact.user_id != user_id:
        await message.answer(
            "⚠️ Iltimos, faqat o'zingizning Telegram hisobingizga tegishli telefon raqamni yuboring.",
            parse_mode="HTML"
        )
        return

    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(telegram_id=user_id, username=message.from_user.username, full_name=message.from_user.full_name)
        session.add(user)

    if user.is_phone_verified:
        await message.answer(
            "Siz allaqachon ro'yxatdan o'tgansiz! Mahsulot rasmini yuborishingiz mumkin.",
            reply_markup=ReplyKeyboardRemove(),
            parse_mode="HTML"
        )
        return

    # Mark as verified and grant +1 bonus pack
    user.phone_number = contact.phone_number
    user.is_phone_verified = True
    user.credits += 1  # 1 FREE BONUS PACK!
    await session.commit()

    builder = InlineKeyboardBuilder()
    builder.button(text="ℹ️ Qanday ishlaydi?", callback_data="how_it_works")
    builder.button(text="🌐 Til / Язык / Language", callback_data="change_lang")

    text = (
        "🎉 <b>Tabriklaymiz! Telefon raqamingiz muvaffaqiyatli tasdiqlandi.</b>\n\n"
        f"📞 <b>Raqam:</b> <code>{contact.phone_number}</code>\n"
        f"🎁 <b>Bonus:</b> <b>+1 ta bepul paket (5 ta studiya kartochkasi)</b> hisobingizga qo'shildi!\n\n"
        "📸 <b>Endi mahsulotingiz rasmini chatga yuboring</b> — sun'iy intellekt uni avtomatik studiya darajasiga olib chiqadi!"
    )

    await message.answer(text, reply_markup=ReplyKeyboardRemove(), parse_mode="HTML")
    await message.answer("Boshlashga tayyormisiz?", reply_markup=builder.as_markup())


@router.callback_query(lambda c: c.data == "change_lang")
async def handle_change_language_prompt(callback: types.CallbackQuery):
    builder = InlineKeyboardBuilder()
    builder.button(text="🇺🇿 O'zbekcha", callback_data="set_lang_uz")
    builder.button(text="🇷🇺 Русский", callback_data="set_lang_ru")
    builder.button(text="🇬🇧 English", callback_data="set_lang_en")
    builder.adjust(1)

    text = "🌐 <b>Tilni tanlang / Выберите язык / Select language:</b>"
    await callback.message.answer(text, reply_markup=builder.as_markup(), parse_mode="HTML")
    await callback.answer()


@router.callback_query(lambda c: c.data.startswith("set_lang_"))
async def handle_set_language(callback: types.CallbackQuery, session: AsyncSession):
    lang_code = callback.data.replace("set_lang_", "")
    user_id = callback.from_user.id

    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    if user:
        user.language = lang_code
        await session.commit()

    confirm_map = {
        "uz": "✅ Til <b>O'zbekcha</b> ga o'zgartirildi! Endi mahsulot rasmini yuborishingiz mumkin.",
        "ru": "✅ Язык изменен на <b>Русский</b>! Теперь вы можете отправить фото товара.",
        "en": "✅ Language updated to <b>English</b>! You can now send your product photo."
    }

    await callback.message.answer(confirm_map.get(lang_code, "✅ Til o'zgartirildi!"), parse_mode="HTML")
    await callback.answer()


@router.callback_query(lambda c: c.data == "how_it_works")
async def handle_how_it_works(callback: types.CallbackQuery):
    text = (
        "📖 <b>Zero-Prompt qanday ishlaydi?</b>\n\n"
        "1. Telefoningizda mahsulotni oddiy stol ustida yoki qo'lda suratga oling.\n"
        "2. Rasmni to'g'ridan-to'g'ri ushbu botga yuboring.\n"
        "3. Sun'iy intellekt orqa fonni tozalab, mahsulotni 5 xil zamonaviy studiya interyeriga joylaydi:\n"
        "   • Minimalist travertin poydevor\n"
        "   • Issiq tabiiy xonadon atmosferasi\n"
        "   • Hashamatli qorong'u vitrina\n"
        "   • Infografika uchun qulay oq fon\n"
        "   • Makro detallar va sifat fokus\n"
        "4. Uzum va Wildberries qoidalariga to'liq mos keladigan SEO sarlavha va kalit so'zlarni olasiz.\n\n"
        "📊 <b>Prezentatsiya rejimi (NotebookLM uslubi):</b>\n"
        "Mahsulot rasmidan hech qanday ortiqcha so'zsiz 5 ta vizual taqdimot slaydlari (Pitch Deck) yaratib olish imkoniyati!"
    )
    await callback.message.answer(text, parse_mode="HTML")
    await callback.answer()
