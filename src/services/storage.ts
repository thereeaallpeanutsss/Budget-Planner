import {
  UserProfile,
  UserAppData,
  ZenithBackupFile,
  Transaction,
  BudgetLimit,
  SavingsGoal,
  RecurringSubscription,
  Category,
} from '../types/budget';
import {
  DEFAULT_CATEGORIES,
  SUPPORTED_CURRENCIES,
} from '../utils/constants';

const USERS_INDEX_KEY = 'zenith_users_index_v1';
const ACTIVE_USER_ID_KEY = 'zenith_active_user_id';
const DATA_PREFIX = 'zenith_userdata_';

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  hasPin: boolean;
  hasPassword: boolean;
  currencySymbol: string;
  lastActive: string;
}

// Helper for iOS haptic feedback
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' = 'light') {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(20);
      else if (type === 'success') navigator.vibrate([12, 40, 15]);
      else if (type === 'warning') navigator.vibrate([30, 50, 30]);
    } catch {
      // Ignore vibration errors if blocked by browser policy
    }
  }
}

// Password hashing utility with Web Crypto API and fallback
export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${password}:${salt}`);
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const hashBuf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      // Fallback below
    }
  }
  // Deterministic fallback for environments without WebCrypto
  let h1 = 0xdeadbeef ^ password.length;
  let h2 = 0x41c6ce57 ^ salt.length;
  for (let i = 0; i < data.length; i++) {
    const ch = data[i];
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
}

export function getAllUsers(): UserSummary[] {
  try {
    const raw = localStorage.getItem(USERS_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load users index', e);
    return [];
  }
}

export function saveUsersIndex(users: UserSummary[]): void {
  try {
    localStorage.setItem(USERS_INDEX_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users index', e);
  }
}

export function getActiveUserId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveUserId(userId: string | null): void {
  try {
    if (userId) {
      localStorage.setItem(ACTIVE_USER_ID_KEY, userId);
    } else {
      localStorage.removeItem(ACTIVE_USER_ID_KEY);
    }
  } catch (e) {
    console.error('Failed to set active user', e);
  }
}

export function getUserData(userId: string): UserAppData | null {
  try {
    const raw = localStorage.getItem(`${DATA_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to get user data for ${userId}`, e);
    return null;
  }
}

export function saveUserData(data: UserAppData): void {
  try {
    const updated = {
      ...data,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(`${DATA_PREFIX}${data.profile.id}`, JSON.stringify(updated));

    // Update index summary
    const users = getAllUsers();
    const existingIndex = users.findIndex((u) => u.id === data.profile.id);
    const summary: UserSummary = {
      id: data.profile.id,
      name: data.profile.name,
      email: data.profile.email,
      avatar: data.profile.avatar,
      color: data.profile.color,
      hasPin: Boolean(data.profile.pin && data.profile.pin.trim().length > 0),
      hasPassword: Boolean(data.profile.passwordHash && data.profile.passwordHash.length > 0),
      currencySymbol: data.profile.currency?.symbol || '$',
      lastActive: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      users[existingIndex] = summary;
    } else {
      users.push(summary);
    }
    saveUsersIndex(users);
  } catch (e) {
    console.error('Failed to save user data', e);
  }
}

// Sign up with Email & Password
export async function registerWithEmailPassword(
  email: string,
  password: string,
  name: string,
  avatar = '✈️',
  color = '#10b981',
  currencyCode = 'USD',
  seedDemo = false
): Promise<UserAppData> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const allUsers = getAllUsers();
  if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new Error('An account with this email already exists on this device. Please log in.');
  }

  const salt = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const passwordHash = await hashPassword(password, salt);

  const currency =
    SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];

  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const profile: UserProfile = {
    id: userId,
    name: name.trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    passwordHash,
    passwordSalt: salt,
    avatar: avatar || '✈️',
    color: color || '#10b981',
    pin: '',
    currency,
    createdAt: now,
    lastActive: now,
    preferences: {
      theme: 'dark',
      enableHaptics: true,
      requirePinOnResume: false,
      compactView: false,
      monthStartDay: 1,
    },
  };

  const initialData: UserAppData = {
    profile,
    transactions: seedDemo ? generateSampleTransactions(userId) : [],
    budgets: seedDemo
      ? [
          {
            id: `bud_${Date.now()}_1`,
            userId,
            categoryId: 'cat_groceries',
            monthlyLimit: 450,
            period: 'monthly',
            notifyAtPercent: 85,
          },
          {
            id: `bud_${Date.now()}_2`,
            userId,
            categoryId: 'cat_dining',
            monthlyLimit: 250,
            period: 'monthly',
            notifyAtPercent: 85,
          },
          {
            id: `bud_${Date.now()}_3`,
            userId,
            categoryId: 'cat_housing',
            monthlyLimit: 1200,
            period: 'monthly',
            notifyAtPercent: 90,
          },
          {
            id: `bud_${Date.now()}_4`,
            userId,
            categoryId: 'cat_utilities',
            monthlyLimit: 150,
            period: 'monthly',
            notifyAtPercent: 85,
          },
          {
            id: `bud_${Date.now()}_5`,
            userId,
            categoryId: 'cat_shopping',
            monthlyLimit: 200,
            period: 'monthly',
            notifyAtPercent: 80,
          },
        ]
      : [],
    goals: seedDemo
      ? [
          {
            id: `goal_${Date.now()}_1`,
            userId,
            name: 'Emergency Fund',
            targetAmount: 3000,
            currentAmount: 1200,
            icon: 'ShieldCheck',
            color: '#10b981',
            completed: false,
            createdAt: now,
          },
          {
            id: `goal_${Date.now()}_2`,
            userId,
            name: 'Vacation & Travel',
            targetAmount: 1500,
            currentAmount: 650,
            targetDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
            icon: 'Plane',
            color: '#06b6d4',
            completed: false,
            createdAt: now,
          },
        ]
      : [],
    subscriptions: seedDemo
      ? [
          {
            id: `sub_${Date.now()}_1`,
            userId,
            name: 'iCloud & Storage',
            amount: 9.99,
            billingCycle: 'monthly',
            nextDueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
            categoryId: 'cat_subs',
            isAutoPaid: true,
            active: true,
          },
          {
            id: `sub_${Date.now()}_2`,
            userId,
            name: 'Fiber Internet',
            amount: 60.0,
            billingCycle: 'monthly',
            nextDueDate: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
            categoryId: 'cat_utilities',
            isAutoPaid: true,
            active: true,
          },
        ]
      : [],
    categories: seedDemo ? [...DEFAULT_CATEGORIES] : [],
    updatedAt: now,
  };

  saveUserData(initialData);
  setActiveUserId(userId);
  return initialData;
}

// Log in with Email & Password
export async function loginWithEmailPassword(
  email: string,
  password: string
): Promise<UserAppData> {
  const cleanEmail = email.trim().toLowerCase();
  const allUsers = getAllUsers();
  const summary = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!summary) {
    throw new Error('Account not found with this email. Please check your spelling or sign up.');
  }

  const userData = getUserData(summary.id);
  if (!userData) {
    throw new Error('Account profile could not be loaded from this device.');
  }

  if (userData.profile.passwordHash && userData.profile.passwordSalt) {
    const computed = await hashPassword(password, userData.profile.passwordSalt);
    if (computed !== userData.profile.passwordHash) {
      throw new Error('Incorrect password. Please try again.');
    }
  }

  setActiveUserId(userData.profile.id);
  userData.profile.lastActive = new Date().toISOString();
  saveUserData(userData);
  return userData;
}

// Log out
export function logoutUser(): void {
  setActiveUserId(null);
}

// Change user account password with old password verification
export async function changeUserPassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<UserAppData> {
  const data = getUserData(userId);
  if (!data) throw new Error('User profile not found.');

  if (data.profile.passwordHash && data.profile.passwordSalt) {
    const computed = await hashPassword(oldPassword, data.profile.passwordSalt);
    if (computed !== data.profile.passwordHash) {
      throw new Error('Current password is incorrect. Please enter your existing password.');
    }
  }

  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  const salt = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const passwordHash = await hashPassword(newPassword, salt);
  data.profile.passwordHash = passwordHash;
  data.profile.passwordSalt = salt;
  saveUserData(data);
  return data;
}

// Change user 4-digit PIN with old PIN verification
export function changeUserPin(
  userId: string,
  oldPin: string,
  newPin: string
): UserAppData {
  const data = getUserData(userId);
  if (!data) throw new Error('User profile not found.');

  if (data.profile.pin && data.profile.pin.trim().length > 0) {
    if (data.profile.pin.trim() !== oldPin.trim()) {
      throw new Error('Current 4-digit PIN is incorrect.');
    }
  }

  const cleanNewPin = newPin.trim();
  if (cleanNewPin && !/^\d{4}$/.test(cleanNewPin)) {
    throw new Error('PIN must be exactly 4 numeric digits (or blank to remove).');
  }

  data.profile.pin = cleanNewPin;
  saveUserData(data);
  return data;
}

// Admin login verification: only log in if the user's password is entered correctly
export async function adminLoginWithPassword(
  userId: string,
  password: string
): Promise<UserAppData> {
  const data = getUserData(userId);
  if (!data) throw new Error('User account not found on this device.');

  if (data.profile.passwordHash && data.profile.passwordSalt) {
    const computed = await hashPassword(password, data.profile.passwordSalt);
    if (computed !== data.profile.passwordHash) {
      throw new Error('Incorrect password. Admins cannot access user data without the user\'s valid password.');
    }
  }

  setActiveUserId(data.profile.id);
  data.profile.lastActive = new Date().toISOString();
  saveUserData(data);
  return data;
}


// Custom categories management
export function addCustomCategory(
  userId: string,
  cat: Omit<Category, 'id' | 'isCustom'>
): Category {
  const data = getUserData(userId);
  if (!data) throw new Error('User not found');

  const newCat: Category = {
    ...cat,
    id: `cat_custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    isCustom: true,
  };

  data.categories.push(newCat);
  saveUserData(data);
  return newCat;
}

