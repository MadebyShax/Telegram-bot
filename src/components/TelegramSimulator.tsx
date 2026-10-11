import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Upload,
  Check,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  Copy,
  Layers,
  Image as ImageIcon,
  Eye,
  X,
  FileText,
  Phone,
  Presentation,
  LayoutGrid
} from 'lucide-react';
import { SAMPLE_PRODUCTS, SampleProductItem } from '../data/sampleProducts';
import { TelegramMessage, StudioCard, ProductMetadata } from '../types';
import { PaymentModal } from './PaymentModal';
import { StudioCardViewer } from './StudioCardViewer';
import { TRANSLATIONS, Language } from '../data/translations';

interface TelegramSimulatorProps {
  userCredits: number;
  setUserCredits: React.Dispatch<React.SetStateAction<number>>;
  onOpenMarketplace: (productData: ProductMetadata, cards: StudioCard[]) => void;
  onTransactionLogged: (amountUzs: number, provider: 'CLICK' | 'PAYME') => void;
  onGenerationLogged: (productName: string, cardsCount: number) => void;
  language: Language;
}

export const TelegramSimulator: React.FC<TelegramSimulatorProps> = ({
  userCredits,
  setUserCredits,
  onOpenMarketplace,
  onTransactionLogged,
  onGenerationLogged,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [generationMode, setGenerationMode] = useState<'cards' | 'presentation'>('cards');
  const [seoRequestedMessageIds, setSeoRequestedMessageIds] = useState<Set<string>>(new Set());
  const [seoDeclinedMessageIds, setSeoDeclinedMessageIds] = useState<Set<string>>(new Set());
  const [answeredInfographicsIds, setAnsweredInfographicsIds] = useState<Set<string>>(new Set());

  const [messages, setMessages] = useState<TelegramMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      timestamp: '09:00',
      type: 'text',
      text:
        language === 'ru'
          ? `Здравствуйте! ⚡️ <b>Добро пожаловать в E-Commerce AI Бот!</b>\n<i>Интеграция с Google AI Studio (Gemini)</i>\n\nНикаких сложных промптов писать не нужно:\n📸 <b>Просто отправьте фото товара!</b>\n\nБот через Google AI Studio автоматически:\n1️⃣ Определит категорию, цвет, материал и форму (Gemini Vision)\n2️⃣ Спросит, нужна ли инфографика или чистое фото\n3️⃣ Сгенерирует <b>5 профессиональных карточек товара</b>\n4️⃣ Составит продающее SEO описание (заголовок, преимущества, теги).\n\n🎁 <b>Бонус:</b> Нажмите кнопку ниже и подтвердите номер телефона, чтобы получить <b>+1 бесплатный пакет (5 карточек)</b>!`
          : language === 'en'
          ? `Welcome! ⚡️ <b>Welcome to E-Commerce AI Bot!</b>\n<i>Powered by Google AI Studio (Gemini API)</i>\n\nNo complex prompts required:\n📸 <b>Simply send a raw product photo!</b>\n\nThe bot via Google AI Studio automatically:\n1️⃣ Detects product type, color, material, and shape (Gemini Vision)\n2️⃣ Asks if you need infographics or clean photography\n3️⃣ Generates <b>5 professional e-commerce product cards</b>\n4️⃣ Crafts high-CTR product SEO copy.\n\n🎁 <b>Welcome Bonus:</b> Share your phone number below to get <b>+1 free pack (5 cards)</b>!`
          : `Assalomu alaykum! ⚡️ <b>Zero-Prompt E-Commerce AI Botiga xush kelibsiz!</b>\n<i>Google AI Studio (Gemini) integratsiyasi bilan ishlaydi</i>\n\nSizdan hech qanday murakkab prompt yoki matn talab qilinmaydi:\n📸 <b>Shunchaki mahsulotingiz rasmini yuboring!</b>\n\nBot Google AI Studio orqali avtomatik tarzda:\n1️⃣ Mahsulot turi, rangi, materiali va shaklini aniqlaydi (Gemini Vision)\n2️⃣ Infografika kerakmi yoki toza fotosuratmi — tanlash imkonini beradi\n3️⃣ <b>5 ta professional e-commerce tovar kartochkasi</b> tayyorlaydi\n4️⃣ O'zbek va rus tillarida tayyor SEO tavsif tuzadi.\n\n🎁 <b>Xush kelibsiz bonusi:</b> Pastdagi tugmani bosing va telefon raqamingizni tasdiqlab <b>1 ta bepul paket</b> oling!`,
    },
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCardForView, setSelectedCardForView] = useState<StudioCard | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'CLICK' | 'PAYME'>('CLICK');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleOpenPayment = (provider: 'CLICK' | 'PAYME') => {
    setSelectedProvider(provider);
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (amountUzs: number, provider: 'CLICK' | 'PAYME') => {
    setUserCredits((prev) => prev + 1);
    onTransactionLogged(amountUzs, provider);

    const newMsg: TelegramMessage = {
      id: `tx-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: `✅ <b>To'lov muvaffaqiyatli qabul qilindi!</b>\n\nTo'lov provayderi: <b>${provider}</b>\nSumma: <b>${amountUzs.toLocaleString('uz-UZ')} UZS</b>\nSizning yangi balansingiz: <b>${userCredits + 1} ta paket</b> (${(userCredits + 1) * 5} ta kartochka)\n\n📸 Endi mahsulot rasmini yuboring va 5 ta studiya kartochkasini oling!`,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Step 1: User uploads photo -> Bot asks about infographics
  const processZeroPromptUpload = async (productData: SampleProductItem | { imageUrl: string; name: string; base64?: string }) => {
    if (isProcessing) return;

    // Check credits
    if (userCredits <= 0) {
      const invoiceMsg: TelegramMessage = {
        id: `invoice-prompt-${Date.now()}`,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'invoice',
        text: `⚠️ <b>Balansingizda generatsiya paketlari tugadi.</b>\n\n5 ta professional studiya kartochkasi va to'liq SEO tavsif yaratish uchun hisobingizni to'ldiring:`,
        invoiceData: {
          title: '5 ta AI Studiya Kartochkasi + SEO Paket',
          description: "E-Commerce va online savdo uchun 5 xil studiya foni va o'zbek/rus tillaridagi SEO matni.",
          amountUzs: 15000,
          cardsCount: 5,
          provider: 'CLICK',
        },
      };
      setMessages((prev) => [...prev, invoiceMsg]);
      return;
    }

    // 1. Add User's zero-prompt photo message
    const userMsg: TelegramMessage = {
      id: `user-photo-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'photo',
      imageUrl: productData.imageUrl,
      text: '',
    };

    // 2. Add Bot's Infographics question message
    const askMsg: TelegramMessage = {
      id: `ask-info-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'ask_infographics',
      pendingProductData: productData,
      text: `📸 <b>${language === 'ru' ? 'Фото товара принято!' : language === 'en' ? 'Product photo received!' : 'Mahsulot surati qabul qilindi!'}</b>\n\n📊 <b>${t.askInfographicsTitle}</b>`,
    };

    setMessages((prev) => [...prev, userMsg, askMsg]);
  };

  // Step 2: User responds to Infographics question -> Run generation
  const handleInfographicsChoice = async (askMsg: TelegramMessage, withInfographics: boolean) => {
    if (isProcessing) return;
    const productData = askMsg.pendingProductData;
    if (!productData) return;

    setAnsweredInfographicsIds((prev) => new Set(prev).add(askMsg.id));
    setIsProcessing(true);

    // Add user response message in chat
    const userChoiceMsg: TelegramMessage = {
      id: `user-choice-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: withInfographics ? t.btnInfographicsYes : t.btnInfographicsNo,
    };

    // Add progress message
    const progressMsgId = `progress-${Date.now()}`;
    const initialProgressMsg: TelegramMessage = {
      id: progressMsgId,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'status_progress',
      progressStep: {
        current: 1,
        total: 3,
        title: language === 'ru'
          ? '1/3: Анализ товара (Google AI Studio)...'
          : language === 'en'
          ? '1/3: Product Analysis (Google AI Studio)...'
          : '1/3: Mahsulot tahlil qilinmoqda (Google AI Studio)...',
        subtitle: withInfographics
          ? (language === 'ru' ? 'Выбрана инфографика: анализ преимуществ...' : 'Infografika tanlandi: xususiyatlar va afzalliklar tahlil qilinmoqda...')
          : (language === 'ru' ? 'Выбрано чистое фото: фокус на форме и текстуре...' : 'Toza fotosurat tanlandi: toza studiya foni tayyorlanmoqda...'),
      },
    };

    setMessages((prev) => [...prev, userChoiceMsg, initialProgressMsg]);

    try {
      // Step 1: Call server API for vision analysis
      let metadata: ProductMetadata;
      if ('metadata' in productData) {
        metadata = productData.metadata as ProductMetadata;
      } else {
        try {
          const res = await fetch('/api/analyze-product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: productData.base64 || '',
              productNameHint: productData.name,
            }),
          });
          metadata = await res.json();
        } catch (e) {
          metadata = SAMPLE_PRODUCTS[0].metadata as ProductMetadata;
        }
      }

      await new Promise((r) => setTimeout(r, 800));

      // Step 2 update: Background & Aesthetics
      setMessages((prev) =>
        prev.map((m) =>
          m.id === progressMsgId
            ? {
                ...m,
                progressStep: {
                  current: 2,
                  total: 3,
                  title: language === 'ru'
                    ? '2/3: Подготовка 5 уникальных студийных фонов...'
                    : language === 'en'
                    ? '2/3: Rendering 5 unique studio environments...'
                    : '2/3: 5 xil studiya foni va kompozitsiya tanlanmoqda...',
                  subtitle: `Mahsulot: "${metadata.product_name_uz}". ${withInfographics ? 'Infografika elementlari joylanmoqda...' : 'Toza minimal studiya interyerlari...'}`
                },
              }
            : m
        )
      );

      await new Promise((r) => setTimeout(r, 800));

      // Step 3 update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === progressMsgId
            ? {
                ...m,
                progressStep: {
                  current: 3,
                  total: 3,
                  title:
                    generationMode === 'presentation'
                      ? '3/3: 5 ta taqdimot slaydi tayyorlanmoqda...'
                      : '3/3: 5 xil studiya kartochkalari yaratilmoqda...',
                  subtitle:
                    generationMode === 'presentation'
                      ? 'Vizual Pitch Deck slaydlari (16:9) avtomatik sintezlanmoqda...'
                      : 'Google AI Studio orqali 5 ta professional e-commerce kartochkasi yakunlanmoqda...',
                },
              }
            : m
        )
      );

      await new Promise((r) => setTimeout(r, 900));

      // Step 4: Final delivery of 5 Cards (ZERO marketplace brand names!)
      let cards: StudioCard[];
      if (generationMode === 'presentation') {
        const baseImg = 'studioCards' in productData ? productData.studioCards[0].imageUrl : SAMPLE_PRODUCTS[0].studioCards[0].imageUrl;
        cards = [
          {
            id: `slide-1-${Date.now()}`,
            index: 1,
            styleName: '1. Titul va Brend Qopqog\'i (Cover)',
            badge: withInfographics ? 'SLIDE 1 · COVER' : '',
            imageUrl: baseImg,
            aspectRatio: '16:9',
            description: `Titul slaydi: ${metadata.product_name_uz}`
          },
          {
            id: `slide-2-${Date.now()}`,
            index: 2,
            styleName: '2. Mijoz Uchun Muammo va Yechim',
            badge: withInfographics ? 'SLIDE 2 · VALUE' : '',
            imageUrl: 'studioCards' in productData ? productData.studioCards[1].imageUrl : SAMPLE_PRODUCTS[0].studioCards[1].imageUrl,
            aspectRatio: '16:9',
            description: 'Afzalliklar va mijoz ehtiyojini qondiruvchi asosiy omillar.'
          },
          {
            id: `slide-3-${Date.now()}`,
            index: 3,
            styleName: '3. Texnik Xususiyatlar va Materiallar',
            badge: withInfographics ? 'SLIDE 3 · SPECS' : '',
            imageUrl: 'studioCards' in productData ? productData.studioCards[2].imageUrl : SAMPLE_PRODUCTS[0].studioCards[2].imageUrl,
            aspectRatio: '16:9',
            description: 'Xususiyatlar: o\'lchamlar, material tarkibi va ishlab chiqarish standarti.'
          },
          {
            id: `slide-4-${Date.now()}`,
            index: 4,
            styleName: '4. Iqtisodiyot va Narx Tahlili',
            badge: withInfographics ? 'SLIDE 4 · PRICE' : '',
            imageUrl: 'studioCards' in productData ? productData.studioCards[3].imageUrl : SAMPLE_PRODUCTS[0].studioCards[3].imageUrl,
            aspectRatio: '16:9',
            description: 'Bozor narxi va daromad marjasi tahlili.'
          },
          {
            id: `slide-5-${Date.now()}`,
            index: 5,
            styleName: '5. Buyurtma va Yetkazib Berish',
            badge: withInfographics ? 'SLIDE 5 · CTA' : '',
            imageUrl: 'studioCards' in productData ? productData.studioCards[4].imageUrl : SAMPLE_PRODUCTS[0].studioCards[4].imageUrl,
            aspectRatio: '16:9',
            description: 'Ta\'minot shartlari va tezkor yetkazib berish kafolati.'
          }
        ];
      } else {
        // Pool of 12+ aesthetic themes with product feature badges (STRICTLY NO MARKETPLACE BRAND NAMES!)
        const STYLE_VARIATIONS = [
          { name: "Minimalist Travertin Tosh Poydevor (Hero)", badge: "TOP SIFAT", desc: "Yumshoq ertalabki quyosh nuri, tabiiy travertin g'ovak tosh poydevor." },
          { name: "Skandinav Shinam Yog'och Dasturxon", badge: "100% KAFOLAT", desc: "Tabiiy eman yuzasi, zig'ir mato va iliq xonadon nuri." },
          { name: "Obsidian Qorong'u Lyuks Vitrina", badge: "PREMIUM SIFAT", desc: "Qora yaltiroq obsidian marmar, moviy rim-yorug'lik va neon kontur." },
          { name: "Zamonaviy Pastel Maydoni", badge: "ORIGINAL", desc: "Silliq pista pastel poydevor, toza fon." },
          { name: "Makro Tekstura va Sifat Fokusi", badge: "MAXSUS DETALLAR", desc: "Material to'qimasi, nozik qirralar va mahsulot sifati fokusi." },
          { name: "Sahroyi Oltin Qum & Quyosh Nuri", badge: "TABIIY TARKIB", desc: "Golden Hour oltin nurlari va to'lqinli mayin qum." },
          { name: "Industrial Beton & Metall Loft", badge: "ZAMONAVIY USLUB", desc: "Silliqlangan kulrang beton va minimalist zamonaviy karkas." },
          { name: "Suzuvchi Geometrik Podestlar", badge: "YANGI TREND", desc: "Havoda suzuvchi podiumlar, dinamik izometrik e-commerce rakurs." },
          { name: "Organik Botanika va Yashillik", badge: "EKOLOGIK TOZA", desc: "Yashil mox, tabiiy barglar va shaffof shudring tomchilari." },
          { name: "Glossy Suv Sathi & Shudring", badge: "ENG SOTILGAN", desc: "Toza suv to'lqini va akslanish, tetiklantiruvchi yorqin fon." },
          { name: "Ipak Mato va Nafis Draperiya", badge: "ORIGINAL", desc: "Krem rangli yengil ipak to'lqinlari va mayin studiya soyalari." },
          { name: "Neo-Kiber Studiya Vitrinasi", badge: "XIT TOVAR", desc: "Futuristik kontrast va professional vitrina estetikasi." }
        ];

        // Shuffle styles so every generation is fresh and varied
        const shuffled = [...STYLE_VARIATIONS].sort(() => Math.random() - 0.5).slice(0, 5);

        const availableImages = 'studioCards' in productData
          ? (productData.studioCards as StudioCard[]).map((c) => c.imageUrl)
          : [
              productData.imageUrl,
              productData.imageUrl,
              productData.imageUrl,
              productData.imageUrl,
              productData.imageUrl
            ];

        cards = shuffled.map((style, idx) => ({
          id: `card-${Date.now()}-${idx + 1}-${Math.floor(Math.random() * 1000)}`,
          index: idx + 1,
          styleName: style.name,
          badge: withInfographics ? style.badge : '', // NO badge if infographics declined
          imageUrl: availableImages[idx % availableImages.length],
          aspectRatio: '3:4',
          description: style.desc,
        }));
      }

      // Remove progress message and append media group
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== progressMsgId);
        const mediaGroupMsg: TelegramMessage = {
          id: `media-group-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'media_group',
          mediaGroup: cards,
          productMetadata: metadata,
          withInfographics: withInfographics,
        };
        return [...filtered, mediaGroupMsg];
      });

      // Deduct credit
      setUserCredits((prev) => Math.max(0, prev - 1));
      onGenerationLogged(metadata.product_name_uz, 5);
    } catch (error) {
      console.error('Error generating cards:', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === progressMsgId
            ? {
                ...m,
                type: 'text',
                text: '❌ Xatolik yuz berdi. Iltimos qaytadan urinib ko\'ring.',
              }
            : m
        )
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Custom user image upload from local machine
  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      processZeroPromptUpload({
        name: file.name.replace(/\.[^/.]+$/, ''),
        imageUrl: base64,
        base64: base64.split(',')[1],
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSharePhoneBonus = () => {
    if (isPhoneVerified) return;
    setIsPhoneVerified(true);
    setUserCredits((prev) => prev + 1);

    const bonusMsg: TelegramMessage = {
      id: `phone-bonus-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text:
        language === 'ru'
          ? `🎉 <b>Номер успешно подтвержден!</b>\n\nВам начислен <b>+1 бесплатный бонусный пакет</b> (5 студийных карточек + SEO)!\nВаш баланс: <b>${userCredits + 1} пакетов</b>.\n\n📸 Отправьте фото товара, чтобы начать!`
          : language === 'en'
          ? `🎉 <b>Phone number successfully verified!</b>\n\nYou received <b>+1 free bonus package</b> (5 studio cards + SEO)!\nYour balance: <b>${userCredits + 1} packages</b>.\n\n📸 Send a product photo to get started!`
          : `🎉 <b>Telefon raqamingiz muvaffaqiyatli tasdiqlandi!</b>\n\nSizga <b>+1 ta bepul bonus paket</b> (5 ta studiya kartochkasi + SEO) berildi!\nSizning yangi balansingiz: <b>${userCredits + 1} ta paket</b>.\n\n📸 Endi mahsulot rasmini yuboring va natijani ko'ring!`,
    };
    setMessages((prev) => [...prev, bonusMsg]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] max-w-4xl mx-auto bg-[#0e1621] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* Telegram Chat Header */}
      <div className="bg-[#17212b] px-4 py-3 flex items-center justify-between border-b border-slate-800/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white font-black text-sm shadow">
              AI
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#17212b]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-white text-sm sm:text-base leading-tight">
                EcommerceAICardBot
              </h2>
              <span className="bg-indigo-900/60 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-indigo-700/50">
                Google AI Studio
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <span>bot</span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">onlayn</span>
              <span>•</span>
              <span className="text-slate-300 font-medium">
                {userCredits} {t.packages} ({userCredits * 5} {t.cards})
              </span>
            </p>
          </div>
        </div>

        {/* Top Up / Engine Selector */}
        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-700/60 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setGenerationMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                generationMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Google AI Studio 5 xil kartochka generatsiyasi"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>5 Kartochka</span>
            </button>
            <button
              onClick={() => setGenerationMode('presentation')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                generationMode === 'presentation'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="5 ta Vizual Taqdimot Slaydi"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span>Pitch Deck</span>
            </button>
          </div>

          <button
            onClick={() => handleOpenPayment('CLICK')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3 py-1.5 rounded-xl shadow transition-all active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t.topUp}</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0e1621] scrollbar-thin scrollbar-thumb-slate-700">
        {/* Welcome Bonus Callout if not verified */}
        {!isPhoneVerified && (
          <div className="p-3 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-violet-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-amber-200">
                  {language === 'ru'
                    ? 'Бонус для новых пользователей!'
                    : language === 'en'
                    ? 'New User Welcome Bonus!'
                    : 'Yangi foydalanuvchilar uchun bepul bonus!'}
                </p>
                <p className="text-slate-300">
                  {language === 'ru'
                    ? 'Поделитесь номером телефона и получите +1 пакет (5 карточек) бесплатно.'
                    : language === 'en'
                    ? 'Share your phone number and get +1 free package (5 cards).'
                    : 'Telefon raqamingizni tasdiqlang va 1 ta bepul paket (5 ta studiya kartochkasi) oling.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSharePhoneBonus}
              className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg shadow transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              <span>{t.phoneBonusButton}</span>
            </button>
          </div>
        )}

        <div className="space-y-4 flex-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
            >
              {/* Message Bubble */}
              <div
                className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : 'bg-[#182234] border border-slate-700/60 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Text content with HTML formatting */}
                {msg.text && (
                  <div
                    className="text-xs sm:text-sm leading-relaxed whitespace-pre-line"
                    dangerouslySetInnerHTML={{ __html: msg.text }}
                  />
                )}

                {/* User's uploaded Photo */}
                {msg.type === 'photo' && msg.imageUrl && (
                  <div className="space-y-2">
                    <div className="rounded-xl overflow-hidden max-w-sm aspect-[4/3] bg-black/40 border border-white/10">
                      <img
                        src={msg.imageUrl}
                        alt="Product upload"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-[11px] text-indigo-100 flex items-center justify-between">
                      <span>📸 Mahsulot rasmi yuborildi (Zero-Prompt)</span>
                      <span className="font-mono">{msg.timestamp}</span>
                    </div>
                  </div>
                )}

                {/* Interactive Infographics Question Bubble */}
                {msg.type === 'ask_infographics' && (
                  <div className="space-y-3 py-1 min-w-[280px]">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.askInfographicsSubtitle}
                    </p>
                    {!answeredInfographicsIds.has(msg.id) ? (
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <button
                          onClick={() => handleInfographicsChoice(msg, true)}
                          disabled={isProcessing}
                          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                          <span>{t.btnInfographicsYes}</span>
                        </button>
                        <button
                          onClick={() => handleInfographicsChoice(msg, false)}
                          disabled={isProcessing}
                          className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow active:scale-95 disabled:opacity-50"
                        >
                          <span>{t.btnInfographicsNo}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 pt-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Tanlov qabul qilindi va generatsiya boshlandi</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Progress Bubble */}
                {msg.type === 'status_progress' && msg.progressStep && (
                  <div className="space-y-3 py-1 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
                      <div className="text-xs font-bold text-white">
                        {msg.progressStep.title}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 pl-6">
                      {msg.progressStep.subtitle}
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full transition-all duration-500 ease-out"
                        style={{
                          width: `${(msg.progressStep.current / msg.progressStep.total) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Media Group (5 Cards Delivery) */}
                {msg.type === 'media_group' && msg.mediaGroup && msg.productMetadata && (
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                        <span className="text-xs font-bold text-white">
                          5 ta AI Studiya Kartochkasi Tayyor!
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {t.ratioUzum}
                      </span>
                    </div>

                    {/* 5 Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {msg.mediaGroup.map((card) => (
                        <div
                          key={card.id}
                          onClick={() => setSelectedCardForView(card)}
                          className="group relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-700 bg-slate-900 cursor-pointer hover:border-indigo-500 transition-all shadow-md"
                        >
                          <img
                            src={card.imageUrl}
                            alt={card.styleName}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {/* Badge Overlay (Only if card has badge and infographics was included) */}
                          {card.badge && (
                            <div className="absolute top-1.5 left-1.5 bg-violet-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                              {card.badge}
                            </div>
                          )}
                          {/* Style Name on Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-1.5">
                            <span className="text-[10px] font-bold text-white leading-tight">
                              {card.styleName}
                            </span>
                            <span className="text-[9px] text-indigo-300 flex items-center gap-0.5 mt-0.5">
                              <Eye className="w-2.5 h-2.5" /> Kattalashtirish
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Step: Ask if SEO text is needed or not before displaying (NO MARKETPLACE BRAND NAMES!) */}
                    {!seoRequestedMessageIds.has(msg.id) && !seoDeclinedMessageIds.has(msg.id) && (
                      <div className="rounded-xl bg-slate-900 border border-indigo-500/30 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>{t.seoPromptQuestion}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSeoRequestedMessageIds((prev) => new Set(prev).add(msg.id))}
                            className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{t.btnSeoYes}</span>
                          </button>
                          <button
                            onClick={() => setSeoDeclinedMessageIds((prev) => new Set(prev).add(msg.id))}
                            className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>{t.btnSeoNo}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* If declined: Show friendly acknowledgment with re-open toggle */}
                    {seoDeclinedMessageIds.has(msg.id) && (
                      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-xs text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span>👌</span>
                          <span>{t.seoAcknowledgedDeclined}</span>
                        </span>
                        <button
                          onClick={() => {
                            setSeoDeclinedMessageIds((prev) => {
                              const next = new Set(prev);
                              next.delete(msg.id);
                              return next;
                            });
                            setSeoRequestedMessageIds((prev) => new Set(prev).add(msg.id));
                          }}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium"
                        >
                          {t.seoShowButton}
                        </button>
                      </div>
                    )}

                    {/* Formatted SEO Content (Only shown if user confirmed) (ZERO MARKETPLACE BRAND NAMES!) */}
                    {seoRequestedMessageIds.has(msg.id) && (
                      <div className="rounded-xl bg-slate-900/90 border border-slate-700/70 p-4 space-y-4 text-xs">
                        {/* Uzbek Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                              🇺🇿 O'zbek tilida (Sarlavha va qidiruv teglari)
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `${msg.productMetadata?.uzum_title_uz}\n\n` +
                                    msg.productMetadata?.bullet_points_uz.join('\n') +
                                    `\n\n` +
                                    msg.productMetadata?.seo_tags_uz.join(' '),
                                  'seo-uz'
                                )
                              }
                              className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedKey === 'seo-uz' ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              {copiedKey === 'seo-uz' ? t.copied : t.copyAll}
                            </button>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200">
                            <span className="text-[11px] text-slate-400 block font-medium mb-1">
                              SEO Sarlavha:
                            </span>
                            <p className="font-medium text-slate-100">{msg.productMetadata.uzum_title_uz}</p>
                          </div>

                          <div className="space-y-1 text-slate-300">
                            <span className="text-[11px] text-slate-400 font-medium block">
                              Afzalliklari (Bullet points):
                            </span>
                            {msg.productMetadata.bullet_points_uz.map((bullet, idx) => (
                              <div key={idx} className="leading-snug">
                                {bullet}
                              </div>
                            ))}
                          </div>

                          <div className="text-[11px] text-slate-400">
                            <span className="font-medium text-slate-300">Qidiruv teglari: </span>
                            {msg.productMetadata.seo_tags_uz.join(' ')}
                          </div>
                        </div>

                        <div className="border-t border-slate-800 pt-3 space-y-2">
                          {/* Russian Section */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-violet-400 flex items-center gap-1.5">
                              🇷🇺 На русском языке (Заголовок и теги)
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `${msg.productMetadata?.uzum_title_ru}\n\n` +
                                    msg.productMetadata?.bullet_points_ru.join('\n') +
                                    `\n\n` +
                                    msg.productMetadata?.seo_tags_ru.join(' '),
                                  'seo-ru'
                                )
                              }
                              className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedKey === 'seo-ru' ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              {copiedKey === 'seo-ru' ? t.copied : t.copyAll}
                            </button>
                          </div>

                          <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-200">
                            <span className="text-[11px] text-slate-400 block font-medium mb-1">
                              Название для карточки:
                            </span>
                            <p className="font-medium text-slate-100">{msg.productMetadata.uzum_title_ru}</p>
                          </div>

                          <div className="space-y-1 text-slate-300">
                            {msg.productMetadata.bullet_points_ru.map((bullet, idx) => (
                              <div key={idx} className="leading-snug">
                                {bullet}
                              </div>
                            ))}
                          </div>

                          <div className="text-[11px] text-slate-400">
                            <span className="font-medium text-slate-300">Теги: </span>
                            {msg.productMetadata.seo_tags_ru.join(' ')}
                          </div>
                        </div>

                        {/* Interactive Button to switch to Showcase */}
                        <div className="pt-2 flex flex-wrap gap-2">
                          <button
                            onClick={() => onOpenMarketplace(msg.productMetadata!, msg.mediaGroup!)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                          >
                            <span>{t.viewInMarketplace}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Native Telegram Invoice Message */}
                {msg.type === 'invoice' && msg.invoiceData && (
                  <div className="space-y-3 pt-2">
                    <div className="rounded-xl bg-slate-900 border border-slate-700/80 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm">
                          {msg.invoiceData.title}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {msg.invoiceData.amountUzs.toLocaleString('uz-UZ')} UZS
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {msg.invoiceData.description}
                      </p>

                      <div className="pt-1 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleOpenPayment('CLICK')}
                          className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                        >
                          <span>🔵 Click (15,000 UZS)</span>
                        </button>
                        <button
                          onClick={() => handleOpenPayment('PAYME')}
                          className="flex-1 py-2 px-3 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                        >
                          <span>🟢 Payme (15,000 UZS)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Zero-Prompt Sample Bar */}
      <div className="bg-[#17212b] border-t border-slate-800/80 p-3 shrink-0">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>{t.zeroPromptTest}</span>
            <span className="text-slate-400 font-normal hidden sm:inline">
              {t.zeroPromptDesc}
            </span>
          </span>

          <label className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 px-2.5 py-1 rounded-lg transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>{t.uploadCustom}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCustomFileUpload}
              ref={fileInputRef}
            />
          </label>
        </div>

        {/* 3 Quick Zero-Prompt Product Badges */}
        <div className="grid grid-cols-3 gap-2">
          {SAMPLE_PRODUCTS.map((prod) => (
            <button
              key={prod.id}
              onClick={() => processZeroPromptUpload(prod)}
              disabled={isProcessing}
              className="group flex items-center gap-2 p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/60 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img
                src={prod.imageUrl}
                alt={prod.name}
                referrerPolicy="no-referrer"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg object-cover shrink-0 border border-slate-700"
              />
              <div className="overflow-hidden min-w-0">
                <span className="block text-[11px] sm:text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                  {prod.name}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-slate-400 truncate">
                  {prod.tag}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Telegram Input Bar */}
      <div className="bg-[#17212b] px-4 py-3 border-t border-slate-800 flex items-center gap-3 shrink-0">
        <label className="cursor-pointer text-slate-400 hover:text-indigo-400 p-2 hover:bg-slate-800 rounded-full transition-colors">
          <ImageIcon className="w-5 h-5" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCustomFileUpload}
          />
        </label>

        <div className="flex-1 bg-[#242f3d] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-300 flex items-center justify-between border border-transparent focus-within:border-indigo-500">
          <span className="text-slate-400 italic truncate select-none">
            {t.sendPrompt}
          </span>
          <span className="text-[10px] bg-indigo-900/80 text-indigo-300 font-mono px-2 py-0.5 rounded-md shrink-0 ml-2">
            AI Studio Vision
          </span>
        </div>

        <button
          onClick={() => processZeroPromptUpload(SAMPLE_PRODUCTS[0])}
          disabled={isProcessing}
          className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all active:scale-95 disabled:opacity-50"
          title="Sinov rasmini yuborish"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Studio Card Full View Modal */}
      {selectedCardForView && (
        <StudioCardViewer
          card={selectedCardForView}
          onClose={() => setSelectedCardForView(null)}
        />
      )}

      {/* Payment Gateway Modal (Click & Payme) */}
      <PaymentModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        provider={selectedProvider}
        amountUzs={15000}
        cardsCount={5}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
