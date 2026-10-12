import logging
from decimal import Decimal
from aiogram import Bot
from aiogram.types import LabeledPrice, PreCheckoutQuery, SuccessfulPayment
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config import settings
from database.models import User, Transaction
from bot.i18n import t, DEFAULT_LANGUAGE

logger = logging.getLogger(__name__)

PAYLOAD_PREFIX = "credits_pack_"
CURRENCY = "UZS"
# One purchase always adds exactly one package (= CARDS_PER_PACKAGE cards)
CREDITS_PER_PURCHASE = 1


class PaymentService:
    """
    Manages Click API & Payme Merchant API integration via Telegram Native Payments.
    Enables Uzbek sellers to top up card generation credits in Uzbek So'm (UZS).
    """

    def __init__(self, bot: Bot):
        self.bot = bot

    @staticmethod
    def _expected_amount() -> int:
        # In Telegram Payments, UZS has 2 decimal digits (15000 UZS = 1,500,000 tiyin)
        return settings.PACKAGE_PRICE_UZS * 100

    async def send_invoice(self, chat_id: int, provider: str = "CLICK", lang: str = DEFAULT_LANGUAGE):
        """
        Sends native Telegram payment invoice in UZS.
        Provider can be 'CLICK' or 'PAYME'.
        """
        provider_token = (
            settings.CLICK_PROVIDER_TOKEN
            if provider.upper() == "CLICK"
            else settings.PAYME_PROVIDER_TOKEN
        )
        cards_count = settings.CARDS_PER_PACKAGE

        title = t(lang, "invoice_title", cards=cards_count)
        description = t(lang, "invoice_description", cards=cards_count)
        payload = f"{PAYLOAD_PREFIX}{provider.lower()}_{chat_id}"

        prices = [
            LabeledPrice(label=t(lang, "invoice_label", cards=cards_count), amount=self._expected_amount())
        ]

        logger.info(f"Sending {provider} invoice to user {chat_id} for {settings.PACKAGE_PRICE_UZS} UZS")

        await self.bot.send_invoice(
            chat_id=chat_id,
            title=title,
            description=description,
            payload=payload,
            provider_token=provider_token,
            currency=CURRENCY,
            prices=prices,
            start_parameter="buy-ai-cards",
            need_name=False,
            need_phone_number=False,
            need_email=False,
            need_shipping_address=False,
            is_flexible=False
        )

    def _is_valid_order(self, payload: str, currency: str, total_amount: int, telegram_id: int) -> bool:
        return (
            payload.startswith(PAYLOAD_PREFIX)
            and payload.endswith(f"_{telegram_id}")
            and currency == CURRENCY
            and total_amount == self._expected_amount()
        )

    async def handle_pre_checkout(self, pre_checkout_query: PreCheckoutQuery, lang: str = DEFAULT_LANGUAGE):
        """
        Validates the pre-checkout query within 10 seconds as required by Telegram Bot API.
        Rejects stale invoices (e.g. sent before a price change) and invoices issued to another user.
        """
        q = pre_checkout_query
        if self._is_valid_order(q.invoice_payload, q.currency, q.total_amount, q.from_user.id):
            logger.info(f"Approving PreCheckoutQuery {q.id} for user {q.from_user.id}")
            await self.bot.answer_pre_checkout_query(pre_checkout_query_id=q.id, ok=True)
            return

        logger.warning(
            f"Rejecting PreCheckoutQuery {q.id}: payload={q.invoice_payload} "
            f"amount={q.total_amount} {q.currency} user={q.from_user.id}"
        )
        await self.bot.answer_pre_checkout_query(
            pre_checkout_query_id=q.id,
            ok=False,
            error_message=t(lang, "invoice_expired")
        )

    async def handle_successful_payment(
        self,
        payment: SuccessfulPayment,
        telegram_id: int,
        session: AsyncSession
    ) -> int:
        """
        Processes confirmed payment, records transaction in DB,
        and adds one package to user balance (once per Telegram charge id).
        """
        # Telegram total_amount is in tiyin
        amount_uzs = Decimal(payment.total_amount) / Decimal(100)
        provider = "CLICK" if "click" in payment.invoice_payload.lower() else "PAYME"
        charge_id = payment.telegram_payment_charge_id

        logger.info(f"Payment successful: {amount_uzs} UZS via {provider} for user {telegram_id}, charge {charge_id}")

        stmt = select(User).where(User.telegram_id == telegram_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        duplicate = await session.execute(select(Transaction).where(Transaction.telegram_charge_id == charge_id))
        if duplicate.scalar_one_or_none():
            logger.warning(f"Charge {charge_id} was already processed, not crediting again")
            return user.credits if user else 0

        if not user:
            user = User(telegram_id=telegram_id, credits=CREDITS_PER_PURCHASE)
            session.add(user)
        else:
            user.credits += CREDITS_PER_PURCHASE

        session.add(Transaction(
            user_id=telegram_id,
            amount_uzs=amount_uzs,
            provider=provider,
            status="SUCCESS",
            telegram_charge_id=charge_id
        ))

        await session.commit()
        await session.refresh(user)

        return user.credits
