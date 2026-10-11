import asyncio
import logging
import sys
from aiogram import Bot, Dispatcher, BaseMiddleware
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from aiogram.types import TelegramObject

from config import settings
from database.db import AsyncSessionFactory, init_db
from bot.handlers import setup_handlers
from services.vision_service import VisionService
from services.seo_service import SeoService
from services.image_gen_service import ImageGenService
from services.payment_service import PaymentService
from services.presentation_service import PresentationService
from services.google_ai_studio_service import GoogleAIStudioService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("EcommerceAICardBot")


class DependencyInjectionMiddleware(BaseMiddleware):
    """
    Injects database session and service instances into handler arguments.
    Enforces clean dependency injection pattern across all Aiogram handlers.
    """

    def __init__(
        self,
        vision_service: VisionService,
        seo_service: SeoService,
        image_gen_service: ImageGenService,
        payment_service: PaymentService,
        presentation_service: PresentationService,
        google_ai_service: GoogleAIStudioService
    ):
        super().__init__()
        self.vision_service = vision_service
        self.seo_service = seo_service
        self.image_gen_service = image_gen_service
        self.payment_service = payment_service
        self.presentation_service = presentation_service
        self.google_ai_service = google_ai_service

    async def __call__(self, handler, event: TelegramObject, data: dict):
        async with AsyncSessionFactory() as session:
            data["session"] = session
            data["vision_service"] = self.vision_service
            data["seo_service"] = self.seo_service
            data["image_gen_service"] = self.image_gen_service
            data["payment_service"] = self.payment_service
            data["presentation_service"] = self.presentation_service
            data["google_ai_service"] = self.google_ai_service
            return await handler(event, data)


async def main():
    logger.info("Initializing EcommerceAICardBot for Uzum & Wildberries...")

    # Initialize database tables
    try:
        await init_db()
        logger.info("Database schema initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not connect to database, running in fallback mode: {e}")

    # Initialize Telegram Bot with HTML parsing
    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )

    dp = Dispatcher()

    # Initialize business services
    vision_service = VisionService()
    seo_service = SeoService()
    image_gen_service = ImageGenService()
    payment_service = PaymentService(bot=bot)
    presentation_service = PresentationService()
    google_ai_service = GoogleAIStudioService()

    # Register dependency injection middleware
    middleware = DependencyInjectionMiddleware(
        vision_service=vision_service,
        seo_service=seo_service,
        image_gen_service=image_gen_service,
        payment_service=payment_service,
        presentation_service=presentation_service,
        google_ai_service=google_ai_service
    )
    dp.update.middleware(middleware)

    # Register routers
    main_router = setup_handlers()
    dp.include_router(main_router)

    # Start polling or webhook
    logger.info("Starting bot polling mode (Zero-prompt listener active)...")
    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    finally:
        await bot.session.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("EcommerceAICardBot stopped.")
