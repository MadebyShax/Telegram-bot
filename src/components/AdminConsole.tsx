import React, { useState } from 'react';
import { Database, Users, CreditCard, Layers, TrendingUp, DollarSign, Search, PlusCircle } from 'lucide-react';
import { DbUser, DbTransaction, DbCardGeneration } from '../types';

interface AdminConsoleProps {
  userCredits: number;
  setUserCredits: React.Dispatch<React.SetStateAction<number>>;
  transactions: DbTransaction[];
  generations: DbCardGeneration[];
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  userCredits,
  setUserCredits,
  transactions,
  generations,
}) => {
  const [activeTable, setActiveTable] = useState<'users' | 'transactions' | 'card_generations'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample seed users
  const [users, setUsers] = useState<DbUser[]>([
    {
      telegram_id: 84920194,
      username: 'uzum_seller_pro',
      full_name: 'Bobur Mirzayev (Toshkent)',
      credits: userCredits,
      created_at: '2026-10-10 14:20:11',
    },
    {
      telegram_id: 19482012,
      username: 'rishton_ceramics',
      full_name: 'Alisher Qosimov (Farg\'ona)',
      credits: 4,
      created_at: '2026-10-09 11:05:43',
    },
    {
      telegram_id: 93821033,
      username: 'wb_fashion_uz',
      full_name: 'Dildora Karimova (Samarqand)',
      credits: 2,
      created_at: '2026-10-08 09:30:19',
    },
  ]);

  const handleGrantCredit = (telegramId: number) => {
    setUsers((prev) =>
      prev.map((u) => (u.telegram_id === telegramId ? { ...u, credits: u.credits + 1 } : u))
    );
    if (telegramId === 84920194) {
      setUserCredits((prev) => prev + 1);
    }
  };

  const totalRevenueUzs = transactions.reduce((acc, t) => acc + (t.status === 'SUCCESS' ? t.amount_uzs : 0), 450000);
  const totalGenerationsCount = generations.length + 38;
  const totalCardsCount = totalGenerationsCount * 5;
  const estimatedCostUsd = totalGenerationsCount * 0.024;
  const estimatedRevenueUsd = totalRevenueUzs / 12900;
  const grossMarginPercent = Math.round(((estimatedRevenueUsd - estimatedCostUsd) / estimatedRevenueUsd) * 100);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* SaaS Financial KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Jami Tushum (Click + Payme)</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalRevenueUzs.toLocaleString('uz-UZ')} UZS
          </div>
          <div className="text-[11px] text-emerald-400">≈ ${(totalRevenueUzs / 12900).toFixed(2)} USD</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Yaratilgan Studiya Kartochkalari</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {totalCardsCount.toLocaleString('uz-UZ')} ta
          </div>
          <div className="text-[11px] text-slate-400">{totalGenerationsCount} ta paket (3:4 Uzum)</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>O'rtacha API Tannarxi</span>
            <TrendingUp className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            $0.024 <span className="text-xs font-normal text-slate-400">/ 5 kartochka</span>
          </div>
          <div className="text-[11px] text-slate-400">GPT-4o Vision + Flux Schnell</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Yalpi Foyda Marjasi</span>
            <CreditCard className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {grossMarginPercent}%
          </div>
          <div className="text-[11px] text-slate-400">Sotish: 15,000 UZS ($1.16) · Tannarx: $0.024</div>
        </div>
      </div>

      {/* Database Tables Console */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-4 p-6">
        {/* Table Selector Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              PostgreSQL Ma'lumotlar Bazasi (Supabase)
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl p-1 text-xs">
            <button
              onClick={() => setActiveTable('users')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTable === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              users ({users.length})
            </button>
            <button
              onClick={() => setActiveTable('transactions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTable === 'transactions'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              transactions ({transactions.length + 3})
            </button>
            <button
              onClick={() => setActiveTable('card_generations')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTable === 'card_generations'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              card_generations ({generations.length + 3})
            </button>
          </div>
        </div>

        {/* Users Table */}
        {activeTable === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">telegram_id</th>
                  <th className="py-3 px-4">username</th>
                  <th className="py-3 px-4">full_name</th>
                  <th className="py-3 px-4 text-right">credits</th>
                  <th className="py-3 px-4">created_at</th>
                  <th className="py-3 px-4 text-center">Boshqaruv</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {users.map((u) => (
                  <tr key={u.telegram_id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-indigo-400">{u.telegram_id}</td>
                    <td className="py-3 px-4 text-slate-200">@{u.username}</td>
                    <td className="py-3 px-4 font-sans text-slate-300">{u.full_name}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">
                      {u.telegram_id === 84920194 ? userCredits : u.credits} ta
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{u.created_at}</td>
                    <td className="py-3 px-4 text-center font-sans">
                      <button
                        onClick={() => handleGrantCredit(u.telegram_id)}
                        className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-colors"
                      >
                        +1 Paket berish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transactions Table */}
        {activeTable === 'transactions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">id (UUID)</th>
                  <th className="py-3 px-4">user_id</th>
                  <th className="py-3 px-4 text-right">amount_uzs</th>
                  <th className="py-3 px-4">provider</th>
                  <th className="py-3 px-4">status</th>
                  <th className="py-3 px-4">created_at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {/* Seed rows */}
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500">e2b7a109-7d84-4b51...</td>
                  <td className="py-3 px-4 text-indigo-400">84920194</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">15,000 UZS</td>
                  <td className="py-3 px-4 text-blue-400 font-bold">CLICK</td>
                  <td className="py-3 px-4 text-emerald-400">SUCCESS</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">2026-10-11 08:45:12</td>
                </tr>
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500">8fa19472-1b33-4f90...</td>
                  <td className="py-3 px-4 text-indigo-400">19482012</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-bold">45,000 UZS</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">PAYME</td>
                  <td className="py-3 px-4 text-emerald-400">SUCCESS</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">2026-10-10 16:12:00</td>
                </tr>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500">{tx.id.substring(0, 18)}...</td>
                    <td className="py-3 px-4 text-indigo-400">{tx.user_id}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-bold">
                      {tx.amount_uzs.toLocaleString('uz-UZ')} UZS
                    </td>
                    <td className={`py-3 px-4 font-bold ${tx.provider === 'CLICK' ? 'text-blue-400' : 'text-emerald-400'}`}>
                      {tx.provider}
                    </td>
                    <td className="py-3 px-4 text-emerald-400">{tx.status}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{tx.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Card Generations Table */}
        {activeTable === 'card_generations' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">id (UUID)</th>
                  <th className="py-3 px-4">user_id</th>
                  <th className="py-3 px-4">product_name</th>
                  <th className="py-3 px-4 text-right">cards_count</th>
                  <th className="py-3 px-4 text-right">cost_usd</th>
                  <th className="py-3 px-4">created_at</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                <tr className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 text-slate-500">c3f19472-a1b4-4b52...</td>
                  <td className="py-3 px-4 text-indigo-400">84920194</td>
                  <td className="py-3 px-4 font-sans text-slate-200">Rishton Kulolchilik Choynagi</td>
                  <td className="py-3 px-4 text-right text-indigo-400 font-bold">5 ta</td>
                  <td className="py-3 px-4 text-right text-slate-400">$0.0240</td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">2026-10-11 09:12:44</td>
                </tr>
                {generations.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 text-slate-500">{g.id.substring(0, 18)}...</td>
                    <td className="py-3 px-4 text-indigo-400">{g.user_id}</td>
                    <td className="py-3 px-4 font-sans text-slate-200">{g.product_name}</td>
                    <td className="py-3 px-4 text-right text-indigo-400 font-bold">{g.cards_count} ta</td>
                    <td className="py-3 px-4 text-right text-slate-400">${g.cost_usd.toFixed(4)}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">{g.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
