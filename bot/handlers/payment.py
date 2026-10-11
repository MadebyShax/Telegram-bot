import logging
from aiogram import Router, types, F
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from services.payment_service import PaymentService
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="payment")


@router.callback_query(lambda c: c.data == "buy_credits")
async def handle_buy_credits_prompt(callback: types.CallbackQuery):
    """
    Shows payment options for 5 AI product cards package via Click and Payme.
    """
    builder = InlineKeyboardBuilder()
    builder.button(text="🔵 Click orqali to'lash (15,000 UZS)", callback_data="pay_click")
    builder.button(text="🟢 Payme orqali to'lash (15,000 UZS)", callback_data="pay_payme")
    builder.adjust(1)

    text = (
        "💳 <b>Balansni to'ldirish</b>\n\n"
        f"Paket: <b>5 ta professional AI kartochka + SEO matn</b>\n"
        f"Narxi: <b>{settings.PACKAGE_PRICE_UZS:,.0f} UZS</b>\n\n"
        "To'lov turini tanlang. To'lov to'g'ridan-to'g'ri Telegram ichida amalga oshiriladi:"
    )

    await callback.message.answer(text, reply_markup=builder.as_markup(), parse_mode="HTML")
    await callback.answer()


@router.callback_query(lambda c: c.data in ("pay_click", "pay_payme"))
async def handle_send_invoice(callback: types.CallbackQuery, payment_service: PaymentService):
    provider = "CLICK" if callback.data == "pay_click" else "PAYME"
    await payment_service.send_invoice(
        chat_id=callback.from_user.id,
        provider=provider,
        amount_uzs=settings.PACKAGE_PRICE_UZS,
        cards_count=settings.CARDS_PER_PACKAGE
    )
    await callback.answer()


@router.pre_checkout_query()
async def handle_pre_checkout(pre_checkout_query: types.PreCheckoutQuery, payment_service: PaymentService):
    """
    Telegram requires confirming pre-checkout within 10 seconds.
    """
    await payment_service.handle_pre_checkout(pre_checkout_query)


@router.message(F.successful_payment)
async def handle_successful_payment(
    message: types.Message,
    payment_service: PaymentService,
    session: AsyncSession
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

    text = (
        "✅ <b>To'lov muvaffaqiyatli qabul qilindi!</b>\n\n"
        f"To'langan summa: <b>{payment.total_amount / 100:,.0f} UZS</b>\n"
        f"Sizning yangi balansingiz: <b>{new_credits} ta paket</b> ({new_credits * 5} ta kartochka)\n\n"
        "📸 Endi mahsulot rasmini yuboring va natijani oling!"
    )

    await message.answer(text, parse_mode="HTML")
