import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher, BaseMiddleware
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import TelegramObject
from sqlalchemy import select

from config import settings
from database.db import AsyncSessionFactory, init_db
from database.models import User
from bot.handlers import setup_handlers
from bot.i18n import DEFAULT_LANGUAGE, detect_language, normalize_language
from services.payment_service import PaymentService
from services.google_ai_studio_service import GoogleAIStudioService

logger = logging.getLogger("EcommerceAICardBot")


def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[logging.StreamHandler(sys.stdout)]
    )


class DependencyInjectionMiddleware(BaseMiddleware):
    """
    Injects database session, service instances and the user's language ("lang") into handler arguments.
    Enforces clean dependency injection pattern across all Aiogram handlers.
    """

    def __init__(self, payment_service: PaymentService, google_ai_service: GoogleAIStudioService):
        super().__init__()
        self.payment_service = payment_service
        self.google_ai_service = google_ai_service

    async def __call__(self, handler, event: TelegramObject, data: dict):
        async with AsyncSessionFactory() as session:
            data["session"] = session
            data["payment_service"] = self.payment_service
            data["google_ai_service"] = self.google_ai_service
            data["lang"] = await self._resolve_language(session, data.get("event_from_user"))
            return await handler(event, data)

    @staticmethod
    async def _resolve_language(session, tg_user) -> str:
        """Saved language of a registered user, otherwise a guess from the Telegram app language."""
        if tg_user is None:
            return DEFAULT_LANGUAGE
        result = await session.execute(select(User.language).where(User.telegram_id == tg_user.id))
        saved = result.scalar_one_or_none()
        return normalize_language(saved) if saved else detect_language(tg_user.language_code)


async def create_bot_and_dispatcher() -> tuple[Bot, Dispatcher]:
    """Initializes the database and configures the Aiogram 3.x bot. Shared by bot/main.py and app.py."""
    # Every handler needs the database, so there is no point in starting without it
    await init_db()
    logger.info("Database schema initialized successfully.")

    if not settings.GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set: card generation will fail and credits will be refunded.")

    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher()

    dp.update.middleware(DependencyInjectionMiddleware(
        payment_service=PaymentService(bot=bot),
        google_ai_service=GoogleAIStudioService()
    ))
    dp.include_router(setup_handlers())

    return bot, dp


async def main():
    logger.info("Initializing EcommerceAICardBot...")
    bot, dp = await create_bot_and_dispatcher()

    logger.info("Starting bot polling mode (Zero-prompt listener active)...")
    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    finally:
        await bot.session.close()


if __name__ == "__main__":
    setup_logging()
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("EcommerceAICardBot stopped.")
