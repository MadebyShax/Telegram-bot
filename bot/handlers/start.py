import html
import logging
from aiogram import Router, types, F
from aiogram.filters import CommandStart
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, ReplyKeyboardRemove
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User
from bot.i18n import t, SUPPORTED_LANGUAGES
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="start")


@router.message(CommandStart())
async def handle_start(message: types.Message, session: AsyncSession, lang: str):
    """
    Welcomes user, prompts for phone registration to grant free bonus pack.
    """
    user_id = message.from_user.id
    full_name = message.from_user.full_name
    safe_name = html.escape(full_name or "")

    # Check or create user
    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            telegram_id=user_id,
            username=message.from_user.username,
            full_name=full_name,
            credits=0,  # Given after phone registration
            is_phone_verified=False,
            language=lang  # guessed from the Telegram app language, can be changed later
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    # If phone is not verified, prompt for contact verification to get the free bonus pack!
    if not user.is_phone_verified:
        contact_kb = ReplyKeyboardMarkup(
            keyboard=[[
                KeyboardButton(
                    text=t(lang, "btn_share_phone", packs=settings.FREE_TRIAL_CREDITS),
                    request_contact=True
                )
            ]],
            resize_keyboard=True,
            one_time_keyboard=True
        )
        welcome_text = t(
            lang, "welcome_new",
            name=safe_name,
            packs=settings.FREE_TRIAL_CREDITS,
            cards=settings.FREE_TRIAL_CREDITS * settings.CARDS_PER_PACKAGE
        )
        await message.answer(welcome_text, reply_markup=contact_kb, parse_mode="HTML")
        return

    # If phone is already verified
    builder = InlineKeyboardBuilder()
    builder.button(
        text=t(lang, "btn_buy", cards=settings.CARDS_PER_PACKAGE, price=f"{settings.PACKAGE_PRICE_UZS:,}"),
        callback_data="buy_credits"
    )
    builder.button(text=t(lang, "btn_lang"), callback_data="change_lang")
    builder.button(text=t(lang, "btn_how"), callback_data="how_it_works")
    builder.adjust(1)

    text = t(
        lang, "welcome_back",
        name=safe_name,
        credits=user.credits,
        cards=user.credits * settings.CARDS_PER_PACKAGE
    )
    await message.answer(text, reply_markup=builder.as_markup(), parse_mode="HTML")


@router.message(F.contact)
async def handle_contact_verification(message: types.Message, session: AsyncSession, lang: str):
    """
    Verifies phone number and grants the free trial bonus pack.
    """
    contact = message.contact
    user_id = message.from_user.id

    # Security check: verify contact belongs to the user
    if contact.user_id != user_id:
        await message.answer(t(lang, "contact_not_own"), parse_mode="HTML")
        return

    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            telegram_id=user_id,
            username=message.from_user.username,
            full_name=message.from_user.full_name,
            credits=0,
            is_phone_verified=False,
            language=lang
        )
        session.add(user)

    if user.is_phone_verified:
        await message.answer(t(lang, "already_registered"), reply_markup=ReplyKeyboardRemove(), parse_mode="HTML")
        return

    # Mark as verified and grant the bonus pack
    user.phone_number = contact.phone_number
    user.is_phone_verified = True
    user.credits += settings.FREE_TRIAL_CREDITS
    await session.commit()

    builder = InlineKeyboardBuilder()
    builder.button(text=t(lang, "btn_how"), callback_data="how_it_works")
    builder.button(text=t(lang, "btn_lang"), callback_data="change_lang")

    text = t(
        lang, "phone_verified",
        phone=html.escape(contact.phone_number),
        packs=settings.FREE_TRIAL_CREDITS,
        cards=settings.FREE_TRIAL_CREDITS * settings.CARDS_PER_PACKAGE
    )
    await message.answer(text, reply_markup=ReplyKeyboardRemove(), parse_mode="HTML")
    await message.answer(t(lang, "ready_to_start"), reply_markup=builder.as_markup())


@router.callback_query(F.data == "change_lang")
async def handle_change_language_prompt(callback: types.CallbackQuery, lang: str):
    builder = InlineKeyboardBuilder()
    builder.button(text="🇺🇿 O'zbekcha", callback_data="set_lang_uz")
    builder.button(text="🇷🇺 Русский", callback_data="set_lang_ru")
    builder.button(text="🇬🇧 English", callback_data="set_lang_en")
    builder.adjust(1)

    await callback.message.answer(t(lang, "choose_language"), reply_markup=builder.as_markup(), parse_mode="HTML")
    await callback.answer()


@router.callback_query(F.data.startswith("set_lang_"))
async def handle_set_language(callback: types.CallbackQuery, session: AsyncSession):
    new_lang = callback.data.replace("set_lang_", "")
    if new_lang not in SUPPORTED_LANGUAGES:
        await callback.answer()
        return

    stmt = select(User).where(User.telegram_id == callback.from_user.id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()
    if user:
        user.language = new_lang
        await session.commit()

    # Reply already in the newly selected language
    await callback.message.answer(t(new_lang, "language_changed"), parse_mode="HTML")
    await callback.answer()


@router.callback_query(F.data == "how_it_works")
async def handle_how_it_works(callback: types.CallbackQuery, lang: str):
    await callback.message.answer(t(lang, "how_it_works"), parse_mode="HTML")
    await callback.answer()
