import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    Application configuration loaded from environment variables or .env file.
    """
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Telegram Bot
    BOT_TOKEN: str = "YOUR_TELEGRAM_BOT_TOKEN"
    ADMIN_TELEGRAM_IDS: list[int] = [123456789]

    # Database (PostgreSQL / Supabase with asyncpg)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_bot"

    # Telegram Native Payment Provider Tokens
    CLICK_PROVIDER_TOKEN: str = "CLICK_TELEGRAM_PROVIDER_TOKEN"
    PAYME_PROVIDER_TOKEN: str = "PAYME_TELEGRAM_PROVIDER_TOKEN"

    # Pricing in UZS (15,000 UZS for 5 cards package)
    PACKAGE_PRICE_UZS: int = 15000
    CARDS_PER_PACKAGE: int = 5
    FREE_TRIAL_CREDITS: int = 1

    # Google AI Studio API (Gemini Vision & Card Generation)
    # Get your free/paid key from: https://aistudio.google.com/app/apikey
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # Optional alternative AI Vision & Image services
    OPENAI_API_KEY: Optional[str] = None
    REPLICATE_API_TOKEN: Optional[str] = None
    FLUX_MODEL_VERSION: str = "black-forest-labs/flux-schnell"

    # Background Removal API (Optional Clipdrop / Fal.ai / Rembg)
    CLIPDROP_API_KEY: Optional[str] = None

    # Server / Webhook Configuration (if deployed with webhooks)
    USE_WEBHOOK: bool = False
    WEBHOOK_DOMAIN: Optional[str] = "https://your-bot-domain.com"
    WEBHOOK_PATH: str = "/webhook/telegram"
    WEBHOOK_PORT: int = 8080

    # Development / Mock Mode toggle (generates studio mockups if API keys not set)
    USE_MOCK_SERVICES: bool = False


settings = Settings()
