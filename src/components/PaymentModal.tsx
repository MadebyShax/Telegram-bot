import React, { useState } from 'react';
import { X, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: 'CLICK' | 'PAYME';
  amountUzs: number;
  cardsCount: number;
  onSuccess: (amountUzs: number, provider: 'CLICK' | 'PAYME') => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  provider,
  amountUzs,
  cardsCount,
  onSuccess,
}) => {
  const [cardNumber, setCardNumber] = useState('8600 •••• •••• 4219');
  const [cardExp, setCardExp] = useState('08/28');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      setTimeout(() => {
        onSuccess(amountUzs, provider);
        setIsPaid(false);
        onClose();
      }, 1200);
    }, 1000);
  };

  const isClick = provider === 'CLICK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[#111827] border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className={`p-4 flex items-center justify-between text-white ${isClick ? 'bg-blue-600' : 'bg-emerald-600'}`}>
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5" />
            <div>
              <div className="text-sm font-bold tracking-tight">
                {isClick ? 'Click Telegram Payments' : 'Payme Merchant Webhook'}
              </div>
              <div className="text-[11px] opacity-90">Telegram Native Payment Gateway</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-200">
          {isPaid ? (
            <div className="py-8 text-center space-y-3">
              <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
              <div className="text-lg font-bold text-white">To'lov muvaffaqiyatli qabul qilindi!</div>
              <div className="text-xs text-slate-400 font-mono">
                +{cardsCount} ta generatsiya paketi balansingizga qo'shildi
              </div>
            </div>
          ) : (
            <>
              {/* Order Summary */}
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Paket:</span>
                  <span className="text-slate-200 font-medium">{cardsCount} ta AI kartochka + SEO</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>To'lov provayderi:</span>
                  <span className={`font-semibold ${isClick ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {provider} (Uzbekistan)
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Valyuta:</span>
                  <span className="text-slate-200">UZS (O'zbek so'mi)</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
                  <span>Jami to'lov:</span>
                  <span className="font-mono text-base text-emerald-400">
                    {amountUzs.toLocaleString('uz-UZ')} UZS
                  </span>
                </div>
              </div>

              {/* Card mock */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-400">
                  Uzcard / Humo karta raqami (Simulyatsiya)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cardExp}
                      onChange={(e) => setCardExp(e.target.value)}
                      placeholder="MM/YY"
                      className="w-1/2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="w-1/2 flex items-center justify-center text-[11px] text-slate-500 border border-slate-800 rounded-lg px-2">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                      3D-Secure SMS
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleSimulatePayment}
                disabled={isProcessing}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  isClick
                    ? 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700'
                } disabled:opacity-60`}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    To'lov tasdiqlanmoqda...
                  </span>
                ) : (
                  <span>
                    {amountUzs.toLocaleString('uz-UZ')} UZS To'lash ({provider})
                  </span>
                )}
              </button>

              <div className="text-center text-[11px] text-slate-500">
                🔒 Telegram Payments API orqali himoyalangan rasmiy merchant shlyuzi
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
