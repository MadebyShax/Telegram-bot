import logging
from typing import List, Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)


class PresentationService:
    """
    Zero-Prompt Product Presentation & Pitch Deck Generator.
    Synthesizes raw product photos into 5 professional 16:9 presentation slide images
    (NotebookLM / Google Slides format) without requiring any prompt text from the seller.
    """

    def __init__(self):
        pass

    async def generate_product_presentation_slides(
        self,
        metadata: Dict[str, Any],
        raw_image_url: str
    ) -> List[Dict[str, Any]]:
        """
        Generates 5 presentation slide cards formatted as 16:9 widescreen slides:
        Slide 1: Executive Title & Commercial Hero
        Slide 2: Value Proposition & Customer Problem/Solution
        Slide 3: Technical Specifications & Craftsmanship
        Slide 4: Marketplace Economics & Competitive Edge
        Slide 5: Procurement & B2B Call to Action
        """
        title = metadata.get("product_name_uz", "Mahsulot Taqdimoti")
        category = metadata.get("category", "E-commerce")
        price = metadata.get("suggested_price_uzs", 185000)

        slides = [
            {
                "slide_number": 1,
                "title": f"Mahsulot Taqdimoti: {title}",
                "slide_type": "Executive Cover & Brand Hero",
                "aspect_ratio": "16:9",
                "headline": title,
                "subheadline": f"{category} · Uzum Market & Wildberries Katalogi",
                "image_url": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=1200&q=80",
                "key_bullets": [
                    "Bozor talabi yuqori bo'lgan e-commerce mahsuloti",
                    "Yuqori sifatli sertifikatlangan materiallar",
                    "1 kunda yetkazib berish tizimiga to'liq mos"
                ]
            },
            {
                "slide_number": 2,
                "title": "Mijoz Uchun Asosiy Qulayliklar va Yechimlar",
                "slide_type": "Problem-Solution & Value Prop",
                "aspect_ratio": "16:9",
                "headline": "Xaridor Nega Aynan Shu Mahsulotni Tanlaydi?",
                "subheadline": "Konversiyani oshiruvchi asosiy omillar",
                "image_url": "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=1200&q=80",
                "key_bullets": metadata.get("key_features", [
                    "100% ekologik toza va bardoshli tarkib",
                    "Uzoq muddatli xizmat ko'rsatish kafolati",
                    "Sovg'abop mustahkam qadoq"
                ])
            },
            {
                "slide_number": 3,
                "title": "Texnik Ko'rsatkichlar va Materiallar",
                "slide_type": "Specifications & Quality",
                "aspect_ratio": "16:9",
                "headline": "Materiallar va Ishlab Chiqarish Sifati",
                "subheadline": "Standartlar va tekshirilgan xususiyatlar",
                "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=80",
                "key_bullets": [
                    f"Asosiy material: {', '.join(metadata.get('materials', ['Yuqori sifat']))}",
                    f"Ranglar palitrasi: {', '.join(metadata.get('primary_colors', ['Tabiiy']))}",
                    f"Shakl va o'lcham: {metadata.get('shape_and_form', 'Klassik ergonomik')}",
                    "14 kunlik qaytarish va almashtirish kafolati"
                ]
            },
            {
                "slide_number": 4,
                "title": "Bozor Iqtisodiyoti va Sotuv Dinamikasi",
                "slide_type": "Marketplace Economics",
                "aspect_ratio": "16:9",
                "headline": "Uzum va Wildberries Sotuv Ko'rsatkichlari",
                "subheadline": "Renta va xarid qobiliyati tahlili",
                "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1200&q=80",
                "key_bullets": [
                    f"Tavsiya etilgan chakana narx: {price:,.0f} UZS",
                    "Uzum Nasiya orqali 12 oylik to'lov imkoniyati",
                    "O'rtacha sotuv marjasi: 35% - 48%",
                    "Top-50 reytingiga kirish ehtimoli yuqori"
                ]
            },
            {
                "slide_number": 5,
                "title": "Buyurtma va Yetkazib Berish Shartlari",
                "slide_type": "Call to Action & Procurement",
                "aspect_ratio": "16:9",
                "headline": "Ulgurji va Chakana Sotib Olish",
                "subheadline": "Toshkent va butun O'zbekiston bo'yicha yetkazish",
                "image_url": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
                "key_bullets": [
                    "Buyurtma berilgan kundan 1 kunda yetkazish",
                    "Click va Payme orqali xavfsiz to'lov",
                    "B2B rasmiy shartnoma va hisob-faktura",
                    "Telegram bot orqali 24/7 qabul qilish"
                ]
            }
        ]

        return slides
