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
} from '../services/storage';
import { SUPPORTED_CURRENCIES } from '../utils/constants';

interface AuthContextType {
  users: UserSummary[];
  currentUser: UserProfile | null;
  userData: UserAppData | null;
  isAuthenticated: boolean;
  isLocked: boolean;
  isLoading: boolean;
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
        login,
        signup,
        logout,
        unlockWithPin,
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
