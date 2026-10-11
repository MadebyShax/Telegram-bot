import React from 'react';
import { X, Download, Copy, Check } from 'lucide-react';
import { StudioCard } from '../types';

interface StudioCardViewerProps {
  card: StudioCard | null;
  onClose: () => void;
}

export const StudioCardViewer: React.FC<StudioCardViewerProps> = ({ card, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!card) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(card.description);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadImage = () => {
    const a = document.createElement('a');
    a.href = card.imageUrl;
    a.download = `uzum-card-${card.index}-${card.styleName.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/60">
          <div>
            <h3 className="text-sm font-bold text-white">
              Kartochka #{card.index}: {card.styleName}
            </h3>
            <p className="text-xs text-slate-400">
              Uzum Market formati · 3:4 vertikal nisbat
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Preview with Badge Overlay */}
        <div className="relative flex-1 bg-black flex items-center justify-center p-4 min-h-[360px] overflow-hidden">
          <div className="relative max-h-[480px] aspect-[3/4] rounded-lg overflow-hidden border border-slate-700/60 shadow-xl group">
            <img
              src={card.imageUrl}
              alt={card.styleName}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />

            {/* Simulated Uzum Market Graphic Badge Overlay */}
            <div className="absolute top-3 left-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-black text-xs px-3 py-1.5 rounded-md shadow-lg tracking-wider uppercase">
              {card.badge}
            </div>

            {/* Uzum 1-day delivery watermark tag */}
            <div className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-sm text-emerald-400 text-[10px] font-semibold px-2 py-1 rounded border border-emerald-500/30">
              ⚡️ Uzum 1 kunda yetkazish
            </div>
          </div>
        </div>

        {/* Footer info & actions */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3">
          <div className="text-xs text-slate-300">
            <span className="font-semibold text-slate-100">Studiya kompozitsiyasi:</span> {card.description}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Nusxalandi' : 'Flux Promptini nusxalash'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Kartochkani yuklab olish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
