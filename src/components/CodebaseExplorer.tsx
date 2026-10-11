import React, { useState } from 'react';
import { FileCode, Folder, Copy, Check, Download, Terminal, Cpu } from 'lucide-react';
import { PYTHON_CODEBASE_FILES, CodeFile } from '../data/pythonCodebase';
import { downloadPythonProjectZip } from '../utils/zipExport';

export const CodebaseExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<CodeFile>(PYTHON_CODEBASE_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await downloadPythonProjectZip();
    } finally {
      setDownloading(false);
    }
  };

  const categories = [
    { key: 'bot', label: 'Bot & Handlers' },
    { key: 'services', label: 'Async Services' },
    { key: 'database', label: 'Database & Models' },
    { key: 'config', label: 'Config & Dependencies' },
    { key: 'deploy', label: 'Docker Deployment' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & Quick Commands */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <span>Ishlab Chiqarishga Tayyor Aiogram 3.x Loyiha Shabloni</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Modulli arxitektura, SQLAlchemy 2.0 async, Click & Payme to'lovlari, GPT-4o Vision va Flux.1 integratsiyasi.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{downloading ? 'Arxivlanmoqda...' : 'Loyiha Kodini Yuklab Olish (.zip)'}</span>
          </button>
        </div>
      </div>

      {/* Explorer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Left Sidebar: File Tree */}
        <div className="md:col-span-4 lg:col-span-3 border-r border-slate-800/80 bg-slate-900/60 p-4 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Folder className="w-4 h-4 text-indigo-400" />
            <span>Loyiha Fayllari</span>
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const filesInCat = PYTHON_CODEBASE_FILES.filter((f) => f.category === cat.key);
              if (filesInCat.length === 0) return null;

              return (
                <div key={cat.key} className="space-y-1">
                  <div className="text-[11px] font-semibold text-slate-400 px-2 py-0.5">
                    {cat.label}
                  </div>
                  {filesInCat.map((file) => {
                    const isSelected = selectedFile.path === file.path;
                    return (
                      <button
                        key={file.path}
                        onClick={() => setSelectedFile(file)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ${
                          isSelected
                            ? 'bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileCode className="w-3.5 h-3.5 shrink-0 opacity-80" />
                          <span className="truncate">{file.path}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Quick deploy guide note */}
          <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tezkor ishga tushirish:</span>
            </div>
            <pre className="p-2 rounded bg-slate-950 font-mono text-[10px] text-emerald-300 overflow-x-auto">
              docker-compose up -d --build
            </pre>
          </div>
        </div>

        {/* Right Content: Code Viewer */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col min-h-[500px] bg-[#0b0f17]">
          {/* File Header Bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-slate-900/90 text-xs">
            <div>
              <div className="font-mono font-bold text-white flex items-center gap-2">
                <span>{selectedFile.path}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-sans uppercase">
                  {selectedFile.language}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">{selectedFile.description}</div>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Nusxalandi' : 'Kodni nusxalash'}</span>
            </button>
          </div>

          {/* Code Text with line numbers */}
          <div className="flex-1 p-4 font-mono text-xs overflow-x-auto text-slate-300 leading-relaxed bg-[#0a0e17]">
            <table className="w-full border-collapse">
              <tbody>
                {selectedFile.content.split('\n').map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="w-10 pr-4 text-right text-slate-600 select-none font-mono text-[11px] align-top">
                      {idx + 1}
                    </td>
                    <td className="whitespace-pre font-mono text-slate-200">{line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
