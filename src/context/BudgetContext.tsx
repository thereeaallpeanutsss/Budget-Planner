import React, { createContext, useContext, useMemo } from 'react';
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
  budgetHealth: {
    totalBudgeted: number;
    totalSpentInBudgets: number;
    remaining: number;
    percentUsed: number;
  };
  budgetAlerts: BudgetAlert[];
  upcomingBills: UpcomingBillItem[];
  
  // Actions
  formatCurrency: (amount: number, compact?: boolean) => string;
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
  const { userData, updateCurrentUserData } = useAuth();

  const transactions = useMemo(() => userData?.transactions || [], [userData]);
  const budgets = useMemo(() => userData?.budgets || [], [userData]);
  const goals = useMemo(() => userData?.goals || [], [userData]);
  const subscriptions = useMemo(() => userData?.subscriptions || [], [userData]);
  const categories = useMemo(() => userData?.categories || [], [userData]);
  const currency = userData?.profile.currency;

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
      remaining,
      percentUsed,
    };
  }, [budgets, categorySpendMap]);

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
        budgetHealth,
        budgetAlerts,
        upcomingBills,
        formatCurrency,
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
