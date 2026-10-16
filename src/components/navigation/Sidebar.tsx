import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  BarChart3,
  ReceiptText,
  Target,
  Settings,
  Plus,
  Lock,
  Users,
  ShieldCheck,
  Smartphone,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBudget } from '../../context/BudgetContext';
import { triggerHaptic } from '../../services/storage';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddModal: () => void;
  onOpenAccountModal: () => void;
  onOpenIOSGuide: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
  onOpenAccountModal,
  onOpenIOSGuide,
}) => {
  const { currentUser, users, lockApp, logout } = useAuth();
  const { transactions, budgetAlerts } = useBudget();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'budgets',
      label: 'Budgets & Limits',
      icon: PieChart,
      badge: budgetAlerts.length > 0 ? `${budgetAlerts.length}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    { id: 'analytics', label: 'Financial Insights', icon: BarChart3 },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: ReceiptText,
      badge: transactions.length > 0 ? `${transactions.length}` : undefined,
    },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'settings', label: 'Vault & Backup', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-slate-900/70 border-r border-slate-800/80 p-5 shrink-0 h-full justify-between select-none backdrop-blur-xl">
      <div className="space-y-6">
        {/* App Title */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-950/40">
              <span className="text-lg font-bold">Z</span>
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight leading-none block">
                Zenith Budget
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                iOS Offline Planner
              </span>
            </div>
          </div>

          <div
            onClick={onOpenIOSGuide}
            title="iOS Web App Guide"
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* User Profile Card & Switcher */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex items-center justify-between">
          <div
            onClick={() => {
              triggerHaptic('light');
              onOpenAccountModal();
            }}
            className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
              style={{ backgroundColor: currentUser?.color || '#10b981' }}
            >
              {currentUser?.avatar || '👤'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.name || 'Account'}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Isolated Local Data</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenAccountModal();
              }}
              title="Switch Account"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
            {currentUser?.pin && (
              <button
                onClick={lockApp}
                title="Lock Vault"
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm('Log out of this account?')) {
                  logout();
                }
              }}
              title="Log Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenAddModal();
          }}
          className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 ios-touch-active transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Transaction</span>
        </button>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  triggerHaptic('light');
                  onTabChange(item.id);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-600/15 text-emerald-300 font-semibold border border-emerald-500/20 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full border ${
                      item.badgeColor ||
                      'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="space-y-2 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 px-1">
        <div className="flex items-center justify-between">
          <span>Storage</span>
          <span className="text-emerald-400 font-medium">Local (Device Only)</span>
        </div>
        <div className="flex items-center justify-between">
          <span>GitHub Pages</span>
          <span className="text-slate-400 font-mono text-[10px]">Ready</span>
        </div>
      </div>
    </aside>
  );
};
