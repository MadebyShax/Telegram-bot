import json
import logging
from typing import Dict, Any, Optional
import aiohttp
from config import settings

logger = logging.getLogger(__name__)


class VisionService:
    """
    Service for analyzing raw e-commerce product photos with OpenAI GPT-4o Vision API
    to extract structured metadata without requiring any user prompts.
    """

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL

    async def analyze_product_image(self, image_bytes_or_url: bytes | str) -> Dict[str, Any]:
        """
        Analyzes raw product photo and returns structured JSON describing
        product type, color, material, shape, and key features.
        """
        if settings.USE_MOCK_SERVICES or not self.api_key:
            logger.info("Using VisionService mock analysis (zero-prompt fallback)")
            return self._get_mock_analysis()

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
                "Analyze the provided raw product photo with precision. Output STRICT JSON only without markdown formatting."
            )

            user_prompt = (
                "Extract the following properties in JSON format:\n"
                "{\n"
                '  "product_name_uz": "Mahsulotning o\'zbekcha aniq nomi",\n'
                '  "product_name_ru": "Точное наименование товара на русском",\n'
                '  "category": "Kategoriya (masalan, Oshxona, Aksessuarlar, Kiyim)",\n'
                '  "primary_colors": ["Asosiy ranglar"],\n'
                '  "materials": ["Materiallar, masalan: keramika, charm, zanglamas po\'lat"],\n'
                '  "shape_and_form": "Shakl va o\'lcham xususiyatlari",\n'
                '  "key_features": ["3-5 ta asosiy foydali xususiyatlari"],\n'
                '  "target_audience": "Mo\'ljallangan xaridorlar auditoriyasi",\n'
                '  "suggested_price_uzs": 120000,\n'
                '  "studio_background_recommendation": "Tavsiya etiladigan studiya foni va yorug\'lik uslubi"\n'
                "}"
            )

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
                "response_format": {"type": "json_object"},
                "max_tokens": 1000
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=45)
                ) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        logger.error(f"OpenAI Vision API error: {resp.status} - {error_text}")
                        return self._get_mock_analysis()

                    data = await resp.json()
                    content = data["choices"][0]["message"]["content"]
                    return json.loads(content)

        except Exception as e:
            logger.exception(f"Vision analysis failed, falling back to mock: {e}")
            return self._get_mock_analysis()

    def _get_mock_analysis(self) -> Dict[str, Any]:
        """Realistic fallback metadata for Uzum and Wildberries marketplace sellers."""
        return {
            "product_name_uz": "Klassik Keramik Choynak va Chashka To'plami",
            "product_name_ru": "Классический керамический заварочный чайник с чашкой",
            "category": "Oshxona anjomlari / Idish-tovoq",
            "primary_colors": ["Mat oq", "Yong'oq yog'ochi"],
            "materials": ["Yuqori sifatli olovbardosh keramika", "Tabiiy yog'och qopqoq"],
            "shape_and_form": "Minimalist silindrsimon, ergonomik tutqich bilan",
            "key_features": [
                "100% ekologik xavfsiz oziq-ovqat keramikasi",
                "Issiqlikni 2 barobar uzoqroq saqlovchi qalin devor",
                "Tomchilamaydigan maxsus naycha shakli",
                "Oson yuviladi va idish yuvish mashinasiga mos"
            ],
            "target_audience": "Oila bekalari, choy ixlosmandlari, yangi xonadonga sovg'a izlovchilar",
            "suggested_price_uzs": 185000,
            "studio_background_recommendation": "Minimalist travertin tosh poydevor, iliq tonggi quyosh nurlari va yengil bug' effekti"
        }
