import React, { createContext, useContext, useMemo, useEffect } from 'react';
import {
  Transaction,
  BudgetLimit,
  SavingsGoal,
  RecurringSubscription,
  Category,
  TransactionType,
} from '../types/budget';
import { useAuth } from './AuthContext';
import { generateSampleTransactions, triggerHaptic } from '../services/storage';

export interface BudgetAlert {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  color: string;
  spent: number;
  limit: number;
  percentage: number;
  isOver: boolean;
}

export interface UpcomingBillItem {
  id: string;
  name: string;
  amount: number;
  nextDueDate: string;
  daysRemaining: number;
  isAutoPaid: boolean;
  categoryName: string;
  categoryColor: string;
}

interface BudgetContextType {
  transactions: Transaction[];
  budgets: BudgetLimit[];
  goals: SavingsGoal[];
  subscriptions: RecurringSubscription[];
  categories: Category[];
  
  // Computed metrics
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number; // 0 - 100
  allTimeNet: number;
  monthlyIncome: number;
  totalActiveMonthlySubscriptions: number;
  budgetHealth: {
    totalBudgeted: number;
    totalSpentInBudgets: number;
    totalSubscriptions: number;
    remaining: number;
    percentUsed: number;
  };
  budgetAlerts: BudgetAlert[];
  upcomingBills: UpcomingBillItem[];
  
  // Actions
  formatCurrency: (amount: number, compact?: boolean) => string;
  setMonthlyIncome: (amount: number) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => void;
  updateTransaction: (tx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  setBudgetLimit: (categoryId: string, monthlyLimit: number) => void;
  removeBudgetLimit: (categoryId: string) => void;
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'completed'>) => void;
  depositToGoal: (goalId: string, amount: number) => void;
  withdrawFromGoal: (goalId: string, amount: number) => void;
  deleteSavingsGoal: (goalId: string) => void;
  addSubscription: (sub: Omit<RecurringSubscription, 'id' | 'userId'>) => void;
  deleteSubscription: (subId: string) => void;
  markSubscriptionPaid: (subId: string) => void;
  loadDemoSeedData: () => void;
}

