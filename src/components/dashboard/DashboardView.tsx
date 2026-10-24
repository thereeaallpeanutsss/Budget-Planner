import React, { useMemo } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Calendar,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Clock,
  PiggyBank,
  Award,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';
import { triggerHaptic } from '../../services/storage';
import { MonthlySpendingSummary } from '../../types/budget';
import { getMonthlySummaryForMonth } from '../../utils/monthlySummary';

interface DashboardViewProps {
  onOpenAddModal: (type?: 'expense' | 'income') => void;
  onNavigateTab: (tab: string) => void;
  onOpenAccountModal: () => void;
  onOpenReportModal?: (summary: MonthlySpendingSummary) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddModal,
  onNavigateTab,
  onOpenAccountModal,
  onOpenReportModal,
}) => {
  const {
    currentUser,
  } = useAuth();

  const {
    transactions,
    categories,
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    budgetHealth,
    budgetAlerts,
    upcomingBills,
    formatCurrency,
    markSubscriptionPaid,
    deleteTransaction,
  } = useBudget();

  // Days remaining in current month
  const daysRemainingInMonth = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, lastDay - now.getDate());
  }, []);

  // Safe daily spend allowance calculation
  const safeDailyAllowance = useMemo(() => {
    const remaining = Math.max(0, budgetHealth.remaining);
    return remaining / daysRemainingInMonth;
  }, [budgetHealth.remaining, daysRemainingInMonth]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const catMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  // Check if today is on the first 3 days of the month (or preview mode)
  const isFirstThreeDays = useMemo(() => {
    const day = new Date().getDate();
    return day <= 3;
  }, []);

  // Compute latest monthly summary for the prior month if user has prior month transactions
  const latestSummary = useMemo(() => {
    const now = new Date();
    const priorDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const priorMonthKey = `${priorDate.getFullYear()}-${String(priorDate.getMonth() + 1).padStart(2, '0')}`;

    const priorTxs = transactions.filter((t) => t.date.startsWith(priorMonthKey));
    if (priorTxs.length === 0) {
      return null;
    }
    return getMonthlySummaryForMonth(priorMonthKey, transactions, categories);
  }, [transactions, categories]);

  const handleOpenMonthlyReport = () => {
    if (latestSummary && onOpenReportModal) {
      triggerHaptic('success');
      onOpenReportModal(latestSummary);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Welcome & User Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAccountModal();
            }}
            className="relative flex items-center justify-center w-12 h-12 rounded-2xl shadow-md border border-white/10 ios-touch-active"
            style={{ backgroundColor: currentUser?.color || '#10b981' }}
          >
            <span className="text-2xl">{currentUser?.avatar || '👤'}</span>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400 font-medium">Local Vault</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Encrypted
              </span>
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight leading-tight">
              {currentUser?.name || 'My Budget'}
            </h1>
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenAddModal('expense');
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-3.5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 ios-touch-active"
        >
          <Plus className="w-4 h-4" />
          <span>Add Record</span>
        </button>
      </div>

      {/* Linked on the first 3 days of a month if prior month data exists */}
      {isFirstThreeDays && latestSummary && (
        <div
          onClick={handleOpenMonthlyReport}
          className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950/90 via-teal-950/70 to-slate-900 border border-emerald-500/40 shadow-xl cursor-pointer hover:border-emerald-400 transition ios-touch-active group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-sm">
                <Award className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Day 1–3 Featured Summary
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1 group-hover:text-emerald-300 transition">
                  {latestSummary.monthName} Monthly Spending Review
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-1">
                  Saved {formatCurrency(latestSummary.netSavings)} ({latestSummary.savingsRate}% rate) •{' '}
                  {latestSummary.priorMonthComparison.expenseChangePercent < 0
                    ? `${Math.abs(latestSummary.priorMonthComparison.expenseChangePercent)}% lower spend vs prior month`
                    : `+${latestSummary.priorMonthComparison.expenseChangePercent}% vs prior month`}
                  . Tap to view detailed comparison & graphs.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 font-semibold group-hover:translate-x-1 transition-transform shrink-0 pl-3">
              <span>Full Report</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Hero Financial Health Card (Apple Glassmorphism Style) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800/90 to-emerald-950/40 border border-white/10 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-medium tracking-wider text-slate-400">
              Net Cashflow (This Month)
            </span>
            <span
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                netSavings >= 0
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              {netSavings >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              <span>{savingsRate}% saved</span>
            </span>
          </div>

          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {formatCurrency(netSavings)}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>{daysRemainingInMonth} days left in billing cycle</span>
              <span>•</span>
              <span className="text-emerald-400">
                Daily safe spend: {formatCurrency(safeDailyAllowance)}/day
              </span>
            </p>
          </div>

          {/* Income vs Expenses Quick Counters */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div
              onClick={() => onOpenAddModal('income')}
              className="p-3 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-emerald-500/30 cursor-pointer transition ios-touch-active"
            >
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Total Income</span>
              </div>
              <div className="text-lg font-bold text-white truncate">
                {formatCurrency(totalIncome)}
              </div>
            </div>

            <div
              onClick={() => onOpenAddModal('expense')}
              className="p-3 rounded-2xl bg-slate-950/50 border border-white/5 hover:border-rose-500/30 cursor-pointer transition ios-touch-active"
            >
              <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Total Expenses</span>
              </div>
              <div className="text-lg font-bold text-white truncate">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Warnings / Alert Pill */}
      {budgetAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Budget Alerts ({budgetAlerts.length})</span>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-0.5"
            >
              Adjust limits <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-1.5">
            {budgetAlerts.slice(0, 2).map((alert) => (
              <div
                key={alert.categoryId}
                className="flex items-center justify-between text-xs text-slate-300 bg-slate-900/60 p-2 rounded-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: alert.color }} />
                  <span className="font-medium text-white">{alert.categoryName}</span>
                </div>
                <div className="text-right">
                  <span className={alert.isOver ? 'text-rose-400 font-bold' : 'text-amber-400'}>
                    {alert.percentage}% used
                  </span>
                  <span className="text-slate-500 text-[10px] ml-1.5">
                    ({formatCurrency(alert.spent)} / {formatCurrency(alert.limit)})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bills & Subscriptions */}
      {upcomingBills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Upcoming Subscriptions & Bills
            </h2>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs text-slate-400 hover:text-white"
            >
              See all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingBills.slice(0, 2).map((bill) => (
              <div
                key={bill.id}
                className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                    style={{ backgroundColor: bill.categoryColor }}
                  >
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">{bill.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      Due in {bill.daysRemaining <= 0 ? 'today' : `${bill.daysRemaining} days`} ({bill.nextDueDate})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {formatCurrency(bill.amount)}
                  </span>
                  <button
                    onClick={() => markSubscriptionPaid(bill.id)}
                    title="Mark bill as paid"
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 ios-touch-active"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Recent Activity
          </h2>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-0.5"
          >
            All records <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
              <PiggyBank className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">No transactions recorded yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Tap the "Add Record" button above to log your first income or expense!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const cat = catMap.get(tx.categoryId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: cat?.color || '#64748b' }}
                    >
                      <CategoryIcon name={cat?.icon || 'Tag'} size={18} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {cat?.name || 'General'}
                        </span>
                        {tx.isRecurring && (
                          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full font-medium">
                            Recurring
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {tx.note || tx.date}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-3">
                    <div
                      className={`text-sm font-bold ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </div>
                    <div className="text-[10px] text-slate-500">{tx.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
