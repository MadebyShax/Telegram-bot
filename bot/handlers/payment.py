import logging
from aiogram import Router, types, F
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from services.payment_service import PaymentService
from bot.i18n import t
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="payment")


def payment_keyboard(lang: str, columns: int = 1):
    """Click / Payme buttons, shared with the upload handler."""
    price = f"{settings.PACKAGE_PRICE_UZS:,}"
    builder = InlineKeyboardBuilder()
    builder.button(text=t(lang, "btn_pay_click", price=price), callback_data="pay_click")
    builder.button(text=t(lang, "btn_pay_payme", price=price), callback_data="pay_payme")
    builder.adjust(columns)
    return builder.as_markup()


@router.callback_query(F.data == "buy_credits")
async def handle_buy_credits_prompt(callback: types.CallbackQuery, lang: str):
    """
    Shows payment options for the AI product cards package via Click and Payme.
    """
    text = t(
        lang, "topup_title",
        cards=settings.CARDS_PER_PACKAGE,
        price=f"{settings.PACKAGE_PRICE_UZS:,.0f}"
    )
    await callback.message.answer(text, reply_markup=payment_keyboard(lang), parse_mode="HTML")
    await callback.answer()


@router.callback_query(F.data.in_({"pay_click", "pay_payme"}))
async def handle_send_invoice(callback: types.CallbackQuery, payment_service: PaymentService, lang: str):
    provider = "CLICK" if callback.data == "pay_click" else "PAYME"
    await payment_service.send_invoice(chat_id=callback.from_user.id, provider=provider, lang=lang)
    await callback.answer()


@router.pre_checkout_query()
async def handle_pre_checkout(pre_checkout_query: types.PreCheckoutQuery, payment_service: PaymentService, lang: str):
    """
    Telegram requires confirming pre-checkout within 10 seconds.
    """
    await payment_service.handle_pre_checkout(pre_checkout_query, lang=lang)


@router.message(F.successful_payment)
async def handle_successful_payment(
    message: types.Message,
    payment_service: PaymentService,
    session: AsyncSession,
    lang: str
):
    """
    Triggered when user successfully pays via Click or Payme.
    """
    payment = message.successful_payment
    new_credits = await payment_service.handle_successful_payment(
        payment=payment,
        telegram_id=message.from_user.id,
        session=session
    )

    text = t(
        lang, "payment_success",
        amount=f"{payment.total_amount / 100:,.0f}",
        credits=new_credits,
        cards=new_credits * settings.CARDS_PER_PACKAGE
    )
    await message.answer(text, parse_mode="HTML")
