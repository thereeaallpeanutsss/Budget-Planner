/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BudgetProvider } from './context/BudgetContext';
import { AuthScreen } from './components/auth/AuthScreen';
import { PinLockScreen } from './components/auth/PinLockScreen';
import { AccountManagerModal } from './components/auth/AccountManagerModal';
import { CategoryManagerModal } from './components/categories/CategoryManagerModal';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { IOSInstallModal } from './components/common/IOSInstallModal';
import { TabBar } from './components/navigation/TabBar';
import { Sidebar } from './components/navigation/Sidebar';
import { TopBar } from './components/navigation/TopBar';

import { DashboardView } from './components/dashboard/DashboardView';
import { BudgetsView } from './components/budgets/BudgetsView';
import { TransactionsView } from './components/transactions/TransactionsView';
import { SavingsGoalsView } from './components/goals/SavingsGoalsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { SettingsBackupView } from './components/settings/SettingsBackupView';
import { Transaction, TransactionType, MonthlySpendingSummary } from './types/budget';
import { MonthlyReportModal } from './components/analytics/MonthlyReportModal';
import { Plus, WifiOff } from 'lucide-react';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { triggerHaptic } from './services/storage';

const MainContent: React.FC = () => {
  const { isAuthenticated, isLocked, isLoading, currentUser } = useAuth();
  const isOnline = useOnlineStatus();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isIOSGuideOpen, setIsIOSGuideOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDefaultType, setAddModalDefaultType] = useState<TransactionType>('expense');
  const [addModalDefaultDate, setAddModalDefaultDate] = useState<string | undefined>(undefined);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [activeReportSummary, setActiveReportSummary] = useState<MonthlySpendingSummary | null>(null);

  const handleOpenAddModal = (type: TransactionType = 'expense', date?: string) => {
    triggerHaptic('light');
    setEditingTx(null);
    setAddModalDefaultType(type);
    setAddModalDefaultDate(date);
    setIsAddModalOpen(true);
  };

  const handleEditTx = (tx: Transaction) => {
    triggerHaptic('light');
    setEditingTx(tx);
    setAddModalDefaultDate(tx.date);
    setIsAddModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-emerald-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs tracking-wider text-slate-400 font-medium">
            Opening Local Vault...
          </span>
        </div>
      </div>
    );
  }

  // If user is not logged in / authenticated, show AuthScreen (Email & Password Sign In / Sign Up)
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  // If locked with PIN, render iOS Passcode Screen
  if (isLocked) {
    return (
      <>
        <PinLockScreen onOpenAccountSwitcher={() => setIsAccountModalOpen(true)} />
        <AccountManagerModal
          isOpen={isAccountModalOpen}
          onClose={() => setIsAccountModalOpen(false)}
        />
      </>
    );
  }

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Zenith Budget';
      case 'budgets':
        return 'Budgets & Limits';
      case 'analytics':
        return 'Analytics & Trends';
      case 'transactions':
        return 'Transaction History';
      case 'goals':
        return 'Savings Goals';
      case 'settings':
        return 'Settings & Backup';
      default:
        return 'Zenith Budget';
    }
  };

  return (
    <div className="flex min-h-screen min-h-[100dvh] h-[100dvh] w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* iPad and Desktop Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenAddModal={() => handleOpenAddModal('expense')}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        onOpenIOSGuide={() => setIsIOSGuideOpen(true)}
      />

      {/* Main Viewport Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Offline indicator bar if disconnected (PWA) */}
        {!isOnline && (
          <div className="bg-amber-600/90 text-white text-[11px] font-medium py-1 px-3 text-center flex items-center justify-center gap-1.5 shadow-sm">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline Mode Active — All data is safely stored on this device.</span>
          </div>
        )}

        {/* Mobile TopBar */}
        <TopBar
          title={getTabTitle()}
          onOpenAccountModal={() => setIsAccountModalOpen(true)}
          onOpenIOSGuide={() => setIsIOSGuideOpen(true)}
        />

        {/* Scrollable Main Stage */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 md:pb-8 max-w-5xl mx-auto w-full no-scrollbar">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddModal={(type) => handleOpenAddModal(type)}
              onNavigateTab={setActiveTab}
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
              onOpenReportModal={(summary) => setActiveReportSummary(summary)}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView onOpenCategoryManager={() => setIsCategoryModalOpen(true)} />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              onOpenAddTransaction={(date) => handleOpenAddModal('expense', date)}
              onOpenReportModal={(summary) => setActiveReportSummary(summary)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              onEditTransaction={handleEditTx}
              onOpenAddModal={() => handleOpenAddModal('expense')}
            />
          )}

          {activeTab === 'goals' && <SavingsGoalsView />}

          {activeTab === 'settings' && (
            <SettingsBackupView
              onOpenAccountModal={() => setIsAccountModalOpen(true)}
              onOpenIOSGuide={() => setIsIOSGuideOpen(true)}
              onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
            />
          )}
        </main>

        {/* Floating Quick Action Button on Mobile */}
        <div className="md:hidden fixed bottom-20 right-4 z-30">
          <button
            onClick={() => handleOpenAddModal('expense')}
            title="Add transaction"
            className="w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/40 border-2 border-slate-900 ios-touch-active transition-transform"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Mobile iOS Bottom Tab Bar */}
        <TabBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenAddModal={() => handleOpenAddModal('expense')}
        />
      </div>

      {/* Global Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTx(null);
          setAddModalDefaultDate(undefined);
        }}
        editTx={editingTx}
        defaultType={addModalDefaultType}
        defaultDate={addModalDefaultDate}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
      />

      <MonthlyReportModal
        summary={activeReportSummary}
        onClose={() => setActiveReportSummary(null)}
        currencySymbol={currentUser?.currency?.symbol || '$'}
      />

      <AccountManagerModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <IOSInstallModal
        isOpen={isIOSGuideOpen}
        onClose={() => setIsIOSGuideOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BudgetProvider>
        <MainContent />
      </BudgetProvider>
    </AuthProvider>
  );
}
