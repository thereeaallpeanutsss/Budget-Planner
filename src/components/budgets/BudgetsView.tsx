import React, { useState, useMemo } from 'react';
import { useBudget } from '../../context/BudgetContext';
import {
  PieChart,
  Plus,
  Sliders,
  Check,
  X,
  CreditCard,
  AlertCircle,
  Calendar,
  Trash2,
  Tag,
} from 'lucide-react';
import { CategoryIcon } from '../common/CategoryIcon';
import { triggerHaptic } from '../../services/storage';

interface BudgetsViewProps {
  onOpenCategoryManager?: () => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({ onOpenCategoryManager }) => {
  const {
    categories,
    budgets,
    transactions,
    subscriptions,
    budgetHealth,
    totalActiveMonthlySubscriptions,
    formatCurrency,
    setBudgetLimit,
    removeBudgetLimit,
    addSubscription,
    deleteSubscription,
    markSubscriptionPaid,
  } = useBudget();

  // Dialog states
  const [selectedCatForBudget, setSelectedCatForBudget] = useState<string | null>(null);
  const [limitInput, setLimitInput] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState<'monthly' | 'weekly'>('monthly');

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subDueDate, setSubDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [subCatId, setSubCatId] = useState('cat_subs');

  // Calculate current month expenses per category
  const currentMonth = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Timeframe of one week: Monday to Sunday
  // If one week begins in one month and ends in another, the weekly budget is still kept for the entire week and not recalculated before the week has ended.
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

  // Category expenses for the current Monday-Sunday week
  const weeklyCategorySpendMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense' && t.date >= weekTimeframe.startStr && t.date <= weekTimeframe.endStr) {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      }
    }
    return map;
  }, [transactions, weekTimeframe]);

  const categorySpendMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type === 'expense' && t.date.startsWith(currentMonth)) {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      }
    }
    return map;
  }, [transactions, currentMonth]);

  const expenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense');
  }, [categories]);

  const budgetMap = useMemo(() => {
    return new Map(budgets.map((b) => [b.categoryId, b]));
  }, [budgets]);

  // Weekly budget health: (monthly budget minus subscriptions) divided by 4
  const weeklyHealth = useMemo(() => {
    const netMonthlyBudget = Math.max(0, budgetHealth.totalBudgeted - totalActiveMonthlySubscriptions);
    const totalWeeklyBudget = netMonthlyBudget > 0 ? netMonthlyBudget / 4 : budgetHealth.totalBudgeted / 4;
    let totalWeeklySpentInBudgets = 0;
    for (const b of budgets) {
      totalWeeklySpentInBudgets += weeklyCategorySpendMap.get(b.categoryId) || 0;
    }
    const remaining = totalWeeklyBudget - totalWeeklySpentInBudgets;
    const percentUsed =
      totalWeeklyBudget > 0 ? Math.round((totalWeeklySpentInBudgets / totalWeeklyBudget) * 100) : 0;

    return {
      totalBudgeted: totalWeeklyBudget,
      totalSpentInBudgets: totalWeeklySpentInBudgets,
      remaining,
      percentUsed,
    };
  }, [budgetHealth.totalBudgeted, totalActiveMonthlySubscriptions, budgets, weeklyCategorySpendMap]);

  const activeHealth = budgetPeriod === 'weekly' ? weeklyHealth : budgetHealth;

  const handleOpenBudgetModal = (categoryId: string) => {
    triggerHaptic('light');
    setSelectedCatForBudget(categoryId);
    const existing = budgetMap.get(categoryId);
    setLimitInput(existing ? existing.monthlyLimit.toString() : '');
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatForBudget) return;
    const limit = parseFloat(limitInput);
    if (!isNaN(limit)) {
      setBudgetLimit(selectedCatForBudget, limit);
    }
    setSelectedCatForBudget(null);
  };

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(subAmount);
    if (!subName.trim() || isNaN(amount) || amount <= 0) return;

    addSubscription({
      name: subName.trim(),
      amount,
      billingCycle: subCycle,
      nextDueDate: subDueDate,
      categoryId: subCatId,
      isAutoPaid: true,
      active: true,
    });

    setSubName('');
    setSubAmount('');
    setIsSubModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Budgets & Limits</h1>
          <p className="text-xs text-slate-400">Track monthly caps and prevent overspending</p>
        </div>
      </div>

      {/* Overall Budget Overview Progress (Monthly vs Weekly Toggle) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Overall Budget Health
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
              {budgetPeriod === 'weekly' ? `Week: ${weekTimeframe.label}` : 'Monthly'}
            </span>
          </div>

          {/* Toggle between Monthly and Weekly Budget */}
          <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-semibold select-none">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setBudgetPeriod('monthly');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                budgetPeriod === 'monthly'
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
                setBudgetPeriod('weekly');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                budgetPeriod === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(activeHealth.totalSpentInBudgets)}
              <span className="text-sm font-normal text-slate-400 ml-1.5">
                of {formatCurrency(activeHealth.totalBudgeted)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {budgetPeriod === 'weekly'
                ? `Monday–Sunday timeframe: (Monthly Budget minus Subscriptions) ÷ 4.`
                : totalActiveMonthlySubscriptions > 0
                ? `Includes ${formatCurrency(totalActiveMonthlySubscriptions)} in fixed bills subtracted from the budget on the 1st of the month.`
                : `Total monthly spending limit across all active category budgets.`}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`text-sm font-bold ${
                activeHealth.percentUsed > 100
                  ? 'text-rose-400'
                  : activeHealth.percentUsed > 85
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {activeHealth.percentUsed}%
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeHealth.remaining >= 0
                ? `${formatCurrency(activeHealth.remaining)} left`
                : `${formatCurrency(Math.abs(activeHealth.remaining))} over budget`}
            </p>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              activeHealth.percentUsed > 100
                ? 'bg-rose-500'
                : activeHealth.percentUsed > 85
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, activeHealth.percentUsed)}%` }}
          />
        </div>
      </div>

      {/* Category Budgets Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Category Targets
          </h2>
          <div className="flex items-center gap-2">
            {onOpenCategoryManager && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onOpenCategoryManager();
                }}
                className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded-xl border border-slate-700/80 transition"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-400" />
                <span>Custom Categories</span>
              </button>
            )}
            <span className="text-xs text-slate-400 hidden sm:inline">
              {budgets.length} of {expenseCategories.length} configured
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expenseCategories.map((cat) => {
            const budget = budgetMap.get(cat.id);
            const monthlyLimit = budget?.monthlyLimit || 0;
            const limit = budgetPeriod === 'weekly' ? monthlyLimit / 4 : monthlyLimit;
            const spent =
              budgetPeriod === 'weekly'
                ? weeklyCategorySpendMap.get(cat.id) || 0
                : categorySpendMap.get(cat.id) || 0;
            const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
            const isOver = limit > 0 && spent > limit;

            return (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-white">{cat.name}</h3>
                      <p className="text-[11px] text-slate-400">
                        {monthlyLimit > 0
                          ? budgetPeriod === 'weekly'
                            ? `${formatCurrency(spent)} of ${formatCurrency(limit)} /wk`
                            : `${formatCurrency(spent)} of ${formatCurrency(limit)} /mo`
                          : 'No limit set'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenBudgetModal(cat.id)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/50 ios-touch-active"
                    title="Set Budget Limit"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>

                {limit > 0 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isOver ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                        {isOver ? `Over by ${formatCurrency(spent - limit)}` : `${formatCurrency(limit - spent)} left`}
                      </span>
                      <span
                        className={`font-semibold ${
                          isOver ? 'text-rose-400' : percent > 85 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOver ? 'bg-rose-500' : percent > 85 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenBudgetModal(cat.id)}
                    className="w-full py-1.5 rounded-xl border border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Set monthly limit
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Subscriptions & Fixed Bills Section */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              Subscriptions & Fixed Bills
            </h2>
            <p className="text-[11px] text-slate-400">Regular automated and manual subscriptions</p>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setIsSubModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl ios-touch-active font-medium"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bill</span>
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
            No recurring bills added yet. Track your Netflix, rent, gym, or phone bill!
          </div>
        ) : (
          <div className="space-y-2">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white">{sub.name}</h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span className="capitalize">{sub.billingCycle}</span>
                      <span>•</span>
                      <span>Next: {sub.nextDueDate}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white">
                    {formatCurrency(sub.amount)}
                  </span>
                  <button
                    onClick={() => markSubscriptionPaid(sub.id)}
                    title="Mark paid & advance cycle"
                    className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteSubscription(sub.id)}
                    title="Delete subscription"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Adjust Category Budget Modal */}
      {selectedCatForBudget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Set Monthly Budget Limit
              </h3>
              <button
                onClick={() => setSelectedCatForBudget(null)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Monthly Limit Amount
                </label>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  required
                  placeholder="e.g. 500"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    removeBudgetLimit(selectedCatForBudget);
                    setSelectedCatForBudget(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Remove Limit
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">New Recurring Subscription</h3>
              <button
                onClick={() => setIsSubModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSub} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Service / Bill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Spotify, Gym, Rent"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="15.99"
                    value={subAmount}
                    onChange={(e) => setSubAmount(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Billing Cycle</label>
                  <select
                    value={subCycle}
                    onChange={(e) => setSubCycle(e.target.value as 'monthly' | 'yearly')}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Next Due Date</label>
                <input
                  type="date"
                  required
                  value={subDueDate}
                  onChange={(e) => setSubDueDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md mt-2"
              >
                Create Recurring Bill
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
