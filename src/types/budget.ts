export type TransactionType = 'expense' | 'income';

export type RecurrenceInterval = 'weekly' | 'monthly' | 'yearly';

export interface UserPreferences {
  theme: 'dark' | 'light' | 'system';
  enableHaptics: boolean;
  requirePinOnResume: boolean;
  compactView: boolean;
  monthStartDay: number;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  label: string;
  position: 'prefix' | 'suffix';
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  avatar: string; // Emoji or monogram
  color: string;
  pin?: string; // 4-digit PIN or empty string if unprotected
  currency: CurrencyConfig;
  createdAt: string;
  lastActive: string;
  preferences: UserPreferences;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string; // Hex or Tailwind class
  type: TransactionType;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM (local time)
  note: string;
  isRecurring?: boolean;
  recurringInterval?: RecurrenceInterval;
  tags?: string[];
  createdAt: string;
}

export interface MonthlyCategoryStats {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percentage: number;
  priorAmount: number;
  changePercent: number;
}

export interface MonthlySpendingSummary {
  month: string; // YYYY-MM e.g. "2026-09"
  monthName: string; // "September 2026"
  reportGeneratedDate: string; // "2026-10-01"
  totalExpense: number;
  totalIncome: number;
  netSavings: number;
  savingsRate: number;
  dailyAverageSpend: number;
  transactionCount: number;
  topCategory?: {
    name: string;
    icon: string;
    color: string;
    amount: number;
    percentage: number;
  };
  priorMonthComparison: {
    priorMonth: string; // "2026-08"
    priorMonthName: string; // "August 2026"
    priorTotalExpense: number;
    priorTotalIncome: number;
    priorNetSavings: number;
    expenseDiff: number;
    expenseChangePercent: number;
    savingsDiff: number;
  };
  categoryBreakdown: MonthlyCategoryStats[];
  dailyTrend: {
    day: number;
    amount: number;
  }[];
  insights: string[];
  isDemoSummary?: boolean;
}

export interface BudgetLimit {
  id: string;
  userId: string;
  categoryId: string;
  monthlyLimit: number;
  period: 'monthly' | 'weekly';
  notifyAtPercent?: number; // e.g. 85
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  icon: string;
  color: string;
  completed: boolean;
  createdAt: string;
}

export interface RecurringSubscription {
  id: string;
  userId: string;
  name: string;
  amount: number;
  billingCycle: RecurrenceInterval;
  nextDueDate: string; // YYYY-MM-DD
  categoryId: string;
  isAutoPaid: boolean;
  active: boolean;
}

export interface UserAppData {
  profile: UserProfile;
  transactions: Transaction[];
  budgets: BudgetLimit[];
  goals: SavingsGoal[];
  subscriptions: RecurringSubscription[];
  categories: Category[];
  updatedAt: string;
}

export interface ZenithBackupFile {
  app: 'ZenithBudget';
  version: number;
  exportedAt: string;
  userCount: number;
  users: UserAppData[];
}