export function updateCustomCategory(userId: string, cat: Category): void {
  const data = getUserData(userId);
  if (!data) return;

  data.categories = data.categories.map((c) => (c.id === cat.id ? cat : c));
  saveUserData(data);
}

export function deleteCustomCategory(userId: string, categoryId: string): void {
  const data = getUserData(userId);
  if (!data) return;

  data.categories = data.categories.filter((c) => c.id !== categoryId);
  saveUserData(data);
}

export function deleteUserAccount(userId: string): void {
  try {
    localStorage.removeItem(`${DATA_PREFIX}${userId}`);
    const users = getAllUsers().filter((u) => u.id !== userId);
    saveUsersIndex(users);

    const active = getActiveUserId();
    if (active === userId) {
      if (users.length > 0) {
        setActiveUserId(users[0].id);
      } else {
        setActiveUserId(null);
      }
    }
  } catch (e) {
    console.error('Failed to delete user account', e);
  }
}

export function generateSampleTransactions(userId: string): Transaction[] {
  const today = new Date();
  const formatDaysAgo = (days: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: `tx_${Date.now()}_1`,
      userId,
      type: 'income',
      amount: 3850,
      categoryId: 'cat_salary',
      date: formatDaysAgo(2),
      time: '09:00',
      note: 'Monthly Salary direct deposit',
      createdAt: new Date().toISOString(),
    },
    {
      id: `tx_${Date.now()}_2`,
      userId,
      type: 'expense',
      amount: 1200,
      categoryId: 'cat_housing',
      date: formatDaysAgo(3),
      time: '10:30',
      note: 'Apartment rent payment',
      createdAt: new Date().toISOString(),
    },
    {
      id: `tx_${Date.now()}_3`,
      userId,
      type: 'expense',
      amount: 86.4,
      categoryId: 'cat_groceries',
      date: formatDaysAgo(1),
      time: '14:15',
      note: 'Fresh organic groceries & produce',
      createdAt: new Date().toISOString(),
    },
    {
      id: `tx_${Date.now()}_4`,
      userId,
      type: 'expense',
      amount: 38.5,
      categoryId: 'cat_dining',
      date: formatDaysAgo(0),
      time: '19:45',
      note: 'Dinner & drinks with friends',
      createdAt: new Date().toISOString(),
    },
    {
      id: `tx_${Date.now()}_5`,
      userId,
      type: 'expense',
      amount: 45.0,
      categoryId: 'cat_transport',
      date: formatDaysAgo(4),
      time: '08:15',
      note: 'Metro card refill',
      createdAt: new Date().toISOString(),
    },
    {
      id: `tx_${Date.now()}_6`,
      userId,
      type: 'expense',
      amount: 62.15,
      categoryId: 'cat_groceries',
      date: formatDaysAgo(6),
      time: '16:50',
      note: 'Supermarket essentials',
      createdAt: new Date().toISOString(),
    },
    {
      id: `tx_${Date.now()}_7`,
      userId,
      type: 'expense',
      amount: 19.99,
      categoryId: 'cat_entertainment',
      date: formatDaysAgo(7),
      time: '20:30',
      note: 'Movie tickets',
      createdAt: new Date().toISOString(),
    },
    {
      id: `tx_${Date.now()}_8`,
      userId,
      type: 'income',
      amount: 450,
      categoryId: 'cat_freelance',
      date: formatDaysAgo(8),
      time: '15:20',
      note: 'Freelance client invoice paid',
      createdAt: new Date().toISOString(),
    },
    {
      id: `tx_${Date.now()}_9`,
      userId,
      type: 'expense',
      amount: 14.5,
      categoryId: 'cat_dining',
      date: formatDaysAgo(9),
      time: '09:45',
      note: 'Morning coffee & pastries',
      createdAt: new Date().toISOString(),
    },
    {
      id: `tx_${Date.now()}_10`,
      userId,
      type: 'expense',
      amount: 79.9,
      categoryId: 'cat_shopping',
      date: formatDaysAgo(11),
      time: '17:10',
      note: 'Fitness gear & shoes',
      createdAt: new Date().toISOString(),
    },
  ];
}

