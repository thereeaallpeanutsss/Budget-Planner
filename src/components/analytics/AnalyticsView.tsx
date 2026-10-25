import React, { useState, useMemo } from 'react';
import { useBudget } from '../../context/BudgetContext';
import {
  TrendingUp,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';
import { triggerHaptic } from '../../services/storage';
import { CalendarSpendingView } from './CalendarSpendingView';
import { MonthlyReportModal } from './MonthlyReportModal';
import { MonthlySpendingSummary } from '../../types/budget';
import { useAuth } from '../../context/AuthContext';

interface AnalyticsViewProps {
  onOpenAddTransaction?: (date?: string) => void;
  onOpenReportModal?: (summary: MonthlySpendingSummary) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  onOpenAddTransaction,
  onOpenReportModal,
}) => {
  const { transactions, categories, formatCurrency } = useBudget();
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'all'>('this_month');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [activeReportModal, setActiveReportModal] = useState<MonthlySpendingSummary | null>(null);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Current and last month prefixes
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Filtered transactions for selected period
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (period === 'this_month') return t.date.startsWith(currentMonthStr);
      if (period === 'last_month') return t.date.startsWith(lastMonthStr);
      return true;
    });
  }, [transactions, period, currentMonthStr, lastMonthStr]);

  const totalIncome = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  const totalExpense = useMemo(() => {
    return periodTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodTransactions]);

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of periodTransactions) {
      if (t.type === 'expense') {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      }
    }

    const items = Array.from(map.entries()).map(([catId, amount]) => {
      const cat = catMap.get(catId);
      const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
      return {
        id: catId,
        name: cat?.name || 'Uncategorized',
        icon: cat?.icon || 'Tag',
        color: cat?.color || '#64748b',
        amount,
        percentage,
      };
    });

    return items.sort((a, b) => b.amount - a.amount);
  }, [periodTransactions, catMap, totalExpense]);

  // Daily spending pattern (last 14 days)
  const dailySpending = useMemo(() => {
    const map = new Map<string, number>();
    const days: string[] = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      days.push(ds);
      map.set(ds, 0);
    }

    for (const t of periodTransactions) {
      if (t.type === 'expense' && map.has(t.date)) {
        map.set(t.date, (map.get(t.date) || 0) + t.amount);
      }
    }

    return days.map((ds) => ({
      date: ds,
      label: ds.substring(5), // MM-DD
      amount: map.get(ds) || 0,
    }));
  }, [periodTransactions]);

  const maxDaily = Math.max(1, ...dailySpending.map((d) => d.amount));

  // Top spending category
  const topCategory = categoryBreakdown[0];

  // SVG Donut Chart Calculation
  const donutSlices = useMemo(() => {
    let cumulative = 0;
    const radius = 65;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    return categoryBreakdown.map((item) => {
      const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
      const strokeDashoffset = -((cumulative / 100) * circumference);
      cumulative += item.percentage;
      return {
        ...item,
        strokeDasharray,
        strokeDashoffset,
        radius,
        strokeWidth,
      };
    });
  }, [categoryBreakdown]);

  return (
    <div className="space-y-6 pb-24">
      {/* Header & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Financial Insights</h1>
          <p className="text-xs text-slate-400">Spending breakdown & cashflow velocity</p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-xl self-start text-xs">
          {[
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'all', label: 'All Time' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                triggerHaptic('light');
                setPeriod(p.id as any);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === p.id
                  ? 'bg-slate-800 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>


      {/* Donut Chart & Category Breakdown */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Spending Distribution
          </h2>
          {topCategory && (
            <span className="text-xs text-slate-400">
              Top: <strong className="text-white">{topCategory.name}</strong> ({topCategory.percentage}%)
            </span>
          )}
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No expense data available for this timeframe.
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* SVG Donut */}
            <div className="relative w-48 h-48 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  className="text-slate-800"
                  strokeWidth="24"
                  stroke="currentColor"
                  fill="none"
                />
                {donutSlices.map((slice) => (
                  <circle
                    key={slice.id}
                    cx="80"
                    cy="80"
                    r={slice.radius}
                    strokeWidth={selectedCatId === slice.id ? 28 : slice.strokeWidth}
                    stroke={slice.color}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    fill="none"
                    className="transition-all duration-300 cursor-pointer hover:opacity-80"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedCatId(selectedCatId === slice.id ? null : slice.id);
                    }}
                  />
                ))}
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total Spent</span>
                <span className="text-sm font-bold text-white mt-0.5">
                  {formatCurrency(totalExpense, true)}
                </span>
              </div>
            </div>

            {/* Ranked List */}
            <div className="flex-1 w-full space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {categoryBreakdown.map((item) => {
                const isSelected = selectedCatId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedCatId(isSelected ? null : item.id);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800 border-emerald-500/50'
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                          style={{ backgroundColor: item.color }}
                        >
                          <CategoryIcon name={item.icon} size={12} />
                        </div>
                        <span className="font-medium text-white">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white">{formatCurrency(item.amount)}</span>
                        <span className="text-slate-400 text-[11px] ml-1.5">({item.percentage}%)</span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Daily Spending Trend Bars */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            14-Day Spending Velocity
          </h2>
          <span className="text-[11px] text-slate-400">Peak: {formatCurrency(maxDaily)}</span>
        </div>

        <div className="flex items-end justify-between h-36 pt-4 gap-1 sm:gap-2">
          {dailySpending.map((day) => {
            const heightPercent = maxDaily > 0 ? (day.amount / maxDaily) * 100 : 0;
            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center gap-1.5 group cursor-pointer"
                title={`${day.date}: ${formatCurrency(day.amount)}`}
              >
                <div className="w-full flex items-end justify-center h-28 bg-slate-950/50 rounded-lg p-0.5">
                  <div
                    className="w-full max-w-[14px] bg-emerald-500 group-hover:bg-emerald-400 rounded-sm transition-all duration-300"
                    style={{
                      height: `${Math.max(4, heightPercent)}%`,
                      opacity: day.amount > 0 ? 1 : 0.2,
                    }}
                  />
                </div>
                <span className="text-[9px] text-slate-500 rotate-45 sm:rotate-0 origin-left mt-1">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Spending Calendar View (At the very bottom of the page) */}
      <CalendarSpendingView
        transactions={transactions}
        categories={categories}
        currencySymbol={currentUser?.currency?.symbol || '$'}
        onOpenReport={(summary) => {
          if (onOpenReportModal) {
            onOpenReportModal(summary);
          } else {
            setActiveReportModal(summary);
          }
        }}
        onOpenAddTransaction={onOpenAddTransaction}
      />

      {/* Monthly Report Modal */}
      <MonthlyReportModal
        summary={activeReportModal}
        onClose={() => setActiveReportModal(null)}
        currencySymbol={currentUser?.currency?.symbol || '$'}
      />
    </div>
  );
};
