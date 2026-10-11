import React, { useState } from 'react';
import { Header } from './components/Header';
import { TelegramSimulator } from './components/TelegramSimulator';
import { MarketplacePreview } from './components/MarketplacePreview';
import { CodebaseExplorer } from './components/CodebaseExplorer';
import { AdminConsole } from './components/AdminConsole';
import { ProductMetadata, StudioCard, DbTransaction, DbCardGeneration } from './types';
import { SAMPLE_PRODUCTS } from './data/sampleProducts';
import { Language } from './data/translations';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'marketplace' | 'codebase' | 'admin'>('simulator');
  const [language, setLanguage] = useState<Language>('uz');
  const [userCredits, setUserCredits] = useState<number>(1); // 1 free trial pack (5 cards)

  // Active generated product for marketplace view
  const [activeProductData, setActiveProductData] = useState<ProductMetadata | null>(
    SAMPLE_PRODUCTS[0].metadata as ProductMetadata
  );
  const [activeStudioCards, setActiveStudioCards] = useState<StudioCard[] | null>(
    SAMPLE_PRODUCTS[0].studioCards as StudioCard[]
  );

  // Simulated Database states
  const [transactions, setTransactions] = useState<DbTransaction[]>([]);
  const [generations, setGenerations] = useState<DbCardGeneration[]>([]);

  const handleOpenMarketplace = (productData: ProductMetadata, cards: StudioCard[]) => {
    setActiveProductData(productData);
    setActiveStudioCards(cards);
    setActiveTab('marketplace');
  };

  const handleTransactionLogged = (amountUzs: number, provider: 'CLICK' | 'PAYME') => {
    const newTx: DbTransaction = {
      id: crypto.randomUUID ? crypto.randomUUID() : `tx-${Date.now()}`,
      user_id: 84920194,
      amount_uzs: amountUzs,
      provider: provider,
      status: 'SUCCESS',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleGenerationLogged = (productName: string, cardsCount: number) => {
    const newGen: DbCardGeneration = {
      id: crypto.randomUUID ? crypto.randomUUID() : `gen-${Date.now()}`,
      user_id: 84920194,
      product_name: productName,
      cards_count: cardsCount,
      cost_usd: 0.024,
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    };
    setGenerations((prev) => [newGen, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userCredits={userCredits}
        language={language}
        setLanguage={setLanguage}
      />

      <main className="flex-1 flex flex-col">
        {activeTab === 'simulator' && (
          <TelegramSimulator
            userCredits={userCredits}
            setUserCredits={setUserCredits}
            onOpenMarketplace={handleOpenMarketplace}
            onTransactionLogged={handleTransactionLogged}
            onGenerationLogged={handleGenerationLogged}
          />
        )}

        {activeTab === 'marketplace' && (
          <MarketplacePreview
            productData={activeProductData}
            studioCards={activeStudioCards}
          />
        )}

        {activeTab === 'codebase' && <CodebaseExplorer />}

        {activeTab === 'admin' && (
          <AdminConsole
            userCredits={userCredits}
            setUserCredits={setUserCredits}
            transactions={transactions}
            generations={generations}
          />
        )}
      </main>
    </div>
  );
}