// Local Backup & Export Utilities
export function exportSingleUserBackup(userId: string): void {
  const data = getUserData(userId);
  if (!data) return;

  // Sanitized profile without password hashes for portable backup
  const cleanProfile = { ...data.profile };
  delete cleanProfile.passwordHash;
  delete cleanProfile.passwordSalt;

  const exportData: UserAppData = {
    ...data,
    profile: cleanProfile,
  };

  const backup: ZenithBackupFile = {
    app: 'ZenithBudget',
    version: 1,
    exportedAt: new Date().toISOString(),
    userCount: 1,
    users: [exportData],
  };

  downloadJSON(
    backup,
    `zenith-budget-${data.profile.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`
  );
}

export function exportAllUsersBackup(): void {
  const summaries = getAllUsers();
  const allUserData: UserAppData[] = [];

  for (const s of summaries) {
    const d = getUserData(s.id);
    if (d) {
      const clean = { ...d, profile: { ...d.profile } };
      delete clean.profile.passwordHash;
      delete clean.profile.passwordSalt;
      allUserData.push(clean);
    }
  }

  const backup: ZenithBackupFile = {
    app: 'ZenithBudget',
    version: 1,
    exportedAt: new Date().toISOString(),
    userCount: allUserData.length,
    users: allUserData,
  };

  downloadJSON(
    backup,
    `zenith-budget-all-accounts-${new Date().toISOString().split('T')[0]}.json`
  );
}

