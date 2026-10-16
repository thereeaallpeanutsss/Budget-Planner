import React from 'react';
import {
  LayoutDashboard,
  PieChart,
  Plus,
  ReceiptText,
  Target,
  Settings,
  BarChart3,
} from 'lucide-react';
import { triggerHaptic } from '../../services/storage';

interface TabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenAddModal: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Summary', icon: LayoutDashboard },
    { id: 'budgets', label: 'Budgets', icon: PieChart },
    { id: 'analytics', label: 'Insights', icon: BarChart3 },
    { id: 'transactions', label: 'History', icon: ReceiptText },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'settings', label: 'Vault', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-t border-white/10 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 px-3">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                onTabChange(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                isActive
                  ? 'text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${
                  isActive ? 'scale-110' : 'scale-100'
                }`}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute -top-1 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
