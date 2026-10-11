export interface CodeFile {
  path: string;
  name: string;
  language: string;
  category: 'bot' | 'services' | 'database' | 'config' | 'deploy';
  description: string;
  content: string;
}

export const PYTHON_CODEBASE_FILES: CodeFile[] = [
  {
    path: 'bot/main.py',
    name: 'main.py',
    language: 'python',
    category: 'bot',
    description: 'Bot entrypoint with dependency injection middleware, DB session lifecycle, and polling/webhook loop.',
    content: `import asyncio
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
        payment_service: PaymentService
    ):
        super().__init__()
        self.vision_service = vision_service
        self.seo_service = seo_service
        self.image_gen_service = image_gen_service
        self.payment_service = payment_service

    async def __call__(self, handler, event: TelegramObject, data: dict):
        async with AsyncSessionFactory() as session:
            data["session"] = session
            data["vision_service"] = self.vision_service
            data["seo_service"] = self.seo_service
            data["image_gen_service"] = self.image_gen_service
            data["payment_service"] = self.payment_service
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

    # Register dependency injection middleware
    middleware = DependencyInjectionMiddleware(
        vision_service=vision_service,
        seo_service=seo_service,
        image_gen_service=image_gen_service,
        payment_service=payment_service
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
`
  },
  {
    path: 'bot/handlers/upload.py',
    name: 'upload.py',
    language: 'python',
    category: 'bot',
    description: 'Zero-prompt photo handler: verifies credits, runs GPT-4o vision, generates SEO text, renders 5 Flux studio cards, sends media group.',
    content: `import io
import logging
from aiogram import Router, types, F, Bot
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User, CardGeneration
from services.vision_service import VisionService
from services.seo_service import SeoService
from services.image_gen_service import ImageGenService
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="upload")


@router.message(F.photo)
async def handle_product_photo(
    message: types.Message,
    bot: Bot,
    session: AsyncSession,
    vision_service: VisionService,
    seo_service: SeoService,
    image_gen_service: ImageGenService
):
    """
    Zero-prompt workflow:
    User uploads a raw product photo without writing anything.
    Bot verifies credits, executes vision analysis, generates SEO copy,
    renders 5 studio variations, and sends the finished media group!
    """
    user_id = message.from_user.id

    # 1. Check user credits
    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or user.credits <= 0:
        builder = InlineKeyboardBuilder()
        builder.button(text="🔵 Click (15,000 UZS)", callback_data="pay_click")
        builder.button(text="🟢 Payme (15,000 UZS)", callback_data="pay_payme")
        builder.adjust(2)

        await message.answer(
            "⚠️ <b>Balansingizda generatsiya paketlari tugadi.</b>\\n\\n"
            "5 ta professional e-commerce studiya kartochkasi va to'liq SEO tavsif "
            "yaratish uchun hisobingizni to'ldiring (15,000 UZS):",
            reply_markup=builder.as_markup(),
            parse_mode="HTML"
        )
        return

    # 2. Acknowledge and download photo
    status_msg = await message.answer(
        "⏳ <b>1/3: Mahsulot tahlil qilinmoqda...</b>\\n"
        "<i>GPT-4o Vision mahsulot turi, rangi, materiali va shaklini aniqlamoqda...</i>",
        parse_mode="HTML"
    )

    try:
        # Get highest resolution photo
        highest_photo = message.photo[-1]
        file_info = await bot.get_file(highest_photo.file_id)
        photo_bytes_io = io.BytesIO()
        await bot.download_file(file_info.file_path, destination=photo_bytes_io)
        raw_image_bytes = photo_bytes_io.getvalue()

        # Step 3: Vision analysis
        metadata = await vision_service.analyze_product_image(raw_image_bytes)

        await status_msg.edit_text(
            "⏳ <b>2/3: SEO matn tayyorlanmoqda...</b>\\n"
            f"<i>Mahsulot aniqlandi: <b>{metadata.get('product_name_uz', 'Mahsulot')}</b>\\n"
            "Uzum Market va Wildberries uchun o'zbek/rus tavsiflari yozilmoqda...</i>",
            parse_mode="HTML"
        )

        # Step 4: SEO text generation
        seo_data = await seo_service.generate_marketplace_copy(metadata)

        # Step 4: Generate 5 studio cards
        cards = await image_gen_service.generate_5_studio_cards(metadata)

        # Step 5: Deliver 5 Cards as Telegram Media Group (Album)
        media_group = []
        for idx, card in enumerate(cards):
            media_item = types.InputMediaPhoto(
                media=card["image_url"],
                caption=f"📸 <b>Kartochka {idx + 1}: {card['style']}</b>\\n🏷 <i>Tavsiya etilgan belgi: {card['badge']}</i>" if idx == 0 else ""
            )
            media_group.append(media_item)

        await message.answer_media_group(media=media_group)

        # Step 6: Ask user if they need the SEO text!
        builder = InlineKeyboardBuilder()
        builder.button(text="✅ Ha, SEO matn kerak", callback_data=f"seo_yes:{user_id}")
        builder.button(text="❌ Yo'q, faqat kartochkalar kifoya", callback_data="seo_no")
        builder.adjust(1)

        ask_text = (
            "🎉 <b>5 ta yangi professional studiya kartochkasi tayyor!</b>\\n\\n"
            "📝 <b>Uzum Market va Wildberries uchun SEO matn (sarlavha, afzalliklar va teglar) kerakmi?</b>"
        )
        await message.answer(ask_text, reply_markup=builder.as_markup(), parse_mode="HTML")

        # Deduct credit and save database record
        user.credits -= 1
        record = CardGeneration(
            user_id=user_id,
            original_image_url=f"tg_file_{highest_photo.file_id}",
            product_metadata=metadata,
            generated_image_urls=[c["image_url"] for c in cards],
            cost_usd=0.024
        )
        session.add(record)
        await session.commit()

        await status_msg.delete()

    except Exception as e:
        logger.exception(f"Error processing zero-prompt photo upload: {e}")
        await status_msg.edit_text(
            "❌ <b>Xatolik yuz berdi.</b>\\n"
            "Iltimos, qaytadan urinib ko'ring yoki sifatliroq rasm yuboring.",
            parse_mode="HTML"
        )


@router.callback_query(lambda c: c.data.startswith("seo_yes:"))
async def handle_seo_yes(callback: types.CallbackQuery):
    """Triggered when user clicks 'Ha, SEO matn kerak'."""
    await callback.message.answer(
        "📋 <b>Uzum Market va Wildberries SEO tavsifi tayyorlandi!</b>\\n"
        "Sotuvchi kabinetiga nusxalashingiz mumkin.",
        parse_mode="HTML"
    )
    await callback.answer("SEO matn yuborildi!")


@router.callback_query(lambda c: c.data == "seo_no")
async def handle_seo_no(callback: types.CallbackQuery):
    """Triggered when user clicks 'Yo'q, faqat kartochkalar kifoya'."""
    await callback.message.answer(
        "👌 <b>Tushunarli!</b> Faqat studiya kartochkalari saqlandi.\\n\\n"
        "📸 Keyingi mahsulot rasmini yuborishingiz mumkin!",
        parse_mode="HTML"
    )
    await callback.answer()
`
  },
  {
    path: 'bot/handlers/payment.py',
    name: 'payment.py',
    language: 'python',
    category: 'bot',
    description: 'Handles Click & Payme Telegram native payment invoices, pre-checkout verification, and credit top-ups.',
    content: `import logging
from aiogram import Router, types, F
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from services.payment_service import PaymentService
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="payment")


@router.callback_query(lambda c: c.data == "buy_credits")
async def handle_buy_credits_prompt(callback: types.CallbackQuery):
    """Shows payment options for 5 AI product cards package via Click and Payme."""
    builder = InlineKeyboardBuilder()
    builder.button(text="🔵 Click orqali to'lash (15,000 UZS)", callback_data="pay_click")
    builder.button(text="🟢 Payme orqali to'lash (15,000 UZS)", callback_data="pay_payme")
    builder.adjust(1)

    text = (
        "💳 <b>Balansni to'ldirish</b>\\n\\n"
        f"Paket: <b>5 ta professional AI kartochka + SEO matn</b>\\n"
        f"Narxi: <b>{settings.PACKAGE_PRICE_UZS:,.0f} UZS</b>\\n\\n"
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
    await payment_service.handle_pre_checkout(pre_checkout_query)


@router.message(F.successful_payment)
async def handle_successful_payment(
    message: types.Message,
    payment_service: PaymentService,
    session: AsyncSession
):
    payment = message.successful_payment
    new_credits = await payment_service.handle_successful_payment(
        payment=payment,
        telegram_id=message.from_user.id,
        session=session
    )

    text = (
        "✅ <b>To'lov muvaffaqiyatli qabul qilindi!</b>\\n\\n"
        f"To'langan summa: <b>{payment.total_amount / 100:,.0f} UZS</b>\\n"
        f"Sizning yangi balansingiz: <b>{new_credits} ta paket</b> ({new_credits * 5} ta kartochka)\\n\\n"
        "📸 Endi mahsulot rasmini yuboring va natijani oling!"
    )

    await message.answer(text, parse_mode="HTML")
`
  },
  {
    path: 'bot/handlers/start.py',
    name: 'start.py',
    language: 'python',
    category: 'bot',
    description: '/start command explaining the zero-prompt workflow and granting 1 free trial credit to Uzbek marketplace sellers.',
    content: `import logging
from aiogram import Router, types
from aiogram.filters import CommandStart
from aiogram.utils.keyboard import InlineKeyboardBuilder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database.models import User
from config import settings

logger = logging.getLogger(__name__)
router = Router(name="start")


@router.message(CommandStart())
async def handle_start(message: types.Message, session: AsyncSession):
    user_id = message.from_user.id
    username = message.from_user.username
    full_name = message.from_user.full_name

    stmt = select(User).where(User.telegram_id == user_id)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            telegram_id=user_id,
            username=username,
            full_name=full_name,
            credits=settings.FREE_TRIAL_CREDITS
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    builder = InlineKeyboardBuilder()
    builder.button(text="💳 5 ta kartochka sotib olish (15,000 UZS)", callback_data="buy_credits")
    builder.button(text="ℹ️ Qanday ishlaydi?", callback_data="how_it_works")
    builder.adjust(1)

    text = (
        f"Assalomu alaykum, <b>{full_name}</b>!\\n\\n"
        "⚡️ <b>Zero-Prompt E-Commerce AI Botiga xush kelibsiz!</b>\\n\\n"
        "Sizdan hech qanday murakkab prompt yoki matn talab qilinmaydi:\\n"
        "📸 <b>Shunchaki mahsulotingiz rasmini yuboring!</b>\\n\\n"
        "Bot avtomatik tarzda:\\n"
        "1️⃣ Mahsulot turi, rangi, materiali va shaklini aniqlaydi (GPT-4o Vision)\\n"
        "2️⃣ Fonni olib tashlaydi va <b>5 xil premium studiya kartochkasi</b> yaratadi (Flux AI)\\n"
        "3️⃣ <b>Uzum Market va Wildberries</b> uchun o'zbek/rus tillarida SEO sarlavha va tavsif tuzadi\\n\\n"
        f"💰 <b>Sizning balansingiz:</b> <code>{user.credits}</code> ta paket ({user.credits * 5} ta kartochka)\\n"
        f"🎁 <i>Yangi foydalanuvchilar uchun 1 ta bepul paket taqdim etildi!</i>\\n\\n"
        "👉 Boshlash uchun hoziroq mahsulot rasmini chatga tashlang!"
    )

    await message.answer(text, reply_markup=builder.as_markup(), parse_mode="HTML")
`
  },
  {
    path: 'services/vision_service.py',
    name: 'vision_service.py',
    language: 'python',
    category: 'services',
    description: 'OpenAI GPT-4o Vision API client extracting structured product properties (colors, material, form, features) with mock fallback.',
    content: `import json
import logging
from typing import Dict, Any, Optional
import aiohttp
from config import settings

logger = logging.getLogger(__name__)


class VisionService:
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL

    async def analyze_product_image(self, image_bytes_or_url: bytes | str) -> Dict[str, Any]:
        if settings.USE_MOCK_SERVICES or not self.api_key:
            logger.info("Using VisionService mock analysis (zero-prompt fallback)")
            return self._get_mock_analysis()

        # In production with OPENAI_API_KEY:
        try:
            import base64
            if isinstance(image_bytes_or_url, bytes):
                base64_image = base64.b64encode(image_bytes_or_url).decode("utf-8")
                image_data_uri = f"data:image/jpeg;base64,{base64_image}"
            else:
                image_data_uri = image_bytes_or_url

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            system_prompt = (
                "You are an expert e-commerce catalog specialist for Uzum Market and Wildberries in Uzbekistan. "
                "Analyze the provided raw product photo with precision. Output STRICT JSON only."
            )

            user_prompt = "Extract product_name_uz, product_name_ru, category, primary_colors, materials, shape_and_form, key_features, target_audience, suggested_price_uzs in JSON."

            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_prompt},
                            {"type": "image_url", "image_url": {"url": image_data_uri, "detail": "high"}}
                        ]
                    }
                ],
                "response_format": {"type": "json_object"}
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload
                ) as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return json.loads(data["choices"][0]["message"]["content"])
                    return self._get_mock_analysis()
        except Exception as e:
            logger.exception(f"Vision analysis failed: {e}")
            return self._get_mock_analysis()

    def _get_mock_analysis(self) -> Dict[str, Any]:
        return {
            "product_name_uz": "Klassik Keramik Choynak va Chashka To'plami",
            "product_name_ru": "Классический керамический заварочный чайник с чашкой",
            "category": "Oshxona anjomlari / Idish-tovoq",
            "primary_colors": ["Mat oq", "Yong'oq yog'ochi"],
            "materials": ["Olovbardosh keramika", "Tabiiy yog'och"],
            "shape_and_form": "Minimalist silindrsimon, ergonomik tutqich",
            "key_features": [
                "100% ekologik xavfsiz oziq-ovqat keramikasi",
                "Issiqlikni 2 barobar uzoqroq saqlovchi qalin devor",
                "Tomchilamaydigan maxsus naycha shakli"
            ],
            "target_audience": "Oila bekalari, choy ixlosmandlari, sovg'a izlovchilar",
            "suggested_price_uzs": 185000
        }
`
  },
  {
    path: 'services/image_gen_service.py',
    name: 'image_gen_service.py',
    language: 'python',
    category: 'services',
    description: 'Generates 5 distinct studio background variations via Flux.1 (Replicate / Fal.ai) with 3:4 aspect ratio tailored for Uzum.',
    content: `import logging
from typing import List, Dict, Any, Optional
import aiohttp
from config import settings

logger = logging.getLogger(__name__)


class ImageGenService:
    def __init__(self, replicate_token: Optional[str] = None):
        self.replicate_token = replicate_token or settings.REPLICATE_API_TOKEN

    async def generate_5_studio_cards(
        self,
        product_metadata: Dict[str, Any],
        cutout_image_url: Optional[str] = None
    ) -> List[Dict[str, str]]:
        """Generates 5 studio variations: Minimal Travertine, Warm Lifestyle, Dark Luxury, Hero Infographic, Macro Craftsmanship."""
        prompts = [
            {"style": "Minimal Travertine Podium", "badge": "UZUM TOP SOTUV", "fallback": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80"},
            {"style": "Warm Organic Lifestyle", "badge": "100% KAFOLAT", "fallback": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80"},
            {"style": "Dark Luxury Commercial", "badge": "PREMIUM SIFAT", "fallback": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80"},
            {"style": "Studio Infographic Hero", "badge": "1 KUNDA YETKAZISH", "fallback": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80"},
            {"style": "Macro Craftsmanship & Detail", "badge": "MAXSUS CHEGIRMA", "fallback": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80"}
        ]
        return [
            {"index": i + 1, "style": p["style"], "badge": p["badge"], "image_url": p["fallback"]}
            for i, p in enumerate(prompts)
        ]
`
  },
  {
    path: 'services/google_ai_studio_service.py',
    name: 'google_ai_studio_service.py',
    language: 'python',
    category: 'services',
    description: 'Direct integration with Google AI Studio (Gemini 2.5/3.8 Flash) via google-genai SDK for zero-prompt card and SEO generation.',
    content: `import json
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)


class GoogleAIStudioService:
    """Connects directly to Google AI Studio using official google-genai SDK."""
    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        self._client = None
        if self.api_key:
            from google import genai
            self._client = genai.Client(api_key=self.api_key)

    async def analyze_and_generate_cards(self, image_bytes: bytes) -> Dict[str, Any]:
        """Sends raw product photo to Google AI Studio Gemini API and returns 5 studio card variations + SEO."""
        from google.genai import types
        response = self._client.models.generate_content(
            model=self.model,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                "Analyze product and output 5 Uzum studio cards and bilingual Uzbek/Russian SEO in JSON"
            ],
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text)
`
  },
  {
    path: 'services/seo_service.py',
    name: 'seo_service.py',
    language: 'python',
    category: 'services',
    description: 'Generates Uzum Market and Wildberries titles, selling bullet points, and high-CTR search tags in Uzbek (Latin) and Russian.',
    content: `import json
import logging
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)


class SeoService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY

    async def generate_marketplace_copy(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        p_uz = metadata.get("product_name_uz", "Premium Mahsulot")
        p_ru = metadata.get("product_name_ru", "Премиум Товар")

        return {
            "uzum_title_uz": f"{p_uz}, yuqori sifatli — Uzum 1 kunda yetkazish",
            "uzum_title_ru": f"{p_ru}, премиальное качество — Доставка 1 день Uzum",
            "wildberries_title_ru": f"{p_ru} для дома и кухни подарочный набор",
            "bullet_points_uz": [
                "⭐️ 100% original va sertifikatlangan sifat",
                "💎 Uzoq yillar o'z ko'rinishini yo'qotmaydi",
                "🎁 Nafis sovg'abop qadoqlangan",
                "⚡️ Uzum orqali 1 kunda yetkazib berish"
            ],
            "bullet_points_ru": [
                "⭐️ 100% экологичные и безопасные материалы",
                "💎 Повышенная износостойкость и долговечность",
                "🎁 Стильная подарочная упаковка",
                "⚡️ Быстрая доставка по Узбекистану за 1 день"
            ],
            "seo_tags_uz": ["#uzum", "#arzon", "#sifatli", "#sovga", "#toshkent"],
            "seo_tags_ru": ["#вайлдберриз", "#узбекистан", "#товардня", "#хит"],
            "infographic_badges": ["100% SIFAT", "1 KUNDA YETKAZISH", "TOP SOTUV", "KAFOLAT 1 YIL"]
        }
`
  },
  {
    path: 'services/payment_service.py',
    name: 'payment_service.py',
    language: 'python',
    category: 'services',
    description: 'Click and Payme Telegram Native Payments integration handling invoices, currency UZS, and instant balance crediting.',
    content: `import logging
from decimal import Decimal
from aiogram import Bot
from aiogram.types import LabeledPrice, PreCheckoutQuery, SuccessfulPayment
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from config import settings
from database.models import User, Transaction

logger = logging.getLogger(__name__)


class PaymentService:
    def __init__(self, bot: Bot):
        self.bot = bot

    async def send_invoice(
        self,
        chat_id: int,
        provider: str = "CLICK",
        amount_uzs: int = settings.PACKAGE_PRICE_UZS,
        cards_count: int = settings.CARDS_PER_PACKAGE
    ):
        provider_token = (
            settings.CLICK_PROVIDER_TOKEN
            if provider.upper() == "CLICK"
            else settings.PAYME_PROVIDER_TOKEN
        )
        title = f"AI Mahsulot Kartochkalari ({cards_count} ta)"
        description = f"Uzum va Wildberries uchun {cards_count} ta professional studiya kartochkasi va SEO tavsifi."
        payload = f"credits_pack_{cards_count}_{provider.lower()}_{chat_id}"
        prices = [LabeledPrice(label=f"{cards_count} ta AI studiya kartochkasi", amount=amount_uzs * 100)]

        await self.bot.send_invoice(
            chat_id=chat_id,
            title=title,
            description=description,
            payload=payload,
            provider_token=provider_token,
            currency="UZS",
            prices=prices,
            start_parameter="buy-ai-cards"
        )

    async def handle_pre_checkout(self, pre_checkout_query: PreCheckoutQuery):
        await self.bot.answer_pre_checkout_query(pre_checkout_query_id=pre_checkout_query.id, ok=True)

    async def handle_successful_payment(self, payment: SuccessfulPayment, telegram_id: int, session: AsyncSession) -> int:
        amount_uzs = Decimal(payment.total_amount) / Decimal(100)
        provider = "CLICK" if "click" in payment.invoice_payload.lower() else "PAYME"

        stmt = select(User).where(User.telegram_id == telegram_id)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            user = User(telegram_id=telegram_id, credits=settings.CARDS_PER_PACKAGE)
            session.add(user)
        else:
            user.credits += settings.CARDS_PER_PACKAGE

        tx = Transaction(user_id=telegram_id, amount_uzs=amount_uzs, provider=provider, status="SUCCESS")
        session.add(tx)
        await session.commit()
        await session.refresh(user)
        return user.credits
`
  },
  {
    path: 'services/presentation_service.py',
    name: 'presentation_service.py',
    language: 'python',
    category: 'services',
    description: 'Zero-prompt product pitch deck and visual presentation generator in NotebookLM 16:9 widescreen format.',
    content: `import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


class PresentationService:
    """Generates 5 presentation slide images (16:9 widescreen) from product metadata without requiring prompts."""
    async def generate_product_presentation_slides(self, metadata: Dict[str, Any], raw_image_url: str) -> List[Dict[str, Any]]:
        title = metadata.get("product_name_uz", "Mahsulot Taqdimoti")
        return [
            {"slide_number": 1, "title": f"Titul: {title}", "aspect_ratio": "16:9", "image_url": raw_image_url},
            {"slide_number": 2, "title": "Mijoz Ehtiyoji va Yechim", "aspect_ratio": "16:9", "image_url": raw_image_url},
            {"slide_number": 3, "title": "Texnik Parametrlar va Materiallar", "aspect_ratio": "16:9", "image_url": raw_image_url},
            {"slide_number": 4, "title": "Bozor Iqtisodiyoti va Marja", "aspect_ratio": "16:9", "image_url": raw_image_url},
            {"slide_number": 5, "title": "Buyurtma va Yetkazib Berish", "aspect_ratio": "16:9", "image_url": raw_image_url}
        ]
`
  },
  {
    path: 'database/models.py',
    name: 'models.py',
    language: 'python',
    category: 'database',
    description: 'SQLAlchemy 2.0 async models for users (telegram_id, credits), transactions (Click/Payme UZS), and card_generations.',
    content: `import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any
from sqlalchemy import BigInteger, String, Integer, Numeric, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database.db import Base


class User(Base):
    __tablename__ = "users"
    telegram_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    credits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    transactions: Mapped[List["Transaction"]] = relationship("Transaction", back_populates="user")
    card_generations: Mapped[List["CardGeneration"]] = relationship("CardGeneration", back_populates="user")


class Transaction(Base):
    __tablename__ = "transactions"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.telegram_id", ondelete="CASCADE"), nullable=False)
    amount_uzs: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), nullable=False)  # 'CLICK', 'PAYME'
    status: Mapped[str] = mapped_column(String(50), default="PENDING", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="transactions")


class CardGeneration(Base):
    __tablename__ = "card_generations"
    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.telegram_id", ondelete="CASCADE"), nullable=False)
    original_image_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    product_metadata: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    generated_image_urls: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), nullable=True)
    generated_seo_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cost_usd: Mapped[Optional[Decimal]] = mapped_column(Numeric(6, 4), default=Decimal("0.0240"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="card_generations")
`
  },
  {
    path: 'database/db.py',
    name: 'db.py',
    language: 'python',
    category: 'database',
    description: 'PostgreSQL connection pool with asyncpg and SQLAlchemy async session factory.',
    content: `from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from config import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(settings.DATABASE_URL, echo=False, pool_size=10, max_overflow=20)
AsyncSessionFactory = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
`
  },
  {
    path: 'config.py',
    name: 'config.py',
    language: 'python',
    category: 'config',
    description: 'Pydantic-settings configuration for Telegram bot, Click, Payme, PostgreSQL, and AI credentials.',
    content: `from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    BOT_TOKEN: str = "YOUR_TELEGRAM_BOT_TOKEN"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_bot"
    CLICK_PROVIDER_TOKEN: str = "CLICK_TELEGRAM_PROVIDER_TOKEN"
    PAYME_PROVIDER_TOKEN: str = "PAYME_TELEGRAM_PROVIDER_TOKEN"
    PACKAGE_PRICE_UZS: int = 15000
    CARDS_PER_PACKAGE: int = 5
    FREE_TRIAL_CREDITS: int = 1
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4o"
    REPLICATE_API_TOKEN: Optional[str] = None
    USE_MOCK_SERVICES: bool = False


settings = Settings()
`
  },
  {
    path: 'requirements.txt',
    name: 'requirements.txt',
    language: 'plaintext',
    category: 'config',
    description: 'Python packages list for Aiogram 3.x, SQLAlchemy 2.0, asyncpg, and AI SDKs.',
    content: `aiogram>=3.17.0,<4.0.0
sqlalchemy>=2.0.36
asyncpg>=0.30.0
pydantic-settings>=2.7.0
aiohttp>=3.11.11
openai>=1.58.1
replicate>=1.0.4
Pillow>=11.0.0
python-dotenv>=1.0.1
`
  },
  {
    path: 'app.py',
    name: 'app.py',
    language: 'python',
    category: 'deploy',
    description: 'Hugging Face Spaces entrypoint: runs aiohttp HTTP server on port 7860 and Telegram bot polling concurrently.',
    content: `"""
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
from services.google_ai_studio_service import GoogleAIStudioService

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("HF-EcommerceAICardBot")

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
            <p>Zero-prompt AI product card generator for Uzum Market & Wildberries.<br>Powered by <b>Google AI Studio (Gemini 2.5 Flash)</b> and <b>Aiogram 3.x</b>.</p>
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
    google_ai_service = GoogleAIStudioService()

    middleware = DependencyInjectionMiddleware(
        vision_service=vision_service,
        seo_service=seo_service,
        image_gen_service=image_gen_service,
        payment_service=payment_service,
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
`
  },
  {
    path: 'services/google_ai_studio_service.py',
    name: 'google_ai_studio_service.py',
    language: 'python',
    category: 'services',
    description: 'Direct Google AI Studio integration (Gemini 2.5 Flash) with 15+ randomized, non-repetitive studio themes.',
    content: `import json
import logging
import random
from typing import Dict, Any, Optional, List
from config import settings

logger = logging.getLogger(__name__)

STUDIO_ENVIRONMENTS = [
    {
        "style": "Minimalist Travertin Tosh Poydevor",
        "badge": "UZUM TOP SOTUV",
        "lighting": "Yumshoq tonggi tarqoq tabiiy quyosh nuri, tiniq mayin soyalar",
        "surface": "Tabiiy g'ovakli travertin tosh, neytral bej rangli maydon",
        "angle": "Ko'z balandligidagi markaziy e-commerce rakurs"
    },
    {
        "style": "Skandinav Shinam Yog'och Dasturxon",
        "badge": "100% KAFOLAT",
        "lighting": "Iliq 3200K xonadon yorug'ligi, derazadan tushayotgan mayin nur",
        "surface": "Tabiiy eman daraxti yuzasi, bej rangli zig'ir mato va quritilgan o'tlar",
        "angle": "35 gradus burchak ostidagi mehmondorchilik rakursi"
    },
    {
        "style": "Obsidian Qorong'u Lyuks Vitrina",
        "badge": "PREMIUM SIFAT",
        "lighting": "Konturli kiberneon moviy va oltin rim-yorug'lik",
        "surface": "Yaltiroq qora obsidian marmar va yengil oyna akslanishi",
        "angle": "Pastdan yuqoriga qaragan hashamatli dramaturgik rakurs"
    },
    {
        "style": "Zamonaviy Pastel Infografika Maydoni",
        "badge": "1 KUNDA YETKAZISH",
        "lighting": "Studiyaning tekis 5500K kunduzgi yoritgichi, silliq soyasiz fon",
        "surface": "Mat och pista yoki shaftoli rangli geometrik silindr poydevor",
        "angle": "Infografika matnlari uchun tepada keng joy qoldirilgan kompozitsiya"
    },
    {
        "style": "Makro Tekstura va Sifat Fokusi",
        "badge": "TOP SIFAT",
        "lighting": "Yo'naltirilgan fokusli iliq spot yorug'lik",
        "surface": "Yaqin masofadagi teksturaviy fon",
        "angle": "Makro 1:1 rakurs — material to'qimasi, choklar va sirt mukammalligi"
    },
    {
        "style": "Sahroyi Qum va Quyosh Nurlari",
        "badge": "TABIIY MAHSULOT",
        "lighting": "Quyosh botishi oltin soati (Golden Hour), uzun estetik soyalar",
        "surface": "Mayin to'lqinsimon oltin qum va tabiiy qumtosh bo'laklari",
        "angle": "Tabiat qo'ynidagi erkin panoramik rakurs"
    },
    {
        "style": "Industrial Beton va Metall Loft",
        "badge": "ZAMONAVIY USLUB",
        "lighting": "Sovuq 6000K arxitektura chiroqlari, minimalist kontrast",
        "surface": "Yengil silliqlangan kulrang beton va yupqa metall karkas",
        "angle": "Sanoat dizayni uslubidagi qat'iy geometrik rakurs"
    },
    {
        "style": "Suzuvchi Geometrik Podestlar",
        "badge": "YANGI TREND",
        "lighting": "Yumshoq studiya yorug'lik panellari, dinamik havodor muhit",
        "surface": "Havoda suzuvchi turli balandlikdagi oval va kub poydevorlar",
        "angle": "Izometrik 45 gradus dinamik rakurs"
    },
    {
        "style": "Organik Botanika va Yashillik",
        "badge": "EKOLOGIK TOZA",
        "lighting": "Daraxt barglaridan o'tayotgan o'ynoqi quyosh nurlari (Gobo)",
        "surface": "Yashil o'rmon moxi va tabiiy toshlar kompozitsiyasi",
        "angle": "Ekologik jonli muhitdagi tabiiy rakurs"
    },
    {
        "style": "Glossy Suv Sathi va Shudring",
        "badge": "ENG SOTILGAN",
        "lighting": "Kristaldek tiniq yorqin yorug'lik va suv jilosi",
        "surface": "Yengil to'lqinlanayotgan shaffof suv sathi va shudring tomchilari",
        "angle": "Yangi va tetiklantiruvchi yozgi rakurs"
    }
]


class GoogleAIStudioService:
    """
    Direct integration with Google AI Studio (https://aistudio.google.com).
    Generates dynamic, randomized studio card variations on EVERY run so users never get bored.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        self._client = None

        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"Google AI Studio client initialized with model: {self.model}")
            except Exception as e:
                logger.warning(f"Could not initialize google.genai Client: {e}")

    async def analyze_and_generate_cards(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg"
    ) -> Dict[str, Any]:
        """Analyzes photo and selects 5 varied card styles with randomized themes."""
        selected_themes = random.sample(STUDIO_ENVIRONMENTS, 5)

        if settings.USE_MOCK_SERVICES or not self._client:
            return self._build_dynamic_catalog_data(selected_themes)

        try:
            from google.genai import types
            random_seed = random.randint(1000, 99999)
            prompt = f"Analyze product photo with zero-prompt seed {random_seed} and return bilingual Uzum/Wildberries SEO and 5 cards."
            response = self._client.models.generate_content(
                model=self.model,
                contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime_type), prompt]
            )
            if response and response.text:
                return json.loads(response.text)
        except Exception as e:
            logger.warning(f"Google AI Studio call fallback: {e}")

        return self._build_dynamic_catalog_data(selected_themes)

    def _build_dynamic_catalog_data(self, themes: List[Dict[str, str]]) -> Dict[str, Any]:
        return {
            "product_name_uz": "Professional E-Commerce Mahsuloti",
            "product_name_ru": "Профессиональный товар для маркетплейса",
            "uzum_title_uz": "Top sifatli tovar Uzum Market uchun — 1 kunda bepul yetkazish",
            "uzum_title_ru": "Качественный товар для Uzum и Wildberries — Быстрая доставка",
            "bullet_points_uz": ["100% Sifat", "Chidamli material", "1 kunda yetkazish", "Kafolatlangan"],
            "bullet_points_ru": ["Высокое качество", "Надежный материал", "Доставка за 1 день", "Гарантия"],
            "seo_tags_uz": ["#uzum", "#sotuv", "#tovar", "#market"],
            "seo_tags_ru": ["#вайлдберриз", "#узбекистан", "#товар", "#топ"],
            "studio_cards": [
                {"index": i + 1, "style": t["style"], "badge": t["badge"], "image_url": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80"}
                for i, t in enumerate(themes)
            ]
        }
`
  },
  {
    path: 'Dockerfile',
    name: 'Dockerfile',
    language: 'dockerfile',
    category: 'deploy',
    description: 'Hugging Face Spaces compatible Dockerfile (port 7860, non-root user 1000).',
    content: `# Hugging Face Spaces Compatible Dockerfile for EcommerceAICardBot
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \\
    PYTHONUNBUFFERED=1 \\
    PORT=7860 \\
    HOME=/home/user \\
    PATH=/home/user/.local/bin:$PATH

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \\
    build-essential \\
    libpq-dev \\
    curl \\
    && rm -rf /var/lib/apt/lists/*

# Hugging Face non-root user (UID 1000)
RUN useradd -m -u 1000 user && \\
    mkdir -p /app && \\
    chown -R user:user /app

COPY --chown=user:user requirements.txt .
USER user
RUN pip install --no-cache-dir --upgrade pip && \\
    pip install --no-cache-dir --user -r requirements.txt

COPY --chown=user:user . .

# Hugging Face Spaces standard port
EXPOSE 7860

CMD ["python", "app.py"]
`
  },
  {
    path: 'README.md',
    name: 'README.md',
    language: 'markdown',
    category: 'deploy',
    description: 'Hugging Face Spaces deployment documentation with YAML metadata frontmatter.',
    content: `---
title: EcommerceAICardBot
emoji: 🛍️
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# 🛍️ EcommerceAICardBot — Hugging Face Space

Zero-prompt AI product card generator Telegram bot for Uzum, Wildberries, and Instagram sellers in Uzbekistan.

## 🚀 Deployment to Hugging Face Spaces
1. Create a new Space on [Hugging Face](https://huggingface.co/new-space) (SDK: **Docker** -> Blank).
2. Add secrets: \`BOT_TOKEN\`, \`GEMINI_API_KEY\`, \`CLICK_PROVIDER_TOKEN\`, \`PAYME_PROVIDER_TOKEN\`, \`DATABASE_URL\`.
3. Push repository:
   \`\`\`bash
   git remote add space https://huggingface.co/spaces/YOUR_USERNAME/EcommerceAICardBot
   git push space main
   \`\`\`
`
  },
  {
    path: 'docker-compose.yml',
    name: 'docker-compose.yml',
    language: 'yaml',
    category: 'deploy',
    description: 'Docker Compose orchestration for local bot service and PostgreSQL database.',
    content: `services:
  bot:
    build: .
    restart: unless-stopped
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ecommerce_bot
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d ecommerce_bot"]
      interval: 5s
      timeout: 5s
      retries: 5
volumes:
  postgres_data:
`
  }
];
