import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  UserAppData,
  Category,
} from '../types/budget';
import {
  getAllUsers,
  getActiveUserId,
  setActiveUserId,
  getUserData,
  saveUserData,
  registerWithEmailPassword,
  loginWithEmailPassword,
  logoutUser,
  deleteUserAccount,
  addCustomCategory,
  updateCustomCategory,
  deleteCustomCategory,
  UserSummary,
  triggerHaptic,
  changeUserPassword,
  changeUserPin,
  adminLoginWithPassword,
  hashPassword,
} from '../services/storage';
import { SUPPORTED_CURRENCIES } from '../utils/constants';

const ADMIN_PASSCODE = 'abc123';
const ADMIN_MODE_STORAGE_KEY = 'zenith_admin_mode_active';

interface AuthContextType {
  users: UserSummary[];
  currentUser: UserProfile | null;
  userData: UserAppData | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  isLoading: boolean;
  isAdminMode: boolean;
  enterAdminMode: (passcode: string) => boolean;
  exitAdminMode: () => void;
  adminLoginToUser: (userId: string, password: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  updatePin: (oldPin: string, newPin: string) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    name: string,
    avatar?: string,
    color?: string,
    currencyCode?: string,
    seedDemo?: boolean
  ) => Promise<void>;
  logout: () => void;
  unlockWithPin: (pin: string) => boolean;
  unlockWithPassword: (password: string) => Promise<boolean>;
  lockApp: () => void;
  switchUser: (userId: string) => void;
  updateUserPreferences: (prefs: Partial<UserProfile['preferences']>) => void;
  updateProfileDetails: (details: { name: string; avatar: string; color: string; pin?: string }) => void;
  updateUserCurrency: (currencyCode: string) => void;
  removeAccount: (userId: string) => void;
  updateCurrentUserData: (updater: (prev: UserAppData) => UserAppData) => void;
  addCategory: (cat: Omit<Category, 'id' | 'isCustom'>) => void;
  updateCategoryItem: (cat: Category) => void;
  removeCategoryItem: (catId: string) => void;
  reloadAll: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_MODE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [userData, setUserData] = useState<UserAppData | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize accounts
  const loadAccounts = useCallback(async () => {
    const userSummaries = getAllUsers();
    setUsers(userSummaries);

    if (userSummaries.length === 0) {
      // Create initial starter demo user account with seed data
      try {
        const defaultData = await registerWithEmailPassword(
          'demo@zenith.local',
          'password123',
          'Alex Rivera',
          '🌿',
          '#10b981',
          'USD',
          true
        );
        setUsers(getAllUsers());
        setUserData(defaultData);
        setIsLocked(false);
      } catch (err) {
        console.error('Failed to create initial demo user', err);
      }
    } else {
      const activeId = getActiveUserId();
      if (activeId && userSummaries.some((u) => u.id === activeId)) {
        const data = getUserData(activeId);
        if (data) {
          setUserData(data);
          if (data.profile.pin && data.profile.preferences.requirePinOnResume) {
            setIsLocked(true);
          } else {
            setIsLocked(false);
          }
        } else {
          setUserData(null);
        }
      } else {
        // No active user selected (logged out)
        setUserData(null);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginWithEmailPassword(email, password);
    setUsers(getAllUsers());
    setUserData(data);
    setIsLocked(false);
    triggerHaptic('success');
  }, []);

  const signup = useCallback(
    async (
      email: string,
      password: string,
      name: string,
      avatar = '🌿',
      color = '#10b981',
      currencyCode = 'USD',
      seedDemo = true
    ) => {
      const data = await registerWithEmailPassword(
        email,
        password,
        name,
        avatar,
        color,
        currencyCode,
        seedDemo
      );
      setUsers(getAllUsers());
      setUserData(data);
      setIsLocked(false);
      triggerHaptic('success');
    },
    []
  );

  const logout = useCallback(() => {
    logoutUser();
    setUserData(null);
    setIsLocked(false);
    triggerHaptic('medium');
  }, []);

  const unlockWithPin = useCallback(
    (inputPin: string): boolean => {
      if (!userData) return false;
      if (!userData.profile.pin || userData.profile.pin === inputPin) {
        setIsLocked(false);
        triggerHaptic('success');
        return true;
      }
      triggerHaptic('warning');
      return false;
    },
    [userData]
  );

  const unlockWithPassword = useCallback(
    async (inputPassword: string): Promise<boolean> => {
      if (!userData) return false;
      if (userData.profile.passwordHash && userData.profile.passwordSalt) {
        const computed = await hashPassword(inputPassword, userData.profile.passwordSalt);
        if (computed === userData.profile.passwordHash) {
          setIsLocked(false);
          triggerHaptic('success');
          return true;
        }
      }
      triggerHaptic('warning');
      return false;
    },
    [userData]
  );

  const enterAdminMode = useCallback((passcode: string): boolean => {
    if (passcode.trim().toLowerCase() === ADMIN_PASSCODE.toLowerCase()) {
      setIsAdminMode(true);
      try {
        localStorage.setItem(ADMIN_MODE_STORAGE_KEY, 'true');
      } catch (e) {
        console.error(e);
      }
      triggerHaptic('success');
      return true;
    }
    triggerHaptic('warning');
    return false;
  }, []);

  const exitAdminMode = useCallback(() => {
    setIsAdminMode(false);
    try {
      localStorage.removeItem(ADMIN_MODE_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    triggerHaptic('light');
  }, []);

  const adminLoginToUser = useCallback(async (userId: string, password: string) => {
    const data = await adminLoginWithPassword(userId, password);
    setUsers(getAllUsers());
    setUserData(data);
    setIsLocked(false);
    triggerHaptic('success');
  }, []);

  const updatePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    if (!userData) throw new Error('No user is currently active.');
    const updated = await changeUserPassword(userData.profile.id, oldPassword, newPassword);
    setUserData(updated);
    setUsers(getAllUsers());
    triggerHaptic('success');
  }, [userData]);

  const updatePin = useCallback((oldPin: string, newPin: string) => {
    if (!userData) throw new Error('No user is currently active.');
    const updated = changeUserPin(userData.profile.id, oldPin, newPin);
    setUserData(updated);
    setUsers(getAllUsers());
    triggerHaptic('success');
  }, [userData]);

  const lockApp = useCallback(() => {
    if (userData?.profile.pin) {
      setIsLocked(true);
      triggerHaptic('medium');
    }
  }, [userData]);

  const switchUser = useCallback((targetUserId: string) => {
    const data = getUserData(targetUserId);
    if (data) {
      setActiveUserId(targetUserId);
      setUserData(data);
      if (data.profile.pin) {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
      triggerHaptic('light');
    }
  }, []);

  const updateCurrentUserData = useCallback((updater: (prev: UserAppData) => UserAppData) => {
    setUserData((prev) => {
      if (!prev) return null;
      const next = updater(prev);
      saveUserData(next);
      return next;
    });
  }, []);

  const updateUserPreferences = useCallback(
    (prefs: Partial<UserProfile['preferences']>) => {
      updateCurrentUserData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          preferences: {
            ...prev.profile.preferences,
            ...prefs,
          },
        },
      }));
    },
    [updateCurrentUserData]
  );

  const updateProfileDetails = useCallback(
    (details: { name: string; avatar: string; color: string; pin?: string }) => {
      updateCurrentUserData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          name: details.name.trim() || prev.profile.name,
          avatar: details.avatar || prev.profile.avatar,
          color: details.color || prev.profile.color,
          pin: details.pin !== undefined ? details.pin.trim() : prev.profile.pin,
        },
      }));
      setUsers(getAllUsers());
    },
    [updateCurrentUserData]
  );

  const updateUserCurrency = useCallback(
    (currencyCode: string) => {
      const found =
        SUPPORTED_CURRENCIES.find((c) => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
      updateCurrentUserData((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          currency: found,
        },
      }));
      setUsers(getAllUsers());
    },
    [updateCurrentUserData]
  );

  // Custom Categories
  const addCategory = useCallback(
    (cat: Omit<Category, 'id' | 'isCustom'>) => {
      if (!userData) return;
      const created = addCustomCategory(userData.profile.id, cat);
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              categories: [...prev.categories, created],
            }
          : null
      );
      triggerHaptic('success');
    },
    [userData]
  );

  const updateCategoryItem = useCallback(
    (cat: Category) => {
      if (!userData) return;
      updateCustomCategory(userData.profile.id, cat);
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              categories: prev.categories.map((c) => (c.id === cat.id ? cat : c)),
            }
          : null
      );
      triggerHaptic('light');
    },
    [userData]
  );

  const removeCategoryItem = useCallback(
    (catId: string) => {
      if (!userData) return;
      deleteCustomCategory(userData.profile.id, catId);
      setUserData((prev) =>
        prev
          ? {
              ...prev,
              categories: prev.categories.filter((c) => c.id !== catId),
            }
          : null
      );
      triggerHaptic('medium');
    },
    [userData]
  );

  const removeAccount = useCallback(
    (userId: string) => {
      deleteUserAccount(userId);
      loadAccounts();
    },
    [loadAccounts]
  );

  const reloadAll = useCallback(() => {
    loadAccounts();
  }, [loadAccounts]);

  return (
    <AuthContext.Provider
      value={{
        users,
        currentUser: userData?.profile || null,
        userData,
        isAuthenticated: Boolean(userData),
        isLocked,
        isLoading,
        isAdminMode,
        enterAdminMode,
        exitAdminMode,
        adminLoginToUser,
        updatePassword,
        updatePin,
        login,
        signup,
        logout,
        unlockWithPin,
        unlockWithPassword,
        lockApp,
        switchUser,
        updateUserPreferences,
        updateProfileDetails,
        updateUserCurrency,
        removeAccount,
        updateCurrentUserData,
        addCategory,
        updateCategoryItem,
        removeCategoryItem,
        reloadAll,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
