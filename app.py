"""
Hugging Face Spaces Entrypoint for EcommerceAICardBot.
Runs the Aiogram 3.x Telegram Bot concurrently with an aiohttp HTTP server on port 7860.
Hugging Face Spaces requires an active HTTP server on port 7860 to keep the Space running healthy 24/7.
"""

import os
import sys
import asyncio
import logging
from aiohttp import web
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties

from config import settings
from database.db import init_db
from bot.main import DependencyInjectionMiddleware
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
logger = logging.getLogger("HF-EcommerceAICardBot")

# Hugging Face default port is 7860
HF_PORT = int(os.environ.get("PORT", 7860))


async def health_check(request: web.Request) -> web.Response:
    """HTTP Health Check endpoint for Hugging Face Spaces."""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>EcommerceAICardBot - Hugging Face Space</title>
        <meta charset="utf-8">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f17; color: #f8fafc; padding: 40px; display: flex; justify-content: center; align-items: center; min-height: 80vh; margin: 0; }
            .card { background: #111827; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; max-width: 520px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); text-align: center; }
            h1 { color: #818cf8; font-size: 24px; margin-bottom: 8px; }
            p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
            .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 9999px; border: 1px solid rgba(16, 185, 129, 0.4); margin-bottom: 16px; }
            .info-box { background: #1e293b; border-radius: 8px; padding: 12px; margin-top: 20px; text-align: left; font-family: monospace; font-size: 12px; color: #cbd5e1; }
        </style>
    </head>
    <body>
        <div class="card">
            <span class="badge">● Bot Active & Running</span>
            <h1>EcommerceAICardBot</h1>
            <p>Zero-prompt AI product card generator for Uzum Market & Wildberries in Uzbekistan.<br>Powered by <b>Google AI Studio (Gemini 2.5 Flash)</b> and <b>Aiogram 3.x</b>.</p>
            <div class="info-box">
                <div>⚡️ Host: Hugging Face Spaces</div>
                <div>📡 Port: 7860</div>
                <div>🤖 Telegram Polling: ACTIVE</div>
                <div>💳 Click / Payme Payments: READY</div>
            </div>
        </div>
    </body>
    </html>
    """
    return web.Response(text=html_content, content_type="text/html")


async def start_telegram_bot() -> tuple[Bot, Dispatcher]:
    """Initializes and configures the Aiogram 3.x Telegram bot."""
    try:
        await init_db()
        logger.info("Database schema initialized.")
    except Exception as e:
        logger.warning(f"Database connection note: {e}")

    bot = Bot(
        token=settings.BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML)
    )
    dp = Dispatcher()

    vision_service = VisionService()
    seo_service = SeoService()
    image_gen_service = ImageGenService()
    payment_service = PaymentService(bot=bot)
    presentation_service = PresentationService()
    google_ai_service = GoogleAIStudioService()

    middleware = DependencyInjectionMiddleware(
        vision_service=vision_service,
        seo_service=seo_service,
        image_gen_service=image_gen_service,
        payment_service=payment_service,
        presentation_service=presentation_service,
        google_ai_service=google_ai_service
    )
    dp.update.middleware(middleware)
    dp.include_router(setup_handlers())

    return bot, dp


async def main():
    logger.info(f"Starting Hugging Face Space application on port {HF_PORT}...")

    # 1. Setup aiohttp web server on port 7860
    app = web.Application()
    app.router.add_get("/", health_check)
    app.router.add_get("/health", lambda r: web.json_response({"status": "healthy", "bot": "online"}))

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", HF_PORT)
    await site.start()
    logger.info(f"Hugging Face HTTP Health Server successfully listening on http://0.0.0.0:{HF_PORT}")

    # 2. Start Telegram Bot polling in the same async loop
    bot, dp = await start_telegram_bot()
    logger.info("Telegram Bot Polling started (Zero-Prompt listener online)...")

    try:
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())
    finally:
        await bot.session.close()
        await runner.cleanup()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("EcommerceAICardBot Hugging Face Space stopped.")