const BudgetContext = createContext<BudgetContextType | null>(null);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userData, updateCurrentUserData, updateUserPreferences } = useAuth();

  const transactions = useMemo(() => userData?.transactions || [], [userData]);
  const budgets = useMemo(() => userData?.budgets || [], [userData]);
  const goals = useMemo(() => userData?.goals || [], [userData]);
  const subscriptions = useMemo(() => userData?.subscriptions || [], [userData]);
  const categories = useMemo(() => userData?.categories || [], [userData]);
  const currency = userData?.profile.currency;

  const monthlyIncome = useMemo(() => {
    return userData?.profile.preferences.monthlyIncome || 0;
  }, [userData]);

  const totalActiveMonthlySubscriptions = useMemo(() => {
    return subscriptions
      .filter((s) => s.active)
      .reduce((acc, s) => {
        if (s.billingCycle === 'monthly') return acc + s.amount;
        if (s.billingCycle === 'yearly') return acc + (s.amount / 12);
        if (s.billingCycle === 'weekly') return acc + (s.amount * 4);
        return acc + s.amount;
      }, 0);
  }, [subscriptions]);

  const formatCurrency = (amount: number, compact = false): string => {
    const symbol = currency?.symbol || '$';
    const position = currency?.position || 'prefix';
    const isNegative = amount < 0;
    const absVal = Math.abs(amount);

    let formattedVal: string;
    if (compact && absVal >= 1000000) {
      formattedVal = (absVal / 1000000).toFixed(1) + 'M';
    } else if (compact && absVal >= 10000) {
      formattedVal = (absVal / 1000).toFixed(1) + 'k';
    } else {
      formattedVal = absVal.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }

    const withSymbol =
      position === 'prefix' ? `${symbol}${formattedVal}` : `${formattedVal} ${symbol}`;
    return isNegative ? `-${withSymbol}` : withSymbol;
  };

  // Filter current month transactions
  const currentMonthPrefix = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }, []);

  // Auto-renew monthly baseline income on the 1st of every month
  // and ensure active subscriptions appear on their date in every month
  useEffect(() => {
    if (!userData) return;

    let hasChanges = false;
    let updatedTxs = [...userData.transactions];

    // 1. Auto-renew monthly base income on the 1st of current month
    const baseIncome = userData.profile.preferences.monthlyIncome;
    if (baseIncome && baseIncome > 0) {
      const hasIncomeThisMonth = updatedTxs.some(
        (t) =>
          t.id === `tx_income_${currentMonthPrefix}` ||
          (t.type === 'income' &&
            t.isRecurring &&
            t.date.startsWith(currentMonthPrefix) &&
            t.note.includes('Monthly Base Income'))
      );
      if (!hasIncomeThisMonth) {
        const salaryCat =
          userData.categories.find((c) => c.type === 'income') || userData.categories[0];
        const newIncomeTx: Transaction = {
          id: `tx_income_${currentMonthPrefix}`,
          userId: userData.profile.id,
          type: 'income',
          amount: baseIncome,
          categoryId: salaryCat?.id || 'cat_salary',
          date: `${currentMonthPrefix}-01`,
          time: '08:00',
          note: 'Monthly Base Income',
          isRecurring: true,
          recurringInterval: 'monthly',
          createdAt: `${currentMonthPrefix}-01T08:00:00.000Z`,
        };
        updatedTxs = [newIncomeTx, ...updatedTxs];
        hasChanges = true;
      }
    }

    // 2. Ensure every active recurring subscription appears on its set date in every month
    for (const sub of userData.subscriptions) {
      if (!sub.active) continue;
      const dayStr = sub.nextDueDate ? sub.nextDueDate.split('-')[2] || '01' : '01';
      const scheduledDate = `${currentMonthPrefix}-${dayStr.padStart(2, '0')}`;
      const subTxId = `tx_sub_${sub.id}_${currentMonthPrefix}`;

      const hasSubThisMonth = updatedTxs.some(
        (t) =>
          t.id === subTxId ||
          (t.type === 'expense' &&
            t.isRecurring &&
            t.date.startsWith(currentMonthPrefix) &&
            t.note.toLowerCase().includes(sub.name.toLowerCase()))
      );

      if (!hasSubThisMonth) {
        const autoSubTx: Transaction = {
          id: subTxId,
          userId: userData.profile.id,
          type: 'expense',
          amount: sub.amount,
          categoryId: sub.categoryId || 'cat_subs',
          date: scheduledDate,
          time: '09:00',
          note: `Recurring: ${sub.name}`,
          isRecurring: true,
          recurringInterval: sub.billingCycle,
          createdAt: `${scheduledDate}T09:00:00.000Z`,
        };
        updatedTxs = [autoSubTx, ...updatedTxs];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      updateCurrentUserData((prev) => ({
        ...prev,
        transactions: updatedTxs,
      }));
    }
  }, [userData?.profile.id, currentMonthPrefix, userData?.subscriptions, userData?.profile.preferences.monthlyIncome]);

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(currentMonthPrefix));
  }, [transactions, currentMonthPrefix]);

  const totalIncome = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const totalExpenses = useMemo(() => {
    return currentMonthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [currentMonthTransactions]);

  const netSavings = totalIncome - totalExpenses;

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    const rate = Math.round((netSavings / totalIncome) * 100);
    return Math.max(0, Math.min(100, rate));
  }, [totalIncome, netSavings]);

  const allTimeNet = useMemo(() => {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }, [transactions]);

  // Budget calculations
  const categorySpendMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of currentMonthTransactions) {
      if (t.type === 'expense') {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      }
    }
    return map;
  }, [currentMonthTransactions]);

  const budgetHealth = useMemo(() => {
    const totalBudgeted = budgets.reduce((acc, b) => acc + b.monthlyLimit, 0);
    let totalSpentInBudgets = 0;
    for (const b of budgets) {
      totalSpentInBudgets += categorySpendMap.get(b.categoryId) || 0;
    }
    const remaining = totalBudgeted - totalSpentInBudgets;
    const percentUsed = totalBudgeted > 0 ? Math.round((totalSpentInBudgets / totalBudgeted) * 100) : 0;
    return {
      totalBudgeted,
      totalSpentInBudgets,
      totalSubscriptions: totalActiveMonthlySubscriptions,
      remaining,
      percentUsed,
    };
  }, [budgets, categorySpendMap, totalActiveMonthlySubscriptions]);

  const budgetAlerts = useMemo((): BudgetAlert[] => {
    const alerts: BudgetAlert[] = [];
    const catMap = new Map(categories.map((c) => [c.id, c]));

    for (const b of budgets) {
      const spent = categorySpendMap.get(b.categoryId) || 0;
      const pct = b.monthlyLimit > 0 ? Math.round((spent / b.monthlyLimit) * 100) : 0;
      const warnThreshold = b.notifyAtPercent || 85;

      if (pct >= warnThreshold) {
        const cat = catMap.get(b.categoryId);
        alerts.push({
          categoryId: b.categoryId,
          categoryName: cat?.name || 'Category',
          categoryIcon: cat?.icon || 'Folder',
          color: cat?.color || '#ef4444',
          spent,
          limit: b.monthlyLimit,
          percentage: pct,
          isOver: spent > b.monthlyLimit,
        });
      }
    }
    return alerts.sort((a, b) => b.percentage - a.percentage);
  }, [budgets, categorySpendMap, categories]);

  const upcomingBills = useMemo((): UpcomingBillItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const catMap = new Map(categories.map((c) => [c.id, c]));

    return subscriptions
      .filter((s) => s.active)
      .map((s) => {
        const dueDate = new Date(s.nextDueDate);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const cat = catMap.get(s.categoryId);

        return {
          id: s.id,
          name: s.name,
          amount: s.amount,
          nextDueDate: s.nextDueDate,
          daysRemaining: diffDays,
          isAutoPaid: s.isAutoPaid,
          categoryName: cat?.name || 'Bills',
          categoryColor: cat?.color || '#a855f7',
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [subscriptions, categories]);

  // Actions
  const setMonthlyIncome = (amount: number) => {
    if (!userData) return;
    const num = Math.max(0, amount);
    updateUserPreferences({ monthlyIncome: num });

    const salaryCategory =
      userData.categories.find((c) => c.type === 'income') || userData.categories[0];
    const txId = `tx_income_${currentMonthPrefix}`;

    updateCurrentUserData((prev) => {
      const existingIdx = prev.transactions.findIndex(
        (t) =>
          t.id === txId ||
          (t.type === 'income' &&
            t.isRecurring &&
            t.date.startsWith(currentMonthPrefix) &&
            t.note.includes('Monthly Base Income'))
      );

      let updatedTxs = [...prev.transactions];
      if (existingIdx >= 0) {
        if (num > 0) {
          updatedTxs[existingIdx] = {
            ...updatedTxs[existingIdx],
            amount: num,
          };
        } else {
          updatedTxs.splice(existingIdx, 1);
        }
      } else if (num > 0) {
        const newIncomeTx: Transaction = {
          id: txId,
          userId: prev.profile.id,
          type: 'income',
          amount: num,
          categoryId: salaryCategory?.id || 'cat_salary',
          date: `${currentMonthPrefix}-01`,
          time: '08:00',
          note: 'Monthly Base Income',
          isRecurring: true,
          recurringInterval: 'monthly',
          createdAt: new Date().toISOString(),
        };
        updatedTxs = [newIncomeTx, ...updatedTxs];
      }

      return {
        ...prev,
        transactions: updatedTxs,
        profile: {
          ...prev.profile,
          preferences: {
            ...prev.profile.preferences,
            monthlyIncome: num,
          },
        },
      };
    });
    triggerHaptic('success');
  };

  const addTransaction = (tx: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    if (!userData) return;
    const now = new Date();
    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newTx: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: userData.profile.id,
      time: tx.time || defaultTime,
      createdAt: now.toISOString(),
    };

    updateCurrentUserData((prev) => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
    triggerHaptic('success');
  };

  const updateTransaction = (tx: Transaction) => {
    updateCurrentUserData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) => (t.id === tx.id ? tx : t)),
    }));
    triggerHaptic('light');
  };

  const deleteTransaction = (id: string) => {
    updateCurrentUserData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
    triggerHaptic('medium');
  };

  const setBudgetLimit = (categoryId: string, monthlyLimit: number) => {
    if (!userData) return;
    updateCurrentUserData((prev) => {
      const existing = prev.budgets.findIndex((b) => b.categoryId === categoryId);
      let updatedBudgets = [...prev.budgets];

      if (existing >= 0) {
        if (monthlyLimit <= 0) {
          updatedBudgets = updatedBudgets.filter((b) => b.categoryId !== categoryId);
        } else {
          updatedBudgets[existing] = {
            ...updatedBudgets[existing],
            monthlyLimit,
          };
        }
      } else if (monthlyLimit > 0) {
        updatedBudgets.push({
          id: `bud_${Date.now()}`,
          userId: userData.profile.id,
          categoryId,
          monthlyLimit,
          period: 'monthly',
          notifyAtPercent: 85,
        });
      }

      return {
        ...prev,
        budgets: updatedBudgets,
      };
    });
    triggerHaptic('light');
  };

  const removeBudgetLimit = (categoryId: string) => {
    updateCurrentUserData((prev) => ({
      ...prev,
      budgets: prev.budgets.filter((b) => b.categoryId !== categoryId),
    }));
    triggerHaptic('medium');
  };

  const addSavingsGoal = (
    goal: Omit<SavingsGoal, 'id' | 'userId' | 'createdAt' | 'completed'>
  ) => {
    if (!userData) return;
    const newGoal: SavingsGoal = {
      ...goal,
      id: `goal_${Date.now()}`,
      userId: userData.profile.id,
      completed: goal.currentAmount >= goal.targetAmount,
      createdAt: new Date().toISOString(),
    };
    updateCurrentUserData((prev) => ({
      ...prev,
      goals: [...prev.goals, newGoal],
    }));
    triggerHaptic('success');
  };

  const depositToGoal = (goalId: string, amount: number) => {
    updateCurrentUserData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const newAmt = g.currentAmount + amount;
        return {
          ...g,
          currentAmount: newAmt,
          completed: newAmt >= g.targetAmount,
        };
      }),
    }));
    triggerHaptic('success');
  };

  const withdrawFromGoal = (goalId: string, amount: number) => {
    updateCurrentUserData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const newAmt = Math.max(0, g.currentAmount - amount);
        return {
          ...g,
          currentAmount: newAmt,
          completed: newAmt >= g.targetAmount,
        };
      }),
    }));
    triggerHaptic('light');
  };

  const deleteSavingsGoal = (goalId: string) => {
    updateCurrentUserData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== goalId),
    }));
    triggerHaptic('medium');
  };

  const addSubscription = (sub: Omit<RecurringSubscription, 'id' | 'userId'>) => {
    if (!userData) return;
    const newSub: RecurringSubscription = {
      ...sub,
      id: `sub_${Date.now()}`,
      userId: userData.profile.id,
    };
    updateCurrentUserData((prev) => ({
      ...prev,
      subscriptions: [...prev.subscriptions, newSub],
    }));
    triggerHaptic('light');
  };

  const deleteSubscription = (subId: string) => {
    updateCurrentUserData((prev) => ({
      ...prev,
      subscriptions: prev.subscriptions.filter((s) => s.id !== subId),
    }));
    triggerHaptic('medium');
  };

  const markSubscriptionPaid = (subId: string) => {
    if (!userData) return;
    const sub = subscriptions.find((s) => s.id === subId);
    if (!sub) return;

    // Advance next due date by 1 month or cycle
    const currentDue = new Date(sub.nextDueDate);
    if (sub.billingCycle === 'monthly') {
      currentDue.setMonth(currentDue.getMonth() + 1);
    } else if (sub.billingCycle === 'yearly') {
      currentDue.setFullYear(currentDue.getFullYear() + 1);
    } else {
      currentDue.setDate(currentDue.getDate() + 7);
    }
    const nextDueStr = currentDue.toISOString().split('T')[0];

    // Also optionally record expense transaction automatically
    const autoTx: Transaction = {
      id: `tx_${Date.now()}`,
      userId: userData.profile.id,
      type: 'expense',
      amount: sub.amount,
      categoryId: sub.categoryId,
      date: new Date().toISOString().split('T')[0],
      note: `Recurring: ${sub.name}`,
      isRecurring: true,
      recurringInterval: sub.billingCycle,
      createdAt: new Date().toISOString(),
    };

    updateCurrentUserData((prev) => ({
      ...prev,
      transactions: [autoTx, ...prev.transactions],
      subscriptions: prev.subscriptions.map((s) =>
        s.id === subId ? { ...s, nextDueDate: nextDueStr } : s
      ),
    }));
    triggerHaptic('success');
  };

  const loadDemoSeedData = () => {
    if (!userData) return;
    const sampleTxs = generateSampleTransactions(userData.profile.id);
    updateCurrentUserData((prev) => ({
      ...prev,
      transactions: [...sampleTxs, ...prev.transactions],
    }));
    triggerHaptic('success');
  };

  return (
    <BudgetContext.Provider
      value={{
        transactions,
        budgets,
        goals,
        subscriptions,
        categories,
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
        allTimeNet,
        monthlyIncome,
        totalActiveMonthlySubscriptions,
        budgetHealth,
        budgetAlerts,
        upcomingBills,
        formatCurrency,
        setMonthlyIncome,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        setBudgetLimit,
        removeBudgetLimit,
        addSavingsGoal,
        depositToGoal,
        withdrawFromGoal,
        deleteSavingsGoal,
        addSubscription,
        deleteSubscription,
        markSubscriptionPaid,
        loadDemoSeedData,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
