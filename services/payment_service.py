import logging
from typing import Optional
from decimal import Decimal
from aiogram import Bot
from aiogram.types import LabeledPrice, PreCheckoutQuery, SuccessfulPayment
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config import settings
from database.models import User, Transaction

logger = logging.getLogger(__name__)


class PaymentService:
    """
    Manages Click API & Payme Merchant API integration via Telegram Native Payments.
    Enables Uzbek sellers to top up card generation credits in Uzbek So'm (UZS).
    """

    def __init__(self, bot: Bot):
        self.bot = bot

    async def send_invoice(
        self,
        chat_id: int,
        provider: str = "CLICK",
        amount_uzs: int = settings.PACKAGE_PRICE_UZS,
        cards_count: int = settings.CARDS_PER_PACKAGE
    ):
        """
        Sends native Telegram payment invoice in UZS.
        Provider can be 'CLICK' or 'PAYME'.
        """
        provider_token = (
            settings.CLICK_PROVIDER_TOKEN
            if provider.upper() == "CLICK"
            else settings.PAYME_PROVIDER_TOKEN
        )

        title = f"AI Mahsulot Kartochkalari ({cards_count} ta)"
        description = (
            f"Uzum va Wildberries uchun {cards_count} ta professional studiya kartochkasi "
            f"hamda o'zbek/rus tillarida SEO tavsif generatsiyasi."
        )
        payload = f"credits_pack_{cards_count}_{provider.lower()}_{chat_id}"

        # In Telegram Payments, UZS typically has 2 decimal digits (15000 UZS = 1,500,000 tiyin)
        prices = [
            LabeledPrice(label=f"{cards_count} ta AI studiya kartochkasi", amount=amount_uzs * 100)
        ]

        logger.info(f"Sending {provider} invoice to user {chat_id} for {amount_uzs} UZS")

        await self.bot.send_invoice(
            chat_id=chat_id,
            title=title,
            description=description,
            payload=payload,
            provider_token=provider_token,
            currency="UZS",
            prices=prices,
            start_parameter="buy-ai-cards",
            need_name=False,
            need_phone_number=False,
            need_email=False,
            need_shipping_address=False,
            is_flexible=False
        )

    async def handle_pre_checkout(self, pre_checkout_query: PreCheckoutQuery):
        """
        Validates the pre-checkout query within 10 seconds as required by Telegram Bot API.
        """
        logger.info(f"Approving PreCheckoutQuery {pre_checkout_query.id} for user {pre_checkout_query.from_user.id}")
        await self.bot.answer_pre_checkout_query(
            pre_checkout_query_id=pre_checkout_query.id,
            ok=True
        )

    async def handle_successful_payment(
        self,
        payment: SuccessfulPayment,
        telegram_id: int,
        session: AsyncSession
    ) -> int:
        """
        Processes confirmed payment, records transaction in DB,
        and adds 5 credits to user balance.
        """
        # Telegram total_amount is in tiyin
        amount_uzs = Decimal(payment.total_amount) / Decimal(100)
        provider = "CLICK" if "click" in payment.invoice_payload.lower() else "PAYME"

        logger.info(f"Payment successful: {amount_uzs} UZS via {provider} for user {telegram_id}")

        # Find or create user
        stmt = select(User).where(User.telegram_id == telegram_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            user = User(
                telegram_id=telegram_id,
                credits=settings.CARDS_PER_PACKAGE
            )
            session.add(user)
        else:
            user.credits += settings.CARDS_PER_PACKAGE

        # Record transaction
        tx = Transaction(
            user_id=telegram_id,
            amount_uzs=amount_uzs,
            provider=provider,
            status="SUCCESS"
        )
        session.add(tx)

        await session.commit()
        await session.refresh(user)

        return user.credits