export function exportTransactionsToCSV(data: UserAppData): void {
  const headers = ['ID', 'Date', 'Type', 'Category', 'Amount', 'Currency', 'Note'];
  const catMap = new Map(data.categories.map((c) => [c.id, c.name]));

  const rows = data.transactions.map((t) => [
    `"${t.id}"`,
    `"${t.date}"`,
    `"${t.type}"`,
    `"${catMap.get(t.categoryId) || 'Other'}"`,
    t.amount.toFixed(2),
    `"${data.profile.currency?.code || 'USD'}"`,
    `"${(t.note || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `transactions-${data.profile.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadJSON(obj: unknown, filename: string) {
  const jsonStr = JSON.stringify(obj, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface RestorePreview {
  valid: boolean;
  app: string;
  version: number;
  exportedAt: string;
  accounts: {
    name: string;
    avatar: string;
    transactionCount: number;
    budgetCount: number;
    goalCount: number;
    categoryCount: number;
  }[];
  rawBackup: ZenithBackupFile;
}

export function parseAndValidateBackup(jsonString: string): RestorePreview {
  try {
    const parsed = JSON.parse(jsonString) as ZenithBackupFile;
    if (!parsed || parsed.app !== 'ZenithBudget' || !Array.isArray(parsed.users)) {
      throw new Error('Not a valid Zenith Budget backup file.');
    }

    const accounts = parsed.users.map((u) => ({
      name: u.profile?.name || 'Unnamed Account',
      avatar: u.profile?.avatar || '👤',
      transactionCount: u.transactions?.length || 0,
      budgetCount: u.budgets?.length || 0,
      goalCount: u.goals?.length || 0,
      categoryCount: u.categories?.length || 0,
    }));

    return {
      valid: true,
      app: parsed.app,
      version: parsed.version || 1,
      exportedAt: parsed.exportedAt || new Date().toISOString(),
      accounts,
      rawBackup: parsed,
    };
  } catch (e: any) {
    throw new Error(e.message || 'Corrupted or unreadable JSON file');
  }
}

export function restoreBackup(backup: ZenithBackupFile, mode: 'merge' | 'replace' = 'merge'): void {
  const currentUsers = mode === 'replace' ? [] : getAllUsers();

  for (const userAppData of backup.users) {
    if (!userAppData.profile || !userAppData.profile.id) continue;

    // Preserve existing password if user already exists
    const existing = getUserData(userAppData.profile.id);
    if (existing && existing.profile.passwordHash) {
      userAppData.profile.passwordHash = existing.profile.passwordHash;
      userAppData.profile.passwordSalt = existing.profile.passwordSalt;
    }

    // Ensure categories array has valid categories
    if (!userAppData.categories || userAppData.categories.length === 0) {
      userAppData.categories = [...DEFAULT_CATEGORIES];
    }

    // Save user data
    saveUserData(userAppData);

    // Ensure user is in index
    const exists = currentUsers.some((u) => u.id === userAppData.profile.id);
    if (!exists) {
      currentUsers.push({
        id: userAppData.profile.id,
        name: userAppData.profile.name,
        email: userAppData.profile.email,
        avatar: userAppData.profile.avatar,
        color: userAppData.profile.color,
        hasPin: Boolean(userAppData.profile.pin),
        hasPassword: Boolean(userAppData.profile.passwordHash),
        currencySymbol: userAppData.profile.currency?.symbol || '$',
        lastActive: new Date().toISOString(),
      });
    }
  }

  saveUsersIndex(currentUsers);
  if (backup.users.length > 0) {
    setActiveUserId(backup.users[0].profile.id);
  }
}
