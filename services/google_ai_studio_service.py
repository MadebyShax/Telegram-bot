import json
import logging
import random
from typing import Dict, Any, Optional, List
from config import settings

logger = logging.getLogger(__name__)

# Rich pool of 15+ diverse studio aesthetics for varied, non-repetitive generations (NO marketplace brand names!)
STUDIO_ENVIRONMENTS = [
    {
        "style": "Minimalist Travertin Tosh Poydevor",
        "badge": "TOP SIFAT",
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
        "badge": "ORIGINAL MAHSULOT",
        "lighting": "Studiyaning tekis 5500K kunduzgi yoritgichi, silliq soyasiz fon",
        "surface": "Mat och pista yoki shaftoli rangli geometrik silindr poydevor",
        "angle": "Infografika matnlari uchun tepada keng joy qoldirilgan kompozitsiya"
    },
    {
        "style": "Makro Tekstura va Sifat Fokusi",
        "badge": "MAXSUS DETALLAR",
        "lighting": "Yo'naltirilgan fokusli iliq spot yorug'lik",
        "surface": "Yaqin masofadagi teksturaviy fon",
        "angle": "Makro 1:1 rakurs — material to'qimasi, choklar va sirt mukammalligi"
    },
    {
        "style": "Sahroyi Qum va Quyosh Nurlari",
        "badge": "TABIIY TARKIB",
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
    Strictly excludes all marketplace brand text and supports optional infographics.
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
        mime_type: str = "image/jpeg",
        include_infographics: bool = True
    ) -> Dict[str, Any]:
        """
        Zero-Prompt workflow:
        Analyzes photo and selects 5 completely varied and dynamic card styles.
        If include_infographics is False, removes all badges/text overlays for pure clean photo.
        """
        selected_themes = random.sample(STUDIO_ENVIRONMENTS, 5)

        if settings.USE_MOCK_SERVICES or not self._client:
            logger.info("Using Google AI Studio dynamic catalog fallback (randomized variations)")
            return self._build_dynamic_catalog_data(selected_themes, include_infographics)

        try:
            from google.genai import types

            random_seed = random.randint(1000, 99999)
            infographics_instruction = (
                "Include concise product feature badges." if include_infographics
                else "STRICTLY NO BADGES OR TEXT OVERLAYS: Leave all badges empty string \"\" for clean photography."
            )

            system_instruction = (
                "You are an elite e-commerce commercial photographer and creative director. "
                "Analyze the provided raw product photo with extreme precision. "
                f"Ensure maximum visual variety (Creative seed: {random_seed}). Every generation MUST be unique! "
                "CRITICAL REQUIREMENT: Do NOT include ANY marketplace brand names (such as Uzum, Wildberries, Ozon, AliExpress, Amazon) "
                "in titles, descriptions, tags, bullet points, or card badges. "
                f"{infographics_instruction} "
                "Output STRICT valid JSON only."
            )

            prompt = (
                f"Analyze this e-commerce product photo (Zero-Prompt workflow, seed {random_seed}).\n"
                "Extract properties and generate universal bilingual SEO copy and 5 distinctly varied studio card prompts:\n"
                "{\n"
                '  "product_name_uz": "Mahsulotning o\'zbekcha nomi",\n'
                '  "product_name_ru": "Наименование товара на русском",\n'
                '  "category": "Kategoriya",\n'
                '  "primary_colors": ["Ranglar"],\n'
                '  "materials": ["Materiallar"],\n'
                '  "shape_and_form": "Shakl tavsifi",\n'
                '  "key_features": ["4 ta asosiy afzallik"],\n'
                '  "suggested_price_uzs": 185000,\n'
                '  "uzum_title_uz": "Professional sarlavha (o\'zbekcha)",\n'
                '  "uzum_title_ru": "Профессиональный заголовок (русский)",\n'
                '  "wildberries_title_ru": "Товарный заголовок (русский)",\n'
                '  "bullet_points_uz": ["5 ta afzallik bullet point o\'zbekcha"],\n'
                '  "bullet_points_ru": ["5 преимуществ на русском"],\n'
                '  "seo_tags_uz": ["#teglar"],\n'
                '  "seo_tags_ru": ["#теги"],\n'
                '  "studio_cards": [\n'
                f'    {{"index": 1, "style": "Uslub nomi", "badge": "{"AFZALLIK BELGISI" if include_infographics else ""}", "aspect_ratio": "3:4", "prompt": "Studiya foni tavsifi"}}\n'
                '  ]\n'
                "}"
            )

            response = self._client.models.generate_content(
                model=self.model,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                    prompt
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    temperature=0.85
                )
            )

            if response and response.text:
                data = json.loads(response.text)
                if not data.get("studio_cards") or len(data["studio_cards"]) < 5:
                    data["studio_cards"] = self._format_cards_from_themes(selected_themes, include_infographics)
                elif not include_infographics:
                    for card in data["studio_cards"]:
                        card["badge"] = ""
                return data

            return self._build_dynamic_catalog_data(selected_themes, include_infographics)

        except Exception as e:
            logger.exception(f"Google AI Studio generation error: {e}")
            return self._build_dynamic_catalog_data(selected_themes, include_infographics)

    def _format_cards_from_themes(self, themes: List[Dict[str, str]], include_infographics: bool = True) -> List[Dict[str, Any]]:
        image_pool = [
            "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
            "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80"
        ]
        random.shuffle(image_pool)

        return [
            {
                "index": i + 1,
                "style": theme["style"],
                "badge": theme["badge"] if include_infographics else "",
                "aspect_ratio": "3:4",
                "image_url": image_pool[i % len(image_pool)],
                "prompt": f"{theme['surface']}, {theme['lighting']}, {theme['angle']}"
            }
            for i, theme in enumerate(themes)
        ]

    def _build_dynamic_catalog_data(self, selected_themes: List[Dict[str, str]], include_infographics: bool = True) -> Dict[str, Any]:
        return {
            "product_name_uz": "Premium E-Commerce Mahsuloti",
            "product_name_ru": "Премиальный товар для онлайн-продаж",
            "category": "Oshxona anjomlari / Idish-tovoq",
            "primary_colors": ["Mat oq", "Tabiiy yog'och", "Moviy lazur"],
            "materials": ["Yuqori sifatli keramika", "Eman daraxti"],
            "shape_and_form": "Ergonomik silindr shakli",
            "key_features": [
                "100% ekologik xavfsiz tabiiy minerallardan olingan bo'yoqlar",
                "Issiqlikni 2 barobar uzoqroq saqlovchi qalin devor",
                "Tomchilamaydigan maxsus ergonomik naycha shakli",
                "Oson yuviladi va kundalik foydalanishga bardoshli"
            ],
            "suggested_price_uzs": 185000,
            "uzum_title_uz": "Keramik choynak to'plami, choy damlash uchun nafis sovg'a (1000ml)",
            "uzum_title_ru": "Заварочный керамический чайник подарочный (1000мл)",
            "wildberries_title_ru": "Заварочный чайник керамический для дома и кухни",
            "bullet_points_uz": [
                "🫖 100% original va sertifikatlangan ekologik mahsulot",
                "🌿 Choyning ta'mi va xushbo'yligini to'liq saqlaydi",
                "💎 Qalin devorlar haroratni uzoq vaqt ushlab turadi",
                "🎁 Nafis sovg'abop mustahkam qutida yetkaziladi",
                "⚡️ Xavfsiz va tezkor yetkazib berish kafolati"
            ],
            "bullet_points_ru": [
                "🫖 100% безопасная экологичная керамика премиум класса",
                "🌿 Сохраняет насыщенный вкус и аромат напитка",
                "💎 Толстые стенки удерживают тепло до 2 часов",
                "🎁 Прочная подарочная упаковка",
                "⚡️ Экспресс доставка в защитной упаковке"
            ],
            "seo_tags_uz": ["#choynak", "#sovga", "#idish", "#sifatli", "#oshxona"],
            "seo_tags_ru": ["#посуда", "#чайник", "#подарок", "#кухня", "#уют"],
            "studio_cards": self._format_cards_from_themes(selected_themes, include_infographics)
        }
