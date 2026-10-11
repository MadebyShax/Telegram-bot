import json
import logging
from typing import Dict, Any, Optional
import aiohttp
from config import settings

logger = logging.getLogger(__name__)


class SeoService:
    """
    Generates marketplace-optimized titles, selling bullet points, and SEO keywords
    specifically structured for Uzum Market (Uzbekistan) and Wildberries in Uzbek and Russian.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY

    async def generate_marketplace_copy(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Creates bilingual SEO content based on extracted product metadata.
        """
        if settings.USE_MOCK_SERVICES or not self.api_key:
            return self._get_mock_seo(metadata)

        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }

            system_prompt = (
                "You are an elite marketplace ranking specialist for Uzum Market (uzum.uz) and Wildberries. "
                "Generate maximum conversion, algorithm-friendly titles and description points. "
                "Output STRICT JSON format."
            )

            prompt = (
                f"Product metadata: {json.dumps(metadata, ensure_ascii=False)}\n\n"
                "Generate the following JSON structure:\n"
                "{\n"
                '  "uzum_title_uz": "Uzum uchun 100 belgilik SEO sarlavha (asosiy kalit so\'zlar bilan)",\n'
                '  "uzum_title_ru": "Заголовок для Uzum Market на русском (высокочастотные запросы)",\n'
                '  "wildberries_title_ru": "Заголовок для Wildberries (до 60 знаков, ключевики)",\n'
                '  "bullet_points_uz": ["5 ta xaridorni ishontiruvchi afzallik nuqtalari"],\n'
                '  "bullet_points_ru": ["5 продающих буллетов с характеристиками"],\n'
                '  "seo_tags_uz": ["#uzum #tavsiya #arzon..."],\n'
                '  "seo_tags_ru": ["#вайлдберриз #акция #подарок..."],\n'
                '  "infographic_badges": ["100% SIFAT", "TEZ YETKAZISH", "KAFOLAT 1 YIL", "TOP SOTUV", "EKOLOGIK TOZA"]\n'
                "}"
            )

            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.7
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as resp:
                    if resp.status == 200:
                        res = await resp.json()
                        return json.loads(res["choices"][0]["message"]["content"])
                    return self._get_mock_seo(metadata)

        except Exception as e:
            logger.exception(f"SEO generation error: {e}")
            return self._get_mock_seo(metadata)

    def _get_mock_seo(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        p_uz = metadata.get("product_name_uz", "Premium Mahsulot")
        p_ru = metadata.get("product_name_ru", "Премиум Товар")

        return {
            "uzum_title_uz": f"{p_uz}, yuqori sifatli, sovg'abop qadoqda — Uzum 1 kunda yetkazish",
            "uzum_title_ru": f"{p_ru}, премиальное качество в подарочной упаковке — Доставка 1 день",
            "wildberries_title_ru": f"{p_ru} для дома и кухни подарочный набор",
            "bullet_points_uz": [
                "⭐️ 100% original va sertifikatlangan ekologik toza mahsulot",
                "💎 Chidamlilik kafolati: uzoq yillar o'z holatini yo'qotmaydi",
                "🎁 Nafis sovg'abop qadoq — har qanday bayram uchun ajoyib tuhfa",
                "⚡️ Uzum Market orqali Toshkent va viloyatlarga 1 kunda yetkazib berish",
                "🛡 14 kunlik to'liq qaytarish va almashtirish kafolati"
            ],
            "bullet_points_ru": [
                "⭐️ 100% экологичные и безопасные материалы премиум класса",
                "💎 Повышенная износостойкость и термостойкость",
                "🎁 Стильная подарочная коробка — идеальный подарок близким",
                "⚡️ Быстрая доставка по всему Узбекистану за 1 день",
                "🛡 Гарантия качества и легкий возврат в течение 14 дней"
            ],
            "seo_tags_uz": [
                "#uzummarket", "#toshkent", "#chegirma", "#sovga", "#topmahsulot", "#uzbekistan"
            ],
            "seo_tags_ru": [
                "#wildberries", "#узбекистан", "#товардня", "#хитпродаж", "#подарок", "#узум"
            ],
            "infographic_badges": [
                "100% SIFAT KAFOLATI",
                "1 KUNDA YETKAZISH",
                "TOP SOTUVDA",
                "PREMIUM MATERIAL",
                "SOVG'A QUTISIDA"
            ]
        }
