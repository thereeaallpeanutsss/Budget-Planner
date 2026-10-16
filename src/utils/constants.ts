import { Category, CurrencyConfig } from '../types/budget';

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'USD', symbol: '$', label: 'USD - US Dollar ($)', position: 'prefix' },
  { code: 'EUR', symbol: '€', label: 'EUR - Euro (€)', position: 'prefix' },
  { code: 'GBP', symbol: '£', label: 'GBP - British Pound (£)', position: 'prefix' },
  { code: 'JPY', symbol: '¥', label: 'JPY - Japanese Yen (¥)', position: 'prefix' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD - Canadian Dollar (CA$)', position: 'prefix' },
  { code: 'AUD', symbol: 'AU$', label: 'AUD - Australian Dollar (AU$)', position: 'prefix' },
  { code: 'CHF', symbol: 'CHF', label: 'CHF - Swiss Franc (CHF)', position: 'prefix' },
  { code: 'INR', symbol: '₹', label: 'INR - Indian Rupee (₹)', position: 'prefix' },
  { code: 'CNY', symbol: '¥', label: 'CNY - Chinese Yuan (¥)', position: 'prefix' },
  { code: 'BRL', symbol: 'R$', label: 'BRL - Brazilian Real (R$)', position: 'prefix' },
  { code: 'SEK', symbol: 'kr', label: 'SEK - Swedish Krona (kr)', position: 'suffix' },
  { code: 'NOK', symbol: 'kr', label: 'NOK - Norwegian Krone (kr)', position: 'suffix' },
];

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'cat_groceries', name: 'Groceries', icon: 'ShoppingCart', color: '#10b981', type: 'expense' },
  { id: 'cat_dining', name: 'Food & Dining', icon: 'Utensils', color: '#f97316', type: 'expense' },
  { id: 'cat_housing', name: 'Housing & Rent', icon: 'Home', color: '#6366f1', type: 'expense' },
  { id: 'cat_transport', name: 'Transport & Fuel', icon: 'Car', color: '#3b82f6', type: 'expense' },
  { id: 'cat_utilities', name: 'Bills & Utilities', icon: 'Zap', color: '#eab308', type: 'expense' },
  { id: 'cat_shopping', name: 'Shopping & Gear', icon: 'ShoppingBag', color: '#8b5cf6', type: 'expense' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'Film', color: '#ec4899', type: 'expense' },
  { id: 'cat_health', name: 'Health & Medical', icon: 'HeartPulse', color: '#ef4444', type: 'expense' },
  { id: 'cat_travel', name: 'Travel & Trips', icon: 'Plane', color: '#06b6d4', type: 'expense' },
  { id: 'cat_subs', name: 'Subscriptions', icon: 'CreditCard', color: '#a855f7', type: 'expense' },
  { id: 'cat_misc', name: 'General / Other', icon: 'CircleEllipsis', color: '#64748b', type: 'expense' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'cat_salary', name: 'Salary & Wages', icon: 'Briefcase', color: '#10b981', type: 'income' },
  { id: 'cat_freelance', name: 'Freelance & Side Gig', icon: 'Laptop', color: '#06b6d4', type: 'income' },
  { id: 'cat_investments', name: 'Investments & Returns', icon: 'TrendingUp', color: '#3b82f6', type: 'income' },
  { id: 'cat_gift', name: 'Gifts & Bonuses', icon: 'Gift', color: '#ec4899', type: 'income' },
  { id: 'cat_other_inc', name: 'Other Income', icon: 'Coins', color: '#eab308', type: 'income' },
];

export const DEFAULT_CATEGORIES: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];

export const AVATAR_OPTIONS = ['🦊', '🦉', '🐻', '🦁', '🐼', '🐯', '🚀', '⚡', '💎', '🌿', '☕', '🎨'];

export const COLOR_OPTIONS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f97316', // Orange
  '#eab308', // Amber
];
