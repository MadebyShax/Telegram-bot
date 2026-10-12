import asyncio
import json
import logging
import random
from typing import Dict, Any, Optional, List
from config import settings

logger = logging.getLogger(__name__)

# Pool of diverse studio aesthetics; 5 are picked at random for every generation (NO marketplace brand names!)
# "style"/"badge" are shown to the user, "scene" is the English instruction sent to the image model.
STUDIO_ENVIRONMENTS = [
    {
        "style": {"uz": "Minimalist Travertin Tosh Poydevor", "ru": "Минималистичный травертиновый подиум", "en": "Minimalist Travertine Podium"},
        "badge": {"uz": "TOP SIFAT", "ru": "ТОП КАЧЕСТВО", "en": "TOP QUALITY"},
        "scene": "on a natural porous travertine stone podium, neutral beige backdrop, soft diffused morning light, crisp soft shadows, eye-level centered e-commerce angle"
    },
    {
        "style": {"uz": "Skandinav Shinam Yog'och Dasturxon", "ru": "Уютный скандинавский деревянный стол", "en": "Cozy Scandinavian Wooden Table"},
        "badge": {"uz": "100% KAFOLAT", "ru": "100% ГАРАНТИЯ", "en": "100% GUARANTEE"},
        "scene": "on a natural oak table with beige linen cloth and dried botanicals, warm 3200K home light from a window, 35-degree lifestyle angle, shallow depth of field"
    },
    {
        "style": {"uz": "Obsidian Qorong'u Lyuks Vitrina", "ru": "Тёмная люкс-витрина из обсидиана", "en": "Dark Obsidian Luxury Showcase"},
        "badge": {"uz": "PREMIUM SIFAT", "ru": "ПРЕМИУМ КАЧЕСТВО", "en": "PREMIUM QUALITY"},
        "scene": "on glossy black obsidian marble with a subtle mirror reflection, dramatic blue and gold rim lighting, low heroic luxury angle"
    },
    {
        "style": {"uz": "Zamonaviy Pastel Infografika Maydoni", "ru": "Современная пастельная зона для инфографики", "en": "Modern Pastel Infographic Space"},
        "badge": {"uz": "ORIGINAL MAHSULOT", "ru": "ОРИГИНАЛЬНЫЙ ТОВАР", "en": "ORIGINAL PRODUCT"},
        "scene": "on a matte pastel pistachio cylinder podium, flat 5500K studio light, seamless shadowless background, generous empty space at the top"
    },
    {
        "style": {"uz": "Makro Tekstura va Sifat Fokusi", "ru": "Макро: текстура и качество", "en": "Macro Texture & Quality Focus"},
        "badge": {"uz": "MAXSUS DETALLAR", "ru": "ОСОБЫЕ ДЕТАЛИ", "en": "FINE DETAILS"},
        "scene": "macro close-up showing material texture, seams and surface finish, directional warm spotlight, softly blurred textured background"
    },
    {
        "style": {"uz": "Sahroyi Qum va Quyosh Nurlari", "ru": "Песок пустыни и солнечные лучи", "en": "Desert Sand & Sunlight"},
        "badge": {"uz": "TABIIY TARKIB", "ru": "НАТУРАЛЬНЫЙ СОСТАВ", "en": "NATURAL MATERIALS"},
        "scene": "on soft rippled golden sand with sandstone pieces, golden hour sunlight, long aesthetic shadows, open panoramic angle"
    },
    {
        "style": {"uz": "Industrial Beton va Metall Loft", "ru": "Индустриальный лофт: бетон и металл", "en": "Industrial Concrete & Metal Loft"},
        "badge": {"uz": "ZAMONAVIY USLUB", "ru": "СОВРЕМЕННЫЙ СТИЛЬ", "en": "MODERN STYLE"},
        "scene": "on lightly polished grey concrete with a thin metal frame, cool 6000K architectural lighting, strict geometric minimalist composition"
    },
    {
        "style": {"uz": "Suzuvchi Geometrik Podestlar", "ru": "Парящие геометрические подиумы", "en": "Floating Geometric Podiums"},
        "badge": {"uz": "YANGI TREND", "ru": "НОВЫЙ ТРЕНД", "en": "NEW TREND"},
        "scene": "on floating oval and cube podiums of different heights, soft studio light panels, airy dynamic mood, isometric 45-degree angle"
    },
    {
        "style": {"uz": "Organik Botanika va Yashillik", "ru": "Органика: ботаника и зелень", "en": "Organic Botanicals & Greenery"},
        "badge": {"uz": "EKOLOGIK TOZA", "ru": "ЭКОЛОГИЧНО", "en": "ECO-FRIENDLY"},
        "scene": "among green forest moss and natural stones, dappled sunlight through leaves, lively eco-friendly natural setting"
    },
    {
        "style": {"uz": "Glossy Suv Sathi va Shudring", "ru": "Глянцевая водная гладь и роса", "en": "Glossy Water Surface & Dew"},
        "badge": {"uz": "ENG SOTILGAN", "ru": "ХИТ ПРОДАЖ", "en": "BESTSELLER"},
        "scene": "on a gently rippling transparent water surface with dew drops, crystal-clear bright light and water sparkle, fresh summer mood"
    }
]

