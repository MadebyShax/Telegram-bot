from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables or .env file.
    """
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Telegram Bot (required: the app refuses to start without it)
    BOT_TOKEN: str

    # Database (PostgreSQL / Supabase with asyncpg)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_bot"

    # Telegram Native Payment Provider Tokens
    CLICK_PROVIDER_TOKEN: str = "CLICK_TELEGRAM_PROVIDER_TOKEN"
    PAYME_PROVIDER_TOKEN: str = "PAYME_TELEGRAM_PROVIDER_TOKEN"

    # Pricing in UZS: one purchase = 1 credit = 1 package of CARDS_PER_PACKAGE cards
    PACKAGE_PRICE_UZS: int = 15000
    CARDS_PER_PACKAGE: int = 5
    FREE_TRIAL_CREDITS: int = 1

    # Google AI Studio API (Gemini Vision & Card Generation)
    # Get your free/paid key from: https://aistudio.google.com/app/apikey
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"
    # Image model that edits the user's photo into studio cards
    GEMINI_IMAGE_MODEL: str = "gemini-2.5-flash-image"
    # How many card images are generated at the same time (keep low on free API tiers)
    IMAGE_GEN_CONCURRENCY: int = 2


settings = Settings()
