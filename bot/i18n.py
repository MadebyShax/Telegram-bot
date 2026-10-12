"""
All user-facing bot texts in Uzbek, Russian and English.
Usage: t(lang, "key", **format_args). Missing languages fall back to Uzbek.
"""
from typing import Optional

SUPPORTED_LANGUAGES = ("uz", "ru", "en")
DEFAULT_LANGUAGE = "uz"


def detect_language(telegram_language_code: Optional[str]) -> str:
    """Initial language for a new user, based on their Telegram app language."""
    code = (telegram_language_code or "").lower()
    if code.startswith("ru"):
        return "ru"
    if code.startswith("en"):
        return "en"
    return DEFAULT_LANGUAGE


def normalize_language(lang: Optional[str]) -> str:
    return lang if lang in SUPPORTED_LANGUAGES else DEFAULT_LANGUAGE


TEXTS: dict[str, dict[str, str]] = {
    # ---------- /start & registration ----------
    "btn_share_phone": {
        "uz": "📱 Telefon raqamni yuborish (+{packs} Bepul Paket)",
        "ru": "📱 Отправить номер телефона (+{packs} бесплатный пакет)",
        "en": "📱 Share phone number (+{packs} free package)",
    },
    "welcome_new": {
        "uz": (
            "Assalomu alaykum, <b>{name}</b>!\n\n"
            "⚡️ <b>Zero-Prompt E-Commerce AI Botiga xush kelibsiz!</b>\n"
            "E-Commerce va online savdo uchun professional studiya kartochkalari generatori.\n\n"
            "🎁 <b>Xush kelibsiz bonusi:</b>\n"
            "Pastdagi tugmani bosib, telefon raqamingizni tasdiqlang va darhol "
            "<b>{packs} ta bepul paket ({cards} ta studiya kartochkasi + to'liq SEO tavsif)</b> ga ega bo'ling!"
        ),
        "ru": (
            "Здравствуйте, <b>{name}</b>!\n\n"
            "⚡️ <b>Добро пожаловать в Zero-Prompt E-Commerce AI бот!</b>\n"
            "Генератор профессиональных студийных карточек для онлайн-продаж.\n\n"
            "🎁 <b>Приветственный бонус:</b>\n"
            "Нажмите кнопку ниже, подтвердите номер телефона и сразу получите "
            "<b>{packs} бесплатный пакет ({cards} студийных карточек + полное SEO-описание)</b>!"
        ),
        "en": (
            "Hello, <b>{name}</b>!\n\n"
            "⚡️ <b>Welcome to the Zero-Prompt E-Commerce AI Bot!</b>\n"
            "A generator of professional studio product cards for online sellers.\n\n"
            "🎁 <b>Welcome bonus:</b>\n"
            "Tap the button below, confirm your phone number and instantly get "
            "<b>{packs} free package ({cards} studio cards + full SEO description)</b>!"
        ),
    },
    "welcome_back": {
        "uz": (
            "Xush kelibsiz, <b>{name}</b>!\n\n"
            "📸 <b>Shunchaki mahsulotingiz rasmini yuboring!</b> Hech qanday prompt yozish shart emas.\n\n"
            "💰 <b>Sizning balansingiz:</b> <code>{credits}</code> ta paket ({cards} ta kartochka)\n\n"
            "👉 Boshlash uchun hoziroq mahsulot rasmini chatga tashlang!"
        ),
        "ru": (
            "С возвращением, <b>{name}</b>!\n\n"
            "📸 <b>Просто отправьте фото товара!</b> Никаких промптов писать не нужно.\n\n"
            "💰 <b>Ваш баланс:</b> <code>{credits}</code> пакет(ов) ({cards} карточек)\n\n"
            "👉 Чтобы начать, отправьте фото товара в чат!"
        ),
        "en": (
            "Welcome back, <b>{name}</b>!\n\n"
            "📸 <b>Just send a photo of your product!</b> No prompts needed.\n\n"
            "💰 <b>Your balance:</b> <code>{credits}</code> package(s) ({cards} cards)\n\n"
            "👉 Send a product photo to the chat to get started!"
        ),
    },
    "btn_buy": {
        "uz": "💳 {cards} ta kartochka sotib olish ({price} UZS)",
        "ru": "💳 Купить {cards} карточек ({price} UZS)",
        "en": "💳 Buy {cards} cards ({price} UZS)",
    },
    "btn_lang": {
        "uz": "🌐 Tilni o'zgartirish / Язык / Language",
        "ru": "🌐 Сменить язык / Til / Language",
        "en": "🌐 Change language / Til / Язык",
    },
    "btn_how": {
        "uz": "ℹ️ Qanday ishlaydi?",
        "ru": "ℹ️ Как это работает?",
        "en": "ℹ️ How does it work?",
    },
    "contact_not_own": {
        "uz": "⚠️ Iltimos, faqat o'zingizning Telegram hisobingizga tegishli telefon raqamni yuboring.",
        "ru": "⚠️ Пожалуйста, отправьте номер телефона, привязанный к вашему собственному аккаунту Telegram.",
        "en": "⚠️ Please share only the phone number of your own Telegram account.",
    },
    "already_registered": {
        "uz": "Siz allaqachon ro'yxatdan o'tgansiz! Mahsulot rasmini yuborishingiz mumkin.",
        "ru": "Вы уже зарегистрированы! Можете отправить фото товара.",
        "en": "You are already registered! You can send a product photo.",
    },
    "phone_verified": {
        "uz": (
            "🎉 <b>Tabriklaymiz! Telefon raqamingiz muvaffaqiyatli tasdiqlandi.</b>\n\n"
            "📞 <b>Raqam:</b> <code>{phone}</code>\n"
            "🎁 <b>Bonus:</b> <b>+{packs} ta bepul paket ({cards} ta studiya kartochkasi)</b> hisobingizga qo'shildi!\n\n"
            "📸 <b>Endi mahsulotingiz rasmini chatga yuboring</b> — sun'iy intellekt uni avtomatik studiya darajasiga olib chiqadi!"
        ),
        "ru": (
            "🎉 <b>Поздравляем! Номер телефона успешно подтверждён.</b>\n\n"
            "📞 <b>Номер:</b> <code>{phone}</code>\n"
            "🎁 <b>Бонус:</b> <b>+{packs} бесплатный пакет ({cards} студийных карточек)</b> зачислен на ваш баланс!\n\n"
            "📸 <b>Теперь отправьте фото товара в чат</b> — искусственный интеллект автоматически сделает из него студийные снимки!"
        ),
        "en": (
            "🎉 <b>Congratulations! Your phone number is verified.</b>\n\n"
            "📞 <b>Number:</b> <code>{phone}</code>\n"
            "🎁 <b>Bonus:</b> <b>+{packs} free package ({cards} studio cards)</b> added to your balance!\n\n"
            "📸 <b>Now send your product photo to the chat</b> — AI will turn it into studio-quality shots automatically!"
        ),
    },
    "ready_to_start": {
        "uz": "Boshlashga tayyormisiz?",
        "ru": "Готовы начать?",
        "en": "Ready to start?",
    },
    "choose_language": {
        "uz": "🌐 <b>Tilni tanlang / Выберите язык / Select language:</b>",
        "ru": "🌐 <b>Tilni tanlang / Выберите язык / Select language:</b>",
        "en": "🌐 <b>Tilni tanlang / Выберите язык / Select language:</b>",
    },
    "language_changed": {
        "uz": "✅ Til <b>O'zbekcha</b> ga o'zgartirildi! Endi mahsulot rasmini yuborishingiz mumkin.",
        "ru": "✅ Язык изменен на <b>Русский</b>! Теперь вы можете отправить фото товара.",
        "en": "✅ Language updated to <b>English</b>! You can now send your product photo.",
    },
    "how_it_works": {
        "uz": (
            "📖 <b>Zero-Prompt qanday ishlaydi?</b>\n\n"
            "1. Telefoningizda mahsulotni oddiy stol ustida yoki qo'lda suratga oling.\n"
            "2. Rasmni to'g'ridan-to'g'ri ushbu botga yuboring.\n"
            "3. Sun'iy intellekt orqa fonni tozalab, mahsulotni 5 xil zamonaviy studiya interyeriga joylaydi "
            "(travertin poydevor, shinam xonadon, qorong'u lyuks vitrina, makro detallar va boshqalar — har safar yangi).\n"
            "4. Xohlasangiz, kartochkalarga infografika yozuvlari qo'shiladi.\n"
            "5. Savdo platformalari talablariga mos keladigan professional SEO sarlavha va kalit so'zlarni olasiz."
        ),
        "ru": (
            "📖 <b>Как работает Zero-Prompt?</b>\n\n"
            "1. Сфотографируйте товар на телефон — на обычном столе или в руке.\n"
            "2. Отправьте фото прямо в этот бот.\n"
            "3. ИИ уберёт фон и поместит товар в 5 разных современных студийных интерьеров "
            "(травертиновый подиум, уютный дом, тёмная люкс-витрина, макро-детали и другие — каждый раз новые).\n"
            "4. По желанию на карточки добавляется инфографика.\n"
            "5. Вы получите профессиональный SEO-заголовок и ключевые слова под требования торговых площадок."
        ),
        "en": (
            "📖 <b>How does Zero-Prompt work?</b>\n\n"
            "1. Take a photo of your product with your phone — on a plain table or in your hand.\n"
            "2. Send the photo straight to this bot.\n"
            "3. AI removes the background and places the product in 5 different modern studio scenes "
            "(travertine podium, cozy home, dark luxury showcase, macro details and more — new every time).\n"
            "4. Optionally, infographic badges are added to the cards.\n"
            "5. You get a professional SEO title and keywords that fit marketplace requirements."
        ),
    },

    # ---------- payments ----------
    "topup_title": {
        "uz": (
            "💳 <b>Balansni to'ldirish</b>\n\n"
            "Paket: <b>{cards} ta professional AI kartochka + SEO matn</b>\n"
            "Narxi: <b>{price} UZS</b>\n\n"
            "To'lov turini tanlang. To'lov to'g'ridan-to'g'ri Telegram ichida amalga oshiriladi:"
        ),
        "ru": (
            "💳 <b>Пополнение баланса</b>\n\n"
            "Пакет: <b>{cards} профессиональных AI-карточек + SEO-текст</b>\n"
            "Цена: <b>{price} UZS</b>\n\n"
            "Выберите способ оплаты. Оплата проходит прямо внутри Telegram:"
        ),
        "en": (
            "💳 <b>Top up balance</b>\n\n"
            "Package: <b>{cards} professional AI cards + SEO copy</b>\n"
            "Price: <b>{price} UZS</b>\n\n"
            "Choose a payment method. Payment happens right inside Telegram:"
        ),
    },
    "btn_pay_click": {
        "uz": "🔵 Click orqali to'lash ({price} UZS)",
        "ru": "🔵 Оплатить через Click ({price} UZS)",
        "en": "🔵 Pay with Click ({price} UZS)",
    },
    "btn_pay_payme": {
        "uz": "🟢 Payme orqali to'lash ({price} UZS)",
        "ru": "🟢 Оплатить через Payme ({price} UZS)",
        "en": "🟢 Pay with Payme ({price} UZS)",
    },
    "invoice_title": {
        "uz": "AI Mahsulot Kartochkalari ({cards} ta)",
        "ru": "AI-карточки товара ({cards} шт.)",
        "en": "AI Product Cards ({cards} pcs)",
    },
    "invoice_description": {
        "uz": "{cards} ta professional studiya kartochkasi hamda o'zbek/rus tillarida SEO tavsif generatsiyasi.",
        "ru": "{cards} профессиональных студийных карточек и SEO-описание на узбекском и русском языках.",
        "en": "{cards} professional studio cards plus an SEO description in Uzbek and Russian.",
    },
    "invoice_label": {
        "uz": "{cards} ta AI studiya kartochkasi",
        "ru": "{cards} AI студийных карточек",
        "en": "{cards} AI studio cards",
    },
    "invoice_expired": {
        "uz": "Hisob-faktura eskirgan. Iltimos, /start orqali qaytadan to'lov qiling.",
        "ru": "Счёт устарел. Пожалуйста, оплатите заново через /start.",
        "en": "This invoice is outdated. Please pay again via /start.",
    },
    "payment_success": {
        "uz": (
            "✅ <b>To'lov muvaffaqiyatli qabul qilindi!</b>\n\n"
            "To'langan summa: <b>{amount} UZS</b>\n"
            "Sizning yangi balansingiz: <b>{credits} ta paket</b> ({cards} ta kartochka)\n\n"
            "📸 Endi mahsulot rasmini yuboring va natijani oling!"
        ),
        "ru": (
            "✅ <b>Оплата успешно получена!</b>\n\n"
            "Оплачено: <b>{amount} UZS</b>\n"
            "Ваш новый баланс: <b>{credits} пакет(ов)</b> ({cards} карточек)\n\n"
            "📸 Теперь отправьте фото товара и получите результат!"
        ),
        "en": (
            "✅ <b>Payment received successfully!</b>\n\n"
            "Amount paid: <b>{amount} UZS</b>\n"
            "Your new balance: <b>{credits} package(s)</b> ({cards} cards)\n\n"
            "📸 Now send a product photo and get your result!"
        ),
    },

    # ---------- photo upload & generation ----------
    "need_start": {
        "uz": "👋 Avval /start buyrug'ini bosing va ro'yxatdan o'ting.",
        "ru": "👋 Сначала нажмите /start и зарегистрируйтесь.",
        "en": "👋 Please press /start and register first.",
    },
    "no_credits": {
        "uz": (
            "⚠️ <b>Balansingizda generatsiya paketlari tugadi.</b>\n\n"
            "{cards} ta professional e-commerce studiya kartochkasi va to'liq SEO tavsif "
            "yaratish uchun hisobingizni to'ldiring ({price} UZS):"
        ),
        "ru": (
            "⚠️ <b>На вашем балансе закончились пакеты генерации.</b>\n\n"
            "Пополните баланс ({price} UZS), чтобы создать {cards} профессиональных "
            "студийных карточек и полное SEO-описание:"
        ),
        "en": (
            "⚠️ <b>You have no generation packages left.</b>\n\n"
            "Top up your balance ({price} UZS) to create {cards} professional "
            "studio cards and a full SEO description:"
        ),
    },
    "photo_received": {
        "uz": (
            "📸 <b>Mahsulot surati qabul qilindi!</b>\n\n"
            "📊 <b>Mahsulot kartochkalariga Infografika qo'shilsinmi?</b>\n\n"
            "✨ <b>Ha, infografika bilan</b> — mahsulotning asosiy afzalliklari yozilgan belgilar bilan\n"
            "📸 <b>Yo'q, toza fotosurat</b> — hech qanday yozuv va belgilarsiz toza studiya suratlari"
        ),
        "ru": (
            "📸 <b>Фото товара получено!</b>\n\n"
            "📊 <b>Добавить инфографику на карточки?</b>\n\n"
            "✨ <b>Да, с инфографикой</b> — с бейджами ключевых преимуществ товара\n"
            "📸 <b>Нет, чистое фото</b> — чистые студийные снимки без надписей и значков"
        ),
        "en": (
            "📸 <b>Product photo received!</b>\n\n"
            "📊 <b>Add infographics to the cards?</b>\n\n"
            "✨ <b>Yes, with infographics</b> — with badges showing the product's key benefits\n"
            "📸 <b>No, clean photo</b> — clean studio shots without any text or badges"
        ),
    },
    "btn_info_yes": {
        "uz": "✨ Ha, infografika bilan",
        "ru": "✨ Да, с инфографикой",
        "en": "✨ Yes, with infographics",
    },
    "btn_info_no": {
        "uz": "📸 Yo'q, toza fotosurat",
        "ru": "📸 Нет, чистое фото",
        "en": "📸 No, clean photo",
    },
    "session_expired": {
        "uz": "Rasm sessiyasi tugagan. Mahsulot rasmini qaytadan yuboring.",
        "ru": "Сессия фото истекла. Отправьте фото товара ещё раз.",
        "en": "The photo session has expired. Please send the product photo again.",
    },
    "not_enough_credits": {
        "uz": "Balansingizda paketlar yetarli emas!",
        "ru": "На балансе недостаточно пакетов!",
        "en": "Not enough packages on your balance!",
    },
    "topup_then_retry": {
        "uz": "💳 Hisobingizni to'ldiring, so'ng tugmani qayta bosing:",
        "ru": "💳 Пополните баланс, затем нажмите кнопку ещё раз:",
        "en": "💳 Top up your balance, then press the button again:",
    },
    "choice_infographics": {
        "uz": "✨ <b>Infografika tanlandi.</b> Mahsulot afzalliklari yozilgan kartochkalar tayyorlanmoqda...",
        "ru": "✨ <b>Выбрана инфографика.</b> Готовим карточки с преимуществами товара...",
        "en": "✨ <b>Infographics selected.</b> Preparing cards with the product's benefits...",
    },
    "choice_clean": {
        "uz": "📸 <b>Toza fotosurat tanlandi.</b> Yozuv va belgilarsiz toza studiya suratlari tayyorlanmoqda...",
        "ru": "📸 <b>Выбрано чистое фото.</b> Готовим чистые студийные снимки без надписей...",
        "en": "📸 <b>Clean photo selected.</b> Preparing clean studio shots without any text...",
    },
    "working": {
        "uz": "⏳ <b>Google AI Studio ishlamoqda (1-2 daqiqa)...</b>\n<i>{choice}</i>",
        "ru": "⏳ <b>Google AI Studio работает (1-2 минуты)...</b>\n<i>{choice}</i>",
        "en": "⏳ <b>Google AI Studio is working (1-2 minutes)...</b>\n<i>{choice}</i>",
    },
    "generation_failed": {
        "uz": (
            "❌ <b>Kartochkalarni yaratib bo'lmadi.</b>\n"
            "Balansingizdan hech narsa yechilmadi. Iltimos, qaytadan urinib ko'ring yoki sifatliroq rasm yuboring."
        ),
        "ru": (
            "❌ <b>Не удалось создать карточки.</b>\n"
            "С баланса ничего не списано. Попробуйте ещё раз или отправьте более качественное фото."
        ),
        "en": (
            "❌ <b>Could not create the cards.</b>\n"
            "Nothing was charged from your balance. Please try again or send a better-quality photo."
        ),
    },
    "album_caption": {
        "uz": "📸 <b>Studiya kartochkalari:</b>\n{styles}",
        "ru": "📸 <b>Студийные карточки:</b>\n{styles}",
        "en": "📸 <b>Studio cards:</b>\n{styles}",
    },
    "cards_ready": {
        "uz": "🎉 <b>{count} ta yangi professional studiya kartochkasi tayyor!</b>",
        "ru": "🎉 <b>Готово {count} новых профессиональных студийных карточек!</b>",
        "en": "🎉 <b>{count} new professional studio cards are ready!</b>",
    },
    "send_next_photo": {
        "uz": "📸 Keyingi mahsulot rasmini yuborishingiz mumkin!",
        "ru": "📸 Можете отправить фото следующего товара!",
        "en": "📸 You can send the next product photo!",
    },
    "ask_seo": {
        "uz": "📝 <b>Mahsulot uchun professional SEO tavsifi (sarlavha, afzalliklar va qidiruv teglari) kerakmi?</b>",
        "ru": "📝 <b>Нужно профессиональное SEO-описание товара (заголовок, преимущества и поисковые теги)?</b>",
        "en": "📝 <b>Do you need a professional SEO description (title, benefits and search tags)?</b>",
    },
    "btn_seo_yes": {
        "uz": "✅ Ha, SEO matn kerak",
        "ru": "✅ Да, нужен SEO-текст",
        "en": "✅ Yes, I need SEO copy",
    },
    "btn_seo_no": {
        "uz": "❌ Yo'q, faqat kartochkalar kifoya",
        "ru": "❌ Нет, достаточно карточек",
        "en": "❌ No, the cards are enough",
    },
    "seo_stale": {
        "uz": "Ma'lumotlar eskirgan. Iltimos, yangi mahsulot rasmini yuboring.",
        "ru": "Данные устарели. Пожалуйста, отправьте новое фото товара.",
        "en": "This data is outdated. Please send a new product photo.",
    },
    "seo_header": {
        "uz": "📋 <b>Sizning mahsulotingiz uchun tayyor SEO tavsifi:</b>",
        "ru": "📋 <b>Готовое SEO-описание для вашего товара:</b>",
        "en": "📋 <b>Ready-made SEO description for your product:</b>",
    },
    "seo_footer": {
        "uz": "💡 <i>Nusxalab oling va mahsulot kartochkangizga joylashtiring!</i>",
        "ru": "💡 <i>Скопируйте и вставьте в карточку товара!</i>",
        "en": "💡 <i>Copy it and paste it into your product listing!</i>",
    },
    "seo_sent": {
        "uz": "SEO matn yuborildi!",
        "ru": "SEO-текст отправлен!",
        "en": "SEO copy sent!",
    },
    "seo_declined": {
        "uz": "👌 <b>Tushunarli!</b> Faqat studiya kartochkalari saqlandi.\n\n📸 Keyingi mahsulot rasmini yuborishingiz mumkin!",
        "ru": "👌 <b>Понятно!</b> Сохранены только студийные карточки.\n\n📸 Можете отправить фото следующего товара!",
        "en": "👌 <b>Got it!</b> Only the studio cards were kept.\n\n📸 You can send the next product photo!",
    },
}


def t(lang: Optional[str], key: str, **kwargs) -> str:
    variants = TEXTS[key]
    text = variants.get(normalize_language(lang)) or variants[DEFAULT_LANGUAGE]
    return text.format(**kwargs) if kwargs else text
