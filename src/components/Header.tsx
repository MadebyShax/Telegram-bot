import React from 'react';
import { Download, Globe } from 'lucide-react';
import { downloadPythonProjectZip } from '../utils/zipExport';
import { TRANSLATIONS, Language } from '../data/translations';

interface HeaderProps {
  activeTab: 'simulator' | 'marketplace' | 'codebase' | 'admin';
  setActiveTab: (tab: 'simulator' | 'marketplace' | 'codebase' | 'admin') => void;
  userCredits: number;
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  userCredits,
  language,
  setLanguage,
}) => {
  const [downloading, setDownloading] = React.useState(false);
  const t = TRANSLATIONS[language];

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadPythonProjectZip();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c121e]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            {t.appTitle}
          </span>
          <span className="hidden sm:inline-block text-xs text-slate-400">
            {t.appSubtitle}
          </span>
        </div>

        {/* Zone 2: 4 clean single-line navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`whitespace-nowrap transition-colors pb-0.5 ${
              activeTab === 'simulator'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabSimulator}
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`whitespace-nowrap transition-colors pb-0.5 ${
              activeTab === 'marketplace'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabMarketplace}
          </button>
          <button
            onClick={() => setActiveTab('codebase')}
            className={`whitespace-nowrap transition-colors pb-0.5 ${
              activeTab === 'codebase'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabCodebase}
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`whitespace-nowrap transition-colors pb-0.5 ${
              activeTab === 'admin'
                ? 'text-white border-b-2 border-indigo-500 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.tabAdmin}
          </button>
        </nav>

        {/* Zone 3: Language toggle & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLanguage('uz')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'uz' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              UZ
            </button>
            <button
              onClick={() => setLanguage('ru')}
              className={`px-2 py-1 rounded transition-colors ${
                language === 'ru' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              RU
            </button>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg transition-colors shadow-sm disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? t.downloading : t.downloadZip}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
