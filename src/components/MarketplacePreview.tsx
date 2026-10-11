import React, { useState } from 'react';
import { Star, Truck, ShieldCheck, Heart, Share2, Copy, Check, ShoppingBag, Eye } from 'lucide-react';
import { ProductMetadata, StudioCard } from '../types';
import { SAMPLE_PRODUCTS } from '../data/sampleProducts';

interface MarketplacePreviewProps {
  productData: ProductMetadata | null;
  studioCards: StudioCard[] | null;
}

export const MarketplacePreview: React.FC<MarketplacePreviewProps> = ({
  productData: incomingProduct,
  studioCards: incomingCards,
}) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [lang, setLang] = useState<'uz' | 'ru'>('uz');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fallback to sample 1 if none generated yet
  const product = incomingProduct || (SAMPLE_PRODUCTS[0].metadata as ProductMetadata);
  const cards = incomingCards || (SAMPLE_PRODUCTS[0].studioCards as StudioCard[]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const activeCard = cards[activeImageIndex] || cards[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isDesktop = viewMode === 'desktop';
  const priceUzs = product.suggested_price_uzs || 185000;
  const monthlyNasiya = Math.round(priceUzs / 9);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Platform Switcher & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">Vitrina rejimi:</span>
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1">
            <button
              onClick={() => setViewMode('desktop')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isDesktop
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛍 E-Commerce Do'kon (Desktop)
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !isDesktop
                  ? 'bg-gradient-to-r from-purple-700 to-pink-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📱 Mobil Ilova Vitrinasi
            </button>
          </div>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Til:</span>
          <div className="flex bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setLang('uz')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                lang === 'uz' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              O'zbekcha
            </button>
            <button
              onClick={() => setLang('ru')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                lang === 'ru' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Русский
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              handleCopy(
                lang === 'uz'
                  ? `${product.uzum_title_uz}\n\n${product.bullet_points_uz.join('\n')}`
                  : `${product.uzum_title_ru}\n\n${product.bullet_points_ru.join('\n')}`,
                'all-seller-text'
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            {copiedKey === 'all-seller-text' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>Sotuvchi matnlarini nusxalash</span>
          </button>
        </div>
      </div>

      {/* Simulated Product Page */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Mock Browser Header */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">
              E-COMMERCE STORE
            </span>
            <span className="hidden sm:inline-block text-slate-500">|</span>
            <span className="hidden sm:inline-block text-slate-400">
              Katalog / {product.category}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-400 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              Tezkor va xavfsiz yetkazish
            </span>
            <span className="text-slate-400">Online Do'kon</span>
          </div>
        </div>

        {/* Main Product Layout */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery (5 Cards) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Primary Hero Card */}
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-black border border-slate-700/80 shadow-lg group">
              <img
                src={activeCard.imageUrl}
                alt={activeCard.styleName}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />

              {/* Graphic Badge (if present) */}
              {activeCard.badge && (
                <div className="absolute top-3 left-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wide">
                  {activeCard.badge}
                </div>
              )}

              {/* Delivery badge */}
              <div className="absolute bottom-3 right-3 bg-slate-950/85 backdrop-blur-sm text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-lg border border-emerald-500/30">
                ⚡️ Tezkor yetkazish
              </div>

              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-sm text-slate-300 text-[11px] px-2.5 py-1 rounded-lg">
                Kartochka {activeCard.index} / {cards.length}: {activeCard.styleName}
              </div>
            </div>

            {/* Thumbnails Row */}
            <div className="grid grid-cols-5 gap-2">
              {cards.map((card, idx) => (
                <button
                  key={card.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                    activeImageIndex === idx
                      ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-102'
                      : 'border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600'
                  }`}
                >
                  <img
                    src={card.imageUrl}
                    alt={card.styleName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Title, Pricing, Specs, Bullet Points */}
          <div className="lg:col-span-7 space-y-6">
            {/* Title & Ratings */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="flex items-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold ml-1 text-slate-200">4.9</span>
                </div>
                <span>·</span>
                <span className="text-slate-400">128 ta baholash</span>
                <span>·</span>
                <span className="text-emerald-400">500+ ta buyurtma</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
                {lang === 'uz' ? product.uzum_title_uz : product.uzum_title_ru}
              </h1>

              <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                <span>Yetkazib beruvchi:</span>
                <span className="text-indigo-400 font-semibold">Premium Store</span>
                <span className="text-slate-500">|</span>
                <span>Kategoriya:</span>
                <span className="text-slate-300">{product.category}</span>
              </div>
            </div>

            {/* Price Box */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                  {priceUzs.toLocaleString('uz-UZ')} {lang === 'uz' ? "so'm" : 'сум'}
                </span>
                <span className="text-sm font-mono text-slate-500 line-through">
                  {Math.round(priceUzs * 1.35).toLocaleString('uz-UZ')} {lang === 'uz' ? "so'm" : 'сум'}
                </span>
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                  -26%
                </span>
              </div>

              {/* Installment callout */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-violet-950/40 border border-violet-800/40 text-xs">
                <span className="text-violet-200">
                  <b>Bo'lib to'lash:</b> oyiga {monthlyNasiya.toLocaleString('uz-UZ')} so'mdan
                </span>
                <span className="text-[11px] text-violet-400 font-semibold cursor-pointer hover:underline">
                  Muddatli to'lov 12 oy
                </span>
              </div>

              {/* Delivery guarantee */}
              <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                <Truck className="w-4 h-4 text-emerald-400" />
                <span>
                  <b>Yetkazib berish:</b> 1-2 kunda manzilga bepul va xavfsiz yetkaziladi
                </span>
              </div>
            </div>

            {/* Selling Bullet Points */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-200">
                {lang === 'uz' ? 'Mahsulotning afzalliklari:' : 'Преимущества товара:'}
              </h3>

              <div className="space-y-2 text-xs sm:text-sm text-slate-300">
                {(lang === 'uz'
                  ? product.bullet_points_uz
                  : product.bullet_points_ru
                ).map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs Table */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Xususiyatlar / Характеристики:
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Material:</span>
                  <span className="text-slate-200 font-medium">
                    {product.materials.join(', ')}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Ranglar:</span>
                  <span className="text-slate-200 font-medium">
                    {product.primary_colors.join(', ')}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Konstruktsiya:</span>
                  <span className="text-slate-200 font-medium">{product.shape_and_form}</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Ishlab chiqarilgan davlat:</span>
                  <span className="text-slate-200 font-medium">O'zbekiston</span>
                </div>
              </div>
            </div>

            {/* Search Tags */}
            <div className="pt-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">SEO Kalit so'zlar: </span>
              {(lang === 'uz' ? product.seo_tags_uz : product.seo_tags_ru).join(' ')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
