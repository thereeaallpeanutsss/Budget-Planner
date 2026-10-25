import React, { useMemo, useState } from 'react';
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
  X,
  Check,
  RotateCcw,
  DollarSign,
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
  const { currentUser } = useAuth();

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
    monthlyIncome,
    totalActiveMonthlySubscriptions,
    formatCurrency,
    setMonthlyIncome,
    markSubscriptionPaid,
    deleteTransaction,
  } = useBudget();

  // Cashflow View Toggle (Monthly vs Weekly)
  const [cashflowPeriod, setCashflowPeriod] = useState<'monthly' | 'weekly'>('monthly');

  // Monthly Income Configuration Modal
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [incomeInput, setIncomeInput] = useState('');

  // Days remaining in current month
  const daysRemainingInMonth = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, lastDay - now.getDate());
  }, []);

  // Timeframe of one week: Monday to Sunday
  const weekTimeframe = useMemo(() => {
    const now = new Date();
    const day = now.getDay(); // 0 is Sun, 1 is Mon, ..., 6 is Sat
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    const endStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;

    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const label = `${monday.toLocaleDateString(undefined, options)} – ${sunday.toLocaleDateString(undefined, options)}`;

    return { startStr, endStr, label };
  }, []);

  // Weekly expenses: all expenses entered in this Monday-Sunday week
  const weeklyExpenses = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          t.date >= weekTimeframe.startStr &&
          t.date <= weekTimeframe.endStr
      )
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, weekTimeframe]);

  // Weekly income: (Total income or budget minus subscriptions) divided by 4 weeks
  // E.g. If budget/income is 870 and rent is 520, weekly available is 350 / 4 = 87.5
  const weeklyIncome = useMemo(() => {
    const base = totalIncome > 0 ? totalIncome : (budgetHealth.totalBudgeted > 0 ? budgetHealth.totalBudgeted : 0);
    const netAvailable = Math.max(0, base - totalActiveMonthlySubscriptions);
    return netAvailable / 4;
  }, [totalIncome, budgetHealth.totalBudgeted, totalActiveMonthlySubscriptions]);

  const weeklyNet = weeklyIncome - weeklyExpenses;

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const catMap = useMemo(() => {
    return new Map(categories.map((c) => [c.id, c]));
  }, [categories]);

  const handleOpenIncomeSettings = () => {
    triggerHaptic('light');
    const existing = monthlyIncome > 0 ? monthlyIncome : totalIncome;
    setIncomeInput(existing > 0 ? existing.toString() : '');
    setIsIncomeModalOpen(true);
  };

  const handleSaveMonthlyIncome = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(incomeInput);
    if (!isNaN(val) && val >= 0) {
      setMonthlyIncome(val);
      setIsIncomeModalOpen(false);
      triggerHaptic('success');
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

        {/* Quick Add Record Button */}
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

      {/* Hero Financial Health Card (Apple Glassmorphism Style) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800/90 to-emerald-950/40 border border-white/10 p-6 shadow-2xl space-y-4">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header Row: Title & Toggle */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
              {cashflowPeriod === 'monthly' ? 'Monthly Cashflow' : 'Weekly Cashflow (Mon–Sun)'}
            </span>

            {/* Monthly vs Weekly Cashflow Toggle */}
            <div className="flex items-center p-1 bg-slate-950/90 rounded-xl border border-slate-800 text-xs font-semibold select-none">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCashflowPeriod('monthly');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  cashflowPeriod === 'monthly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setCashflowPeriod('weekly');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  cashflowPeriod === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Weekly
              </button>
            </div>
          </div>

          {/* Main Net Amount */}
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              {formatCurrency(cashflowPeriod === 'monthly' ? netSavings : weeklyNet)}
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
              {cashflowPeriod === 'monthly' ? (
                <>
                  <span>{daysRemainingInMonth} days left in month</span>
                  {savingsRate > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">{savingsRate}% saved</span>
                    </>
                  )}
                </>
              ) : (
                <>
                  <span className="text-slate-300">Week: {weekTimeframe.label}</span>
                  <span>•</span>
                  <span className="text-slate-400">
                    Calculated as (Income − Fixed Bills) ÷ 4
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Income vs Expenses Counters */}
          {cashflowPeriod === 'monthly' ? (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div
                onClick={handleOpenIncomeSettings}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/40 cursor-pointer transition ios-touch-active group"
                title="Click to set recurring monthly income or view breakdown"
              >
                <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
                  <div className="flex items-center gap-1.5">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    <span className="font-semibold">Total Income</span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-emerald-300">Edit</span>
                </div>
                <div className="text-lg font-bold text-white truncate">
                  {formatCurrency(totalIncome)}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Tap to set recurring income
                </p>
              </div>

              <div
                onClick={() => onOpenAddModal('expense')}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-rose-500/40 cursor-pointer transition ios-touch-active"
              >
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="font-semibold">Total Expenses</span>
                </div>
                <div className="text-lg font-bold text-white truncate">
                  {formatCurrency(totalExpenses)}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  This month's spending
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div
                onClick={handleOpenIncomeSettings}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-emerald-500/40 cursor-pointer transition ios-touch-active"
              >
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span className="font-semibold">Weekly Income</span>
                </div>
                <div className="text-lg font-bold text-white truncate">
                  {formatCurrency(weeklyIncome)}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  (Income − Subs) ÷ 4
                </p>
              </div>

              <div
                onClick={() => onOpenAddModal('expense')}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 hover:border-rose-500/40 cursor-pointer transition ios-touch-active"
              >
                <div className="flex items-center gap-1.5 text-xs text-rose-400 mb-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="font-semibold">Weekly Expenses</span>
                </div>
                <div className="text-lg font-bold text-white truncate">
                  {formatCurrency(weeklyExpenses)}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Entered this week
                </p>
              </div>
            </div>
          )}
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

      {/* Monthly Baseline Income Configuration Modal */}
      {isIncomeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fade-in select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              triggerHaptic('light');
              setIsIncomeModalOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Monthly Income Setting</h3>
                  <p className="text-xs text-slate-400">Baseline recurring earnings</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setIsIncomeModalOpen(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Set your regular monthly baseline income (such as salary, stipend, or allowance). Zenith
              automatically renews and records this income on the <strong className="text-emerald-400">1st day of every month</strong>.
            </p>

            <form onSubmit={handleSaveMonthlyIncome} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Monthly Baseline Amount ({currentUser?.currency.code || 'USD'})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    placeholder="e.g. 870.00"
                    value={incomeInput}
                    onChange={(e) => setIncomeInput(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3.5 top-3.5 text-xs text-slate-400 font-semibold">
                    {currentUser?.currency.symbol || '$'} / month
                  </span>
                </div>
              </div>

              {/* Real-time Calculation Breakdown Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Automatic Cashflow Projection
                </span>

                <div className="flex items-center justify-between text-slate-300">
                  <span>Gross Monthly Baseline:</span>
                  <span className="font-bold text-white font-mono">
                    {formatCurrency(parseFloat(incomeInput) || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-purple-300 flex items-center gap-1">
                    <span>Fixed Subscriptions & Rent:</span>
                  </span>
                  <span className="font-bold text-purple-300 font-mono">
                    -{formatCurrency(totalActiveMonthlySubscriptions)}
                  </span>
                </div>

                <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-emerald-400 font-semibold">
                  <span>Remaining Available Variable Budget:</span>
                  <span className="font-bold text-white font-mono">
                    {formatCurrency(Math.max(0, (parseFloat(incomeInput) || 0) - totalActiveMonthlySubscriptions))}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                  <span>Weekly Budget Allowance (÷ 4):</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatCurrency(Math.max(0, (parseFloat(incomeInput) || 0) - totalActiveMonthlySubscriptions) / 4)}/week
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-400 flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Renews on the 1st of every month automatically (same day fixed bills are subtracted).</span>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-1.5 ios-touch-active"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Recurring Monthly Income</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsIncomeModalOpen(false);
                    onOpenAddModal('income');
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium transition"
                >
                  Record One-Time / Variable Income Instead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