CARDS_COUNT = 5

BADGE_LANGUAGE_NAMES = {"uz": "Uzbek (Latin script)", "ru": "Russian", "en": "English"}


class GoogleAIServiceError(Exception):
    """Raised when Google AI Studio cannot produce a result."""


class GoogleAIStudioService:
    """
    Direct integration with Google AI Studio (https://aistudio.google.com).
    - analyze_product: Gemini text model reads the photo and writes bilingual SEO copy.
    - generate_studio_cards: Gemini image model re-shoots the user's own product in 5 random studio scenes.
    Strictly excludes all marketplace brand text and supports optional infographics.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None, image_model: Optional[str] = None):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model or settings.GEMINI_MODEL
        self.image_model = image_model or settings.GEMINI_IMAGE_MODEL
        self._client = None

        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
                logger.info(f"Google AI Studio client initialized (text: {self.model}, image: {self.image_model})")
            except Exception as e:
                logger.warning(f"Could not initialize google.genai Client: {e}")

    def _require_client(self):
        if not self._client:
            raise GoogleAIServiceError("GEMINI_API_KEY is not configured")
        return self._client

    async def analyze_product(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        badge_language: str = "uz"
    ) -> Dict[str, Any]:
        """
        Analyzes the product photo and returns bilingual (uz/ru) SEO copy
        plus infographic badges in the user's interface language.
        """
        from google.genai import types

        client = self._require_client()
        badge_language_name = BADGE_LANGUAGE_NAMES.get(badge_language, BADGE_LANGUAGE_NAMES["uz"])

        system_instruction = (
            "You are an elite e-commerce copywriter and catalog specialist. "
            "Analyze the provided raw product photo with extreme precision. "
            "CRITICAL REQUIREMENT: Do NOT include ANY marketplace brand names (such as Uzum, Wildberries, Ozon, AliExpress, Amazon) "
            "in titles, descriptions, tags, bullet points, or badges. "
            "Output STRICT valid JSON only."
        )

        prompt = (
            "Analyze this e-commerce product photo and return JSON with exactly these keys:\n"
            "{\n"
            '  "product_name_uz": "Mahsulotning o\'zbekcha nomi",\n'
            '  "product_name_en": "Short English product name",\n'
            '  "product_name_ru": "Наименование товара на русском",\n'
            '  "category": "Kategoriya",\n'
            '  "primary_colors": ["Ranglar"],\n'
            '  "materials": ["Materiallar"],\n'
            '  "key_features": ["4 ta asosiy afzallik"],\n'
            '  "title_uz": "Professional SEO sarlavha (o\'zbekcha)",\n'
            '  "title_ru": "Профессиональный SEO заголовок (русский)",\n'
            '  "bullet_points_uz": ["5 ta afzallik o\'zbekcha"],\n'
            '  "bullet_points_ru": ["5 преимуществ на русском"],\n'
            '  "seo_tags_uz": ["#teglar"],\n'
            '  "seo_tags_ru": ["#теги"],\n'
            f'  "infographic_badges": ["{CARDS_COUNT} short (1-3 words) UPPERCASE product benefit labels in {badge_language_name}"]\n'
            "}"
        )

        response = await client.aio.models.generate_content(
            model=self.model,
            contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime_type), prompt],
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                temperature=0.7
            )
        )

        if not response or not response.text:
            raise GoogleAIServiceError("Empty analysis response from Gemini")

        data = json.loads(response.text)
        if not isinstance(data, dict):
            raise GoogleAIServiceError("Gemini analysis is not a JSON object")
        return data

    async def generate_studio_cards(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        product_name: str = "",
        badges: Optional[List[str]] = None,
        include_infographics: bool = True,
        lang: str = "uz"
    ) -> List[Dict[str, Any]]:
        """
        Generates 5 studio cards of the user's own product in parallel.
        Returns only the cards that succeeded: [{"style", "badge", "image_bytes"}],
        with "style" and fallback badges in the requested language.
        """
        self._require_client()

        themes = random.sample(STUDIO_ENVIRONMENTS, CARDS_COUNT)
        badges = [b for b in (badges or []) if isinstance(b, str) and b.strip()]

        cards = []
        for idx, theme in enumerate(themes):
            badge = ""
            if include_infographics:
                badge = badges[idx] if idx < len(badges) else theme["badge"].get(lang, theme["badge"]["uz"])
            cards.append({
                "style": theme["style"].get(lang, theme["style"]["uz"]),
                "badge": badge.strip(),
                "scene": theme["scene"]
            })

        semaphore = asyncio.Semaphore(settings.IMAGE_GEN_CONCURRENCY)

        async def render(card: Dict[str, Any]) -> bytes:
            async with semaphore:
                return await self._generate_card_image(image_bytes, mime_type, product_name, card["scene"], card["badge"])

        results = await asyncio.gather(*(render(c) for c in cards), return_exceptions=True)

        ready = []
        for card, result in zip(cards, results):
            if isinstance(result, Exception):
                logger.error(f"Card '{card['style']}' generation failed: {result}")
                continue
            ready.append({"style": card["style"], "badge": card["badge"], "image_bytes": result})
        return ready

    async def _generate_card_image(
        self,
        image_bytes: bytes,
        mime_type: str,
        product_name: str,
        scene: str,
        badge: str
    ) -> bytes:
        from google.genai import types

        client = self._require_client()
        product = product_name or "the product"

        if badge:
            text_rule = (
                f'Add one clean, modern infographic badge with the exact text "{badge}" in the empty area, '
                "spelled exactly as given. No other text, no logos, no watermarks."
            )
        else:
            text_rule = "Do NOT add any text, badges, logos or watermarks."

        prompt = (
            f"Create a professional commercial e-commerce catalog photo of {product} from the attached photo. "
            "Keep the product itself exactly the same: identical shape, colors, materials, proportions, labels and details. "
            f"Remove the original background and place the product {scene}. "
            "Photorealistic, high detail, sharp focus on the product, vertical 3:4 composition. "
            f"{text_rule}"
        )

        config_kwargs: Dict[str, Any] = {"response_modalities": ["IMAGE"]}
        if hasattr(types, "ImageConfig"):
            config_kwargs["image_config"] = types.ImageConfig(aspect_ratio="3:4")

        response = await client.aio.models.generate_content(
            model=self.image_model,
            contents=[types.Part.from_bytes(data=image_bytes, mime_type=mime_type), prompt],
            config=types.GenerateContentConfig(**config_kwargs)
        )

        for candidate in response.candidates or []:
            if not candidate.content:
                continue
            for part in candidate.content.parts or []:
                if part.inline_data and part.inline_data.data:
                    return part.inline_data.data

        raise GoogleAIServiceError("Gemini image model returned no image")
