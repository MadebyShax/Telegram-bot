import logging
from aiogram import Router, types
from aiogram.filters import CommandStart, Command
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
    Welcomes user and explains zero-prompt workflow.
    No need to write prompts: just send any product photo!
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
            credits=settings.FREE_TRIAL_CREDITS  # 1 free trial generation pack
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    builder = InlineKeyboardBuilder()
    builder.button(text="💳 5 ta kartochka sotib olish (15,000 UZS)", callback_data="buy_credits")
    builder.button(text="ℹ️ Qanday ishlaydi?", callback_data="how_it_works")
    builder.adjust(1)

    text = (
        f"Assalomu alaykum, <b>{full_name}</b>!\n\n"
        "⚡️ <b>Zero-Prompt E-Commerce AI Botiga xush kelibsiz!</b>\n\n"
        "Sizdan hech qanday murakkab prompt yoki matn talab qilinmaydi:\n"
        "📸 <b>Shunchaki mahsulotingiz rasmini yuboring!</b>\n\n"
        "Bot avtomatik tarzda:\n"
        "1️⃣ Mahsulot turi, rangi, materiali va shaklini aniqlaydi (GPT-4o Vision)\n"
        "2️⃣ Fonni olib tashlaydi va <b>5 xil premium studiya kartochkasi</b> yaratadi (Flux AI)\n"
        "3️⃣ <b>Uzum Market va Wildberries</b> uchun o'zbek/rus tillarida SEO sarlavha va tavsif tuzadi\n\n"
        f"💰 <b>Sizning balansingiz:</b> <code>{user.credits}</code> ta paket ({user.credits * 5} ta kartochka)\n"
        f"🎁 <i>Yangi foydalanuvchilar uchun 1 ta bepul paket taqdim etildi!</i>\n\n"
        "👉 Boshlash uchun hoziroq mahsulot rasmini chatga tashlang!"
    )

    await message.answer(text, reply_markup=builder.as_markup(), parse_mode="HTML")


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
        "4. Uzum va Wildberries qoidalariga to'liq mos keladigan SEO sarlavha va kalit so'zlarni olasiz."
    )
    await callback.message.answer(text, parse_mode="HTML")
    await callback.answer()
