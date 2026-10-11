import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Image as ImageIcon,
  Check,
  Copy,
  CreditCard,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Layers,
  ArrowRight,
  RefreshCw,
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

  const [messages, setMessages] = useState<TelegramMessage[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      timestamp: '09:00',
      type: 'text',
      text:
        language === 'ru'
          ? `Здравствуйте! ⚡️ <b>Добро пожаловать в E-Commerce AI Бот!</b>\n<i>Интеграция с Google AI Studio (Gemini)</i>\n\nНикаких сложных промптов писать не нужно:\n📸 <b>Просто отправьте фото товара!</b>\n\nБот через Google AI Studio автоматически:\n1️⃣ Определит категорию, цвет, материал и форму (Gemini Vision)\n2️⃣ Удалит фон и сгенерирует <b>5 профессиональных карточек товара</b> для маркетплейсов\n3️⃣ Составит продающее SEO описание для Uzum Market и Wildberries.\n\n🎁 <b>Бонус:</b> Нажмите кнопку ниже и подтвердите номер телефона, чтобы получить <b>+1 бесплатный пакет (5 карточек)</b>!`
          : language === 'en'
          ? `Welcome! ⚡️ <b>Welcome to E-Commerce AI Bot!</b>\n<i>Powered by Google AI Studio (Gemini API)</i>\n\nNo complex prompts required:\n📸 <b>Simply send a raw product photo!</b>\n\nThe bot via Google AI Studio automatically:\n1️⃣ Detects product type, color, material, and shape (Gemini Vision)\n2️⃣ Removes background & generates <b>5 professional e-commerce product cards</b>\n3️⃣ Crafts high-CTR marketplace SEO copy for Uzum & Wildberries.\n\n🎁 <b>Welcome Bonus:</b> Share your phone number below to get <b>+1 free pack (5 cards)</b>!`
          : `Assalomu alaykum! ⚡️ <b>Zero-Prompt E-Commerce AI Botiga xush kelibsiz!</b>\n<i>Google AI Studio (Gemini) integratsiyasi bilan ishlaydi</i>\n\nSizdan hech qanday murakkab prompt yoki matn talab qilinmaydi:\n📸 <b>Shunchaki mahsulotingiz rasmini yuboring!</b>\n\nBot Google AI Studio orqali avtomatik tarzda:\n1️⃣ Mahsulot turi, rangi, materiali va shaklini aniqlaydi (Gemini Vision)\n2️⃣ Fonni tozalab, <b>5 ta professional e-commerce tovar kartochkasi</b> tayyorlaydi\n3️⃣ <b>Uzum va Wildberries</b> uchun o'zbek va rus tillarida tayyor SEO tavsif tuzadi.\n\n🎁 <b>Xush kelibsiz bonusi:</b> Pastdagi tugmani bosing va telefon raqamingizni tasdiqlab <b>1 ta bepul paket</b> oling!`,
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
    setUserCredits((prev) => prev + 1); // Adds 1 package (5 cards)
    onTransactionLogged(amountUzs, provider);

    // Append successful payment message
    const newMsg: TelegramMessage = {
      id: `tx-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: `✅ <b>To'lov muvaffaqiyatli qabul qilindi!</b>\n\nTo'lov provayderi: <b>${provider}</b>\nSumma: <b>${amountUzs.toLocaleString('uz-UZ')} UZS</b>\nSizning yangi balansingiz: <b>${userCredits + 1} ta paket</b> (${(userCredits + 1) * 5} ta kartochka)\n\n📸 Endi mahsulot rasmini yuboring va 5 ta studiya kartochkasini oling!`,
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  // Zero-Prompt submission handler (from sample or custom image)
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
          description: 'Uzum va Wildberries uchun 5 xil studiya foni va o\'zbek/rus tillaridagi SEO matni.',
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
      text: '', // ZERO PROMPT! No text entered!
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsProcessing(true);

    // 2. Add progress message
    const progressMsgId = `progress-${Date.now()}`;
    const initialProgressMsg: TelegramMessage = {
      id: progressMsgId,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'status_progress',
      progressStep: {
        current: 1,
        total: 3,
        title: '1/3: Mahsulot tahlil qilinmoqda (Vision AI)...',
        subtitle: 'GPT-4o Vision mahsulot turi, ranglari, materiali va shaklini aniqlamoqda...',
      },
    };
    setMessages((prev) => [...prev, initialProgressMsg]);

    try {
      // Step 1: Call server API for vision analysis
      let metadata: ProductMetadata;
      if ('metadata' in productData) {
        metadata = productData.metadata as ProductMetadata;
      } else {
        // Custom upload: call server endpoint
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

      await new Promise((r) => setTimeout(r, 900));

      // Step 2 update
      setMessages((prev) =>
        prev.map((m) =>
          m.id === progressMsgId
            ? {
                ...m,
                progressStep: {
                  current: 2,
                  total: 3,
                  title: '2/3: SEO matn tayyorlanmoqda...',
                  subtitle: `Mahsulot: "${metadata.product_name_uz}". Uzum va Wildberries uchun matnlar tuzilmoqda...`,
                },
              }
            : m
        )
      );

      await new Promise((r) => setTimeout(r, 900));

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
                      ? '3/3: NotebookLM uslubida 5 ta taqdimot slaydi tayyorlanmoqda...'
                      : '3/3: 5 xil studiya kartochkalari yaratilmoqda...',
                  subtitle:
                    generationMode === 'presentation'
                      ? 'Vizual Pitch Deck slaydlari (16:9) avtomatik sintezlanmoqda...'
                      : 'Flux AI fonni tozalab, 5 ta professional e-commerce interyeriga joylashtirmoqda...',
                },
              }
            : m
        )
      );

      await new Promise((r) => setTimeout(r, 1100));

      // Step 4: Final delivery!
      let cards: StudioCard[];
      if (generationMode === 'presentation') {
        const baseImg = 'studioCards' in productData ? productData.studioCards[0].imageUrl : SAMPLE_PRODUCTS[0].studioCards[0].imageUrl;
        cards = [
          {
            id: `slide-1-${Date.now()}`,
            index: 1,
            styleName: '1. Titul va Brend Qopqog\'i (Cover)',
            badge: 'SLIDE 1 · COVER',
            imageUrl: baseImg,
            aspectRatio: '16:9',
            description: `Titul slaydi: ${metadata.product_name_uz} — Uzum va Wildberries uchun to'liq taqdimot.`
          },
          {
            id: `slide-2-${Date.now()}`,
            index: 2,
            styleName: '2. Mijoz Uchun Muammo va Yechim',
            badge: 'SLIDE 2 · VALUE PROP',
            imageUrl: 'studioCards' in productData ? productData.studioCards[1].imageUrl : SAMPLE_PRODUCTS[0].studioCards[1].imageUrl,
            aspectRatio: '16:9',
            description: 'Afzalliklar va mijoz ehtiyojini qondiruvchi asosiy omillar.'
          },
          {
            id: `slide-3-${Date.now()}`,
            index: 3,
            styleName: '3. Texnik Xususiyatlar va Materiallar',
            badge: 'SLIDE 3 · SPECS',
            imageUrl: 'studioCards' in productData ? productData.studioCards[2].imageUrl : SAMPLE_PRODUCTS[0].studioCards[2].imageUrl,
            aspectRatio: '16:9',
            description: 'Xususiyatlar: o\'lchamlar, material tarkibi va ishlab chiqarish standarti.'
          },
          {
            id: `slide-4-${Date.now()}`,
            index: 4,
            styleName: '4. Bozor Iqtisodiyoti va Marja Tahlili',
            badge: 'SLIDE 4 · ECONOMICS',
            imageUrl: 'studioCards' in productData ? productData.studioCards[3].imageUrl : SAMPLE_PRODUCTS[0].studioCards[3].imageUrl,
            aspectRatio: '16:9',
            description: 'Bozor narxi, Uzum Nasiya to\'lovlari va daromad marjasi tahlili.'
          },
          {
            id: `slide-5-${Date.now()}`,
            index: 5,
            styleName: '5. Ulgurji Buyurtma va Yetkazib Berish',
            badge: 'SLIDE 5 · CTA',
            imageUrl: 'studioCards' in productData ? productData.studioCards[4].imageUrl : SAMPLE_PRODUCTS[0].studioCards[4].imageUrl,
            aspectRatio: '16:9',
            description: 'B2B ta\'minot shartlari va 1 kunda yetkazib berish kafolati.'
          }
        ];
      } else {
        const STYLE_VARIATIONS = [
          { name: "Minimalist Travertin Tosh Poydevor (Hero)", badge: "UZUM TOP SOTUV", desc: "Yumshoq ertalabki quyosh nuri, tabiiy travertin g'ovak tosh poydevor." },
          { name: "Skandinav Shinam Yog'och Dasturxon", badge: "100% KAFOLAT", desc: "Tabiiy eman yuzasi, zig'ir mato va iliq xonadon nuri." },
          { name: "Obsidian Qorong'u Lyuks Vitrina", badge: "PREMIUM SIFAT", desc: "Qora yaltiroq obsidian marmar, moviy rim-yorug'lik va neon kontur." },
          { name: "Zamonaviy Pastel Infografika Maydoni", badge: "1 KUNDA YETKAZISH", desc: "Silliq pista pastel poydevor, infografika matnlari uchun toza fon." },
          { name: "Makro Tekstura va Sifat Fokusi", badge: "TOP SIFAT", desc: "Material to'qimasi, nozik qirralar va mahsulot sifati fokusi." },
          { name: "Sahroyi Oltin Qum & Quyosh Nuri", badge: "TABIIY MAHSULOT", desc: "Golden Hour oltin nurlari va to'lqinli mayin qum." },
          { name: "Industrial Beton & Metall Loft", badge: "ZAMONAVIY USLUB", desc: "Silliqlangan kulrang beton va minimalist zamonaviy karkas." },
          { name: "Suzuvchi Geometrik Podestlar", badge: "YANGI TREND", desc: "Havoda suzuvchi podiumlar, dinamik izometrik e-commerce rakurs." },
          { name: "Organik Botanika va Yashillik", badge: "EKOLOGIK TOZA", desc: "Yashil mox, tabiiy barglar va shaffof shudring tomchilari." },
          { name: "Glossy Suv Sathi & Shudring", badge: "ENG SOTILGAN", desc: "Toza suv to'lqini va akslanish, tetiklantiruvchi yorqin fon." },
          { name: "Ipak Mato va Nafis Draperiya", badge: "ORIGINAL", desc: "Krem rangli yengil ipak to'lqinlari va mayin studiya soyalari." },
          { name: "Neo-Kiber Studiya Vitrinasi", badge: "XIT MAHSULOT", desc: "Futuristik kontrast va professional vitrina estetikasi." }
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
          badge: style.badge,
          imageUrl: availableImages[idx % availableImages.length],
          aspectRatio: '3:4',
          description: style.desc,
        }));
      }

      // Remove progress message and append media group + SEO text
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== progressMsgId);
        const mediaGroupMsg: TelegramMessage = {
          id: `media-group-${Date.now()}`,
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'media_group',
          mediaGroup: cards,
          productMetadata: metadata,
        };
        return [...filtered, mediaGroupMsg];
      });

      // Deduct credit
      setUserCredits((prev) => Math.max(0, prev - 1));
      onGenerationLogged(metadata.product_name_uz, 5);
    } catch (err) {
      console.error('Error during zero-prompt processing:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSharePhoneContact = () => {
    if (isPhoneVerified) return;
    setIsPhoneVerified(true);
    setUserCredits((prev) => prev + 1);

    const userContactMsg: TelegramMessage = {
      id: `contact-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text: `📱 <b>+998 90 849 20 19</b>\n<i>(${
        language === 'ru'
          ? 'Контакт Telegram отправлен'
          : language === 'en'
          ? 'Telegram Contact Shared'
          : 'Telegram Kontakt ulashildi'
      })</i>`,
    };

    const botBonusMsg: TelegramMessage = {
      id: `bonus-${Date.now()}`,
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text',
      text:
        language === 'ru'
          ? `🎉 <b>Поздравляем! Ваш номер успешно подтвержден.</b>\n\n🎁 <b>Бонус:</b> <b>+1 бесплатный пакет (5 карточек + SEO)</b> зачислен на ваш баланс!\n\n📸 Теперь выберите любой пример ниже или отправьте фото вашего товара!`
          : language === 'en'
          ? `🎉 <b>Congratulations! Phone number verified.</b>\n\n🎁 <b>Bonus:</b> <b>+1 Free Package (5 studio cards + SEO)</b> added to your account!\n\n📸 Now select a sample below or upload your product photo!`
          : `🎉 <b>Tabriklaymiz! Telefon raqamingiz muvaffaqiyatli tasdiqlandi.</b>\n\n🎁 <b>Xush kelibsiz bonusi:</b> <b>+1 ta bepul paket (5 ta studiya kartochkasi + SEO)</b> hisobingizga qo'shildi!\n\n📸 Endi quyidagi namunalardan birini bosing yoki o'z mahsulot rasmingizni yuboring!`,
    };

    setMessages((prev) => [...prev, userContactMsg, botBonusMsg]);
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      processZeroPromptUpload({
        imageUrl: dataUrl,
        name: file.name.replace(/\.[^/.]+$/, ''),
        base64: dataUrl,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-[#0b0f17]">
      {/* Sample Products & Mode Picker Bar */}
      <div className="bg-[#111827] border-b border-slate-800 px-6 py-2.5 shrink-0">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Mode Switcher (Uzum Cards 3:4 vs NotebookLM Presentation Slides 16:9) */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400">{t.modeSelector}</span>
            <div className="flex bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setGenerationMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  generationMode === 'cards'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t.modeCards}</span>
              </button>
              <button
                onClick={() => setGenerationMode('presentation')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                  generationMode === 'presentation'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>{t.modePresentation}</span>
              </button>
            </div>
          </div>

          {/* Sample Products & Upload */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {SAMPLE_PRODUCTS.map((prod) => (
              <button
                key={prod.id}
                onClick={() => processZeroPromptUpload(prod)}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700/80 text-xs font-medium text-slate-200 hover:text-white transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <img
                  src={prod.imageUrl}
                  alt={prod.name}
                  referrerPolicy="no-referrer"
                  className="w-4 h-4 rounded object-cover"
                />
                <span>{prod.name}</span>
              </button>
            ))}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-xs font-semibold text-indigo-300 hover:text-indigo-200 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{t.uploadCustom}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCustomFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Main Telegram Chat Frame */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
        {/* Telegram Chat Header Banner */}
        <div className="flex items-center justify-between bg-[#151d2f] border border-slate-800 rounded-xl px-4 py-3 shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              AI
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-white">EcommerceAICardBot</span>
                <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded">
                  BOT
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Uzum & Wildberries</span>
                <span className="text-slate-600">·</span>
                <span className="text-indigo-400 font-semibold">Google AI Studio</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-400">Balans:</div>
              <div className="text-xs font-bold font-mono text-emerald-400">
                {userCredits} ta paket ({userCredits * 5} kartochka)
              </div>
            </div>
            <button
              onClick={() => handleOpenPayment('CLICK')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-xs font-semibold text-emerald-300 transition-colors"
            >
              + To'ldirish
            </button>
          </div>
        </div>

        {/* Message Stream */}
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
                      <span>📸 Xom mahsulot rasmi yuborildi (Zero-Prompt)</span>
                      <span className="font-mono">{msg.timestamp}</span>
                    </div>
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
                        3:4 Uzum Nisbati
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
                          {/* Badge Overlay */}
                          <div className="absolute top-1.5 left-1.5 bg-violet-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                            {card.badge}
                          </div>
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

                    {/* Step: Ask if SEO text is needed or not before displaying */}
                    {!seoRequestedMessageIds.has(msg.id) && !seoDeclinedMessageIds.has(msg.id) && (
                      <div className="rounded-xl bg-slate-900 border border-indigo-500/30 p-4 space-y-3">
                        <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs">
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span>
                            {language === 'ru'
                              ? '📝 Отправить SEO описание (заголовок, буллет-поинты, теги) для Uzum и Wildberries?'
                              : language === 'en'
                              ? '📝 Do you need marketplace SEO copy (titles, bullet points, tags) for Uzum & Wildberries?'
                              : "📝 Uzum Market va Wildberries uchun SEO matn (sarlavha, afzalliklar va teglar) kerakmi?"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSeoRequestedMessageIds((prev) => new Set(prev).add(msg.id))}
                            className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {language === 'ru'
                                ? '✅ Да, отправить SEO'
                                : language === 'en'
                                ? '✅ Yes, send SEO'
                                : '✅ Ha, SEO matn kerak'}
                            </span>
                          </button>
                          <button
                            onClick={() => setSeoDeclinedMessageIds((prev) => new Set(prev).add(msg.id))}
                            className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>
                              {language === 'ru'
                                ? '❌ Нет, только фото'
                                : language === 'en'
                                ? '❌ No, cards only'
                                : "❌ Yo'q, faqat kartochkalar"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* If declined: Show friendly acknowledgment with re-open toggle */}
                    {seoDeclinedMessageIds.has(msg.id) && (
                      <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-3 text-xs text-slate-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span>👌</span>
                          <span>
                            {language === 'ru'
                              ? 'Понятно! Сохранены только 5 студийных карточек.'
                              : language === 'en'
                              ? 'Understood! Only the 5 studio cards are saved.'
                              : "Tushunarli! Faqat 5 ta studiya kartochkasi saqlandi."}
                          </span>
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
                          {language === 'ru' ? 'Показать SEO' : language === 'en' ? 'Show SEO' : "SEO matnni ko'rish"}
                        </button>
                      </div>
                    )}

                    {/* Formatted SEO Content (Only shown if user confirmed) */}
                    {seoRequestedMessageIds.has(msg.id) && (
                      <div className="rounded-xl bg-slate-900/90 border border-slate-700/70 p-4 space-y-4 text-xs">
                        {/* Uzum Uzbek Section */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                              🟣 UZUM MARKET (O'zbekcha)
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `${msg.productMetadata?.uzum_title_uz}\n\n` +
                                    msg.productMetadata?.bullet_points_uz.join('\n') +
                                    `\n\n` +
                                    msg.productMetadata?.seo_tags_uz.join(' '),
                                  'uzum-uz'
                                )
                              }
                              className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedKey === 'uzum-uz' ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              {copiedKey === 'uzum-uz' ? 'Nusxalandi' : 'Hammasini nusxalash'}
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
                            <span className="font-medium text-slate-300">Teglar: </span>
                            {msg.productMetadata.seo_tags_uz.join(' ')}
                          </div>
                        </div>

                        <div className="border-t border-slate-800 pt-3 space-y-2">
                          {/* Uzum & Wildberries Russian Section */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-violet-400 flex items-center gap-1.5">
                              🟣 UZUM & WILDBERRIES (Русский)
                            </span>
                            <button
                              onClick={() =>
                                copyToClipboard(
                                  `${msg.productMetadata?.uzum_title_ru}\n\n` +
                                    msg.productMetadata?.bullet_points_ru.join('\n') +
                                    `\n\n` +
                                    msg.productMetadata?.seo_tags_ru.join(' '),
                                  'uzum-ru'
                                )
                              }
                              className="text-[11px] font-medium text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedKey === 'uzum-ru' ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                              {copiedKey === 'uzum-ru' ? 'Скопировано' : 'Скопировать все'}
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
                        </div>

                        {/* Interactive Button to switch to Marketplace Preview */}
                        <div className="pt-2 flex flex-wrap gap-2">
                          <button
                            onClick={() => onOpenMarketplace(msg.productMetadata!, msg.mediaGroup!)}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md transition-all"
                          >
                            <span>Uzum Market va Wildberries vitrinasida ko'rish</span>
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

                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => handleOpenPayment('CLICK')}
                          className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Click orqali to'lash</span>
                        </button>
                        <button
                          onClick={() => handleOpenPayment('PAYME')}
                          className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Payme orqali to'lash</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-1 text-right text-[10px] text-slate-500 font-mono">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Telegram Contact Share Banner for Free Welcome Bonus */}
        {!isPhoneVerified && (
          <div className="bg-gradient-to-r from-emerald-950/70 to-indigo-950/70 border border-emerald-500/40 rounded-xl p-3 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-white block">
                  {language === 'ru'
                    ? '🎁 Зарегистрируйтесь с номером Telegram'
                    : language === 'en'
                    ? '🎁 Register with your Telegram phone number'
                    : '🎁 Telegram raqamingiz bilan ro\'yxatdan o\'ting'}
                </span>
                <span className="text-[11px] text-emerald-300">
                  {language === 'ru'
                    ? '+1 бесплатный пакет (5 карточек + SEO) в подарок!'
                    : language === 'en'
                    ? '+1 Free package (5 cards + SEO) welcome bonus!'
                    : '+1 ta bepul paket (5 ta kartochka + SEO) bonus oling!'}
                </span>
              </div>
            </div>

            <button
              onClick={handleSharePhoneContact}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{t.phoneBonusButton}</span>
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-[#151d2f] border border-slate-800 rounded-xl p-3 shadow-lg flex items-center gap-2 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            title="Mahsulot rasmini yuklash"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 text-xs text-slate-400 pl-2 select-none">
            {isProcessing ? (
              <span className="flex items-center gap-2 text-indigo-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Zero-Prompt ishlov berilmoqda...
              </span>
            ) : (
              <span>📸 Mahsulot rasmini yuboring (yuqoridagi namunalardan bosing yoki rasm yuklang)</span>
            )}
          </div>

          <button
            onClick={() => processZeroPromptUpload(SAMPLE_PRODUCTS[0])}
            disabled={isProcessing}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-colors disabled:opacity-50"
            title="Sinov rasmini yuborish"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lightbox Viewer */}
      <StudioCardViewer
        card={selectedCardForView}
        onClose={() => setSelectedCardForView(null)}
      />

      {/* Payment Modal */}
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
