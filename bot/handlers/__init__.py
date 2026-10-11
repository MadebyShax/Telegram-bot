from aiogram import Router
from bot.handlers.start import router as start_router
from bot.handlers.payment import router as payment_router
from bot.handlers.upload import router as upload_router


def setup_handlers() -> Router:
    """Combines and registers all bot routers."""
    main_router = Router()
    main_router.include_router(start_router)
    main_router.include_router(payment_router)
    main_router.include_router(upload_router)
    return main_router
