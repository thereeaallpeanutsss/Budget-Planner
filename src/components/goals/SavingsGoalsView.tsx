import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import {
  Target,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  X,
  Trophy,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '../../services/storage';

export const SavingsGoalsView: React.FC = () => {
  const {
    goals,
    formatCurrency,
    addSavingsGoal,
    depositToGoal,
    withdrawFromGoal,
    deleteSavingsGoal,
  } = useBudget();

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goalColor, setGoalColor] = useState('#10b981');

  // Deposit / Withdraw modal state
  const [activeGoalForAction, setActiveGoalForAction] = useState<{
    id: string;
    type: 'deposit' | 'withdraw';
  } | null>(null);
  const [actionAmount, setActionAmount] = useState('');

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    const initial = parseFloat(initialAmount) || 0;
    if (!goalName.trim() || isNaN(target) || target <= 0) return;

    addSavingsGoal({
      name: goalName.trim(),
      targetAmount: target,
      currentAmount: initial,
      targetDate: targetDate || undefined,
      icon: 'PiggyBank',
      color: goalColor,
    });

    setGoalName('');
    setTargetAmount('');
    setInitialAmount('');
    setTargetDate('');
    setIsCreateOpen(false);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoalForAction) return;
    const amount = parseFloat(actionAmount);
    if (isNaN(amount) || amount <= 0) return;

    const goal = goals.find((g) => g.id === activeGoalForAction.id);

    if (activeGoalForAction.type === 'deposit') {
      depositToGoal(activeGoalForAction.id, amount);
      if (goal && goal.currentAmount + amount >= goal.targetAmount) {
        // Trigger celebratory confetti!
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } else {
      withdrawFromGoal(activeGoalForAction.id, amount);
    }

    setActionAmount('');
    setActiveGoalForAction(null);
  };

  const totalSavedAcrossGoals = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTargetAcrossGoals = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallPercentage =
    totalTargetAcrossGoals > 0
      ? Math.round((totalSavedAcrossGoals / totalTargetAcrossGoals) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Savings Goals</h1>
          <p className="text-xs text-slate-400">Put money aside for big dreams and emergency reserves</p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('light');
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-3.5 py-2 rounded-xl shadow-lg shadow-emerald-950/60 ios-touch-active"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
              Total Saved In Pots
            </span>
            <div className="text-2xl font-bold text-white mt-1">
              {formatCurrency(totalSavedAcrossGoals)}
              <span className="text-sm font-normal text-slate-400 ml-1.5">
                of {formatCurrency(totalTargetAcrossGoals)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-bold text-emerald-400">{overallPercentage}%</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {goals.filter((g) => g.completed).length} of {goals.length} completed
            </p>
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
            style={{ width: `${Math.min(100, overallPercentage)}%` }}
          />
        </div>
      </div>

      {/* Goals Cards Grid */}
      {goals.length === 0 ? (
        <div className="p-10 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">No savings goals yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Create your first pot to start setting money aside for holidays, tech, or emergencies.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-md"
          >
            Create Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const percent =
              goal.targetAmount > 0
                ? Math.round((goal.currentAmount / goal.targetAmount) * 100)
                : 0;
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="p-5 rounded-3xl bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 transition flex flex-col justify-between space-y-4 shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: goal.color }}
                      >
                        {goal.completed ? (
                          <Trophy className="w-5 h-5 text-amber-300 animate-pulse" />
                        ) : (
                          <Sparkles className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-white">{goal.name}</h3>
                        {goal.targetDate && (
                          <p className="text-[11px] text-slate-400">Target: {goal.targetDate}</p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => deleteSavingsGoal(goal.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div>
                      <span className="text-xl font-bold text-white">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">
                        / {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold ${
                        goal.completed ? 'text-emerald-400' : 'text-slate-300'
                      }`}
                    >
                      {percent}%
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-2">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, percent)}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    {goal.completed ? (
                      <span className="text-emerald-400 font-medium">Goal completed! 🏆</span>
                    ) : (
                      `${formatCurrency(remaining)} remaining to target`
                    )}
                  </p>
                </div>

                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveGoalForAction({ id: goal.id, type: 'deposit' });
                    }}
                    className="py-2 px-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-emerald-500/30 ios-touch-active"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                    Deposit
                  </button>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setActiveGoalForAction({ id: goal.id, type: 'withdraw' });
                    }}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/60 ios-touch-active"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Create Savings Goal</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vacation in Tokyo, Emergency Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Target Amount</label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="2500"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Starting Balance</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Target Date (Optional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Color Accent</label>
                <div className="flex gap-2">
                  {['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGoalColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        goalColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md mt-2"
              >
                Save Savings Goal
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Deposit / Withdraw Action Modal */}
      {activeGoalForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white capitalize">
                {activeGoalForAction.type} Funds
              </h3>
              <button
                onClick={() => setActiveGoalForAction(null)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Amount to transfer</label>
                <input
                  type="number"
                  step="any"
                  autoFocus
                  required
                  placeholder="0.00"
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                className={`w-full py-3 rounded-xl text-white font-medium text-xs shadow-md ${
                  activeGoalForAction.type === 'deposit'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-indigo-600 hover:bg-indigo-500'
                }`}
              >
                Confirm {activeGoalForAction.type}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
