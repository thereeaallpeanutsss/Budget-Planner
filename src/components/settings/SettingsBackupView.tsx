import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBudget } from '../../context/BudgetContext';
import {
  ShieldCheck,
  Download,
  Upload,
  Lock,
  Unlock,
  Users,
  HardDrive,
  FileSpreadsheet,
  Smartphone,
  Sparkles,
  AlertTriangle,
  Check,
  CheckCircle2,
  RefreshCw,
  Globe,
  Share2,
  LogOut,
  Tag,
  KeyRound,
  ShieldAlert,
  Eye,
  EyeOff,
  LogIn,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  exportSingleUserBackup,
  exportAllUsersBackup,
  exportTransactionsToCSV,
  parseAndValidateBackup,
  restoreBackup,
  RestorePreview,
  triggerHaptic,
  UserSummary,
} from '../../services/storage';
import { SUPPORTED_CURRENCIES, AVATAR_OPTIONS, COLOR_OPTIONS } from '../../utils/constants';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface SettingsBackupViewProps {
  onOpenAccountModal: () => void;
  onOpenIOSGuide: () => void;
  onOpenCategoryManager?: () => void;
}

export const SettingsBackupView: React.FC<SettingsBackupViewProps> = ({
  onOpenAccountModal,
  onOpenIOSGuide,
  onOpenCategoryManager,
}) => {
  const {
    currentUser,
    users,
    lockApp,
    logout,
    updateProfileDetails,
    updateUserCurrency,
    updateUserPreferences,
    userData,
    reloadAll,
    isAdminMode,
    enterAdminMode,
    exitAdminMode,
    adminLoginToUser,
    updatePassword,
    updatePin,
  } = useAuth();

  const { loadDemoSeedData } = useBudget();
  const { isInstalled, isIOS, isIPad } = usePWAInstall();

  // Profile Edit modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '🌿');
  const [editColor, setEditColor] = useState(currentUser?.color || '#10b981');

  // Change Password modal state
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordModalError, setPasswordModalError] = useState<string | null>(null);
  const [passwordModalSuccess, setPasswordModalSuccess] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Change PIN modal state
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showOldPin, setShowOldPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmNewPin, setShowConfirmNewPin] = useState(false);
  const [pinModalError, setPinModalError] = useState<string | null>(null);
  const [pinModalSuccess, setPinModalSuccess] = useState<string | null>(null);

  // Admin Mode Passcode Dialog state
  const [isAdminPromptOpen, setIsAdminPromptOpen] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [adminPromptError, setAdminPromptError] = useState<string | null>(null);

  // Admin Login to specific User state
  const [adminTargetUser, setAdminTargetUser] = useState<UserSummary | null>(null);
  const [adminUserPassword, setAdminUserPassword] = useState('');
  const [showAdminUserPassword, setShowAdminUserPassword] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  // Restore file state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restorePreview, setRestorePreview] = useState<RestorePreview | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  const handleOpenEditProfile = () => {
    if (currentUser) {
      setEditName(currentUser.name);
      setEditAvatar(currentUser.avatar);
      setEditColor(currentUser.color);
      setIsEditProfileOpen(true);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileDetails({
      name: editName,
      avatar: editAvatar,
      color: editColor,
    });
    setIsEditProfileOpen(false);
    triggerHaptic('success');
  };

  const handleOpenChangePassword = () => {
    setOldPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowOldPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setPasswordModalError(null);
    setPasswordModalSuccess(null);
    setIsChangePasswordOpen(true);
    triggerHaptic('light');
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordModalError(null);
    setPasswordModalSuccess(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordModalError('New passwords do not match. Please enter the new password twice identically to avoid typos.');
      triggerHaptic('warning');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordModalError('New password must be at least 6 characters long.');
      triggerHaptic('warning');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await updatePassword(oldPassword, newPassword);
      setPasswordModalSuccess('Password successfully updated!');
      triggerHaptic('success');
      setTimeout(() => {
        setIsChangePasswordOpen(false);
      }, 1200);
    } catch (err: any) {
      setPasswordModalError(err.message || 'Failed to update password. Please check your existing password.');
      triggerHaptic('warning');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleOpenChangePin = () => {
    setOldPin('');
    setNewPin('');
    setConfirmNewPin('');
    setShowOldPin(false);
    setShowNewPin(false);
    setShowConfirmNewPin(false);
    setPinModalError(null);
    setPinModalSuccess(null);
    setIsChangePinOpen(true);
    triggerHaptic('light');
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinModalError(null);
    setPinModalSuccess(null);

    if (newPin !== confirmNewPin) {
      setPinModalError('New PINs do not match. Please enter the new PIN twice identically to avoid typos.');
      triggerHaptic('warning');
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setPinModalError('PIN must consist of exactly 4 numeric digits.');
      triggerHaptic('warning');
      return;
    }

    try {
      updatePin(oldPin, newPin);
      updateUserPreferences({ requirePinOnResume: true });
      setPinModalSuccess('4-Digit PIN successfully updated!');
      triggerHaptic('success');
      setTimeout(() => {
        setIsChangePinOpen(false);
      }, 1200);
    } catch (err: any) {
      setPinModalError(err.message || 'Failed to update PIN. Please verify your current PIN.');
      triggerHaptic('warning');
    }
  };

  const handleRemovePin = () => {
    if (currentUser?.pin) {
      if (!oldPin) {
        setPinModalError('Please enter your current PIN first to authorize removing it.');
        return;
      }
      try {
        updatePin(oldPin, '');
        setPinModalSuccess('Passcode PIN removed.');
        triggerHaptic('medium');
        setTimeout(() => {
          setIsChangePinOpen(false);
        }, 1000);
      } catch (err: any) {
        setPinModalError(err.message || 'Failed to remove PIN.');
      }
    }
  };

  const handleAdminPasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminPromptError(null);
    const success = enterAdminMode(adminPasscodeInput);
    if (success) {
      setIsAdminPromptOpen(false);
      setAdminPasscodeInput('');
    } else {
      setAdminPromptError('Incorrect admin passcode. Access denied.');
    }
  };

  const handleAdminLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTargetUser) return;
    setAdminLoginError(null);
    setIsAdminLoggingIn(true);

    try {
      await adminLoginToUser(adminTargetUser.id, adminUserPassword);
      setAdminTargetUser(null);
      setAdminUserPassword('');
    } catch (err: any) {
      setAdminLoginError(
        err.message || 'Incorrect password. Admins cannot access user data without the user\'s valid password.'
      );
      triggerHaptic('warning');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const preview = parseAndValidateBackup(content);
        setRestorePreview(preview);
        triggerHaptic('light');
      } catch (err: any) {
        setRestoreError(err.message || 'Invalid backup file');
        triggerHaptic('warning');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!restorePreview) return;
    try {
      restoreBackup(restorePreview.rawBackup, restoreMode);
      setRestorePreview(null);
      setRestoreSuccess(true);
      triggerHaptic('success');
      setTimeout(() => {
        reloadAll();
        setRestoreSuccess(false);
      }, 1200);
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to restore');
    }
  };

  return (
    <div className="space-y-6 pb-24 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Settings & Vault</h1>
          <p className="text-xs text-slate-400">
            Manage local security, credentials, multi-user accounts, and data backups
          </p>
        </div>

        {/* Admin Mode Badge & Button */}
        {isAdminMode ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-1 rounded-full border border-amber-500/40 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Active</span>
            </span>
            <button
              onClick={exitAdminMode}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-xl border border-slate-700 transition"
            >
              Exit Admin
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              triggerHaptic('light');
              setIsAdminPromptOpen(true);
              setAdminPasscodeInput('');
              setAdminPromptError(null);
            }}
            className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin Passcode</span>
          </button>
        )}
      </div>

      {/* Admin Settings Section (Visible when Admin Mode is unlocked via "abc123") */}
      {isAdminMode && (
        <div className="p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-amber-200">
                  Admin Settings — Registered Users Directory
                </h2>
                <p className="text-[11px] text-slate-400">
                  All accounts registered on this device and their email addresses
                </p>
              </div>
            </div>
            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
              {users.length} Users Found
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            As an administrator, you can view all registered users and their account email addresses.
            You can log into any user’s account, <strong>but only when their password is entered correctly</strong>.
          </p>

          <div className="space-y-2.5 pt-1">
            {users.map((u) => {
              const isActive = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isActive
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{u.name}</span>
                        {isActive && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.2 rounded-full border border-emerald-500/30 font-semibold">
                            Active Session
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-amber-300 font-mono mt-0.5 font-medium">
                        {u.email}
                      </p>
                      <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-0.5">
                        <span>Currency: {u.currencySymbol}</span>
                        <span>•</span>
                        <span>{u.hasPin ? 'PIN Protected' : 'No PIN'}</span>
                        <span>•</span>
                        <span>{u.hasPassword ? 'Password Set' : 'No Password'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setAdminTargetUser(u);
                        setAdminUserPassword('');
                        setAdminLoginError(null);
                      }}
                      className="text-xs bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 transition ios-touch-active"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Log In to Account</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-md border border-white/10"
              style={{ backgroundColor: currentUser?.color || '#10b981' }}
            >
              {currentUser?.avatar || '👤'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">{currentUser?.name}</h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                  Active
                </span>
              </div>
              <p className="text-xs text-amber-300 font-mono mt-0.5 font-medium">
                {currentUser?.email || 'Local profile on this device'}
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenEditProfile}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl font-medium ios-touch-active"
          >
            Edit Profile
          </button>
        </div>

        {/* Security & Multi-User Bar */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAccountModal();
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-xs font-semibold text-white ios-touch-active"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span className="truncate">Accounts ({users.length})</span>
          </button>

          <button
            onClick={lockApp}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-xs font-semibold text-white ios-touch-active"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Lock</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to log out of this account?')) {
                logout();
              }
            }}
            className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-2xl bg-slate-950/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold text-rose-300 ios-touch-active"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Security & Credentials Section (Change Password & Change PIN) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Security & Passwords</h2>
              <p className="text-[11px] text-slate-400">
                Update account password and 4-digit launch passcode
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Change Password Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Account Password
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  SHA-256
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter old password once, and new password twice to avoid typos. Letters can be shown or hidden.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenChangePassword}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition ios-touch-active"
            >
              <span>Change Password</span>
            </button>
          </div>

          {/* Change PIN Card */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                  4-Digit Passcode (PIN)
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                  {currentUser?.pin ? 'PIN Active' : 'No PIN Set'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Enter old PIN once, and new PIN twice to avoid typos. Numbers can be displayed or hidden.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenChangePin}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition ios-touch-active"
            >
              <span>{currentUser?.pin ? 'Change Passcode' : 'Set Passcode'}</span>
            </button>
          </div>
        </div>

        {/* Require Passcode on Launch Switch */}
        <div
          onClick={() => {
            triggerHaptic('medium');
            if (!currentUser?.pin) {
              handleOpenChangePin();
            } else {
              updateUserPreferences({
                requirePinOnResume: !currentUser?.preferences.requirePinOnResume,
              });
            }
          }}
          className="flex items-center justify-between pt-3 border-t border-slate-800 cursor-pointer group hover:bg-slate-800/30 -mx-2 px-2 py-2 rounded-xl transition select-none"
        >
          <div className="pr-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-white group-hover:text-emerald-300 transition">
                Require Passcode on Launch
              </span>
              {!currentUser?.pin && (
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-medium">
                  Tap to set PIN
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              When enabled, the app cannot be opened without entering the correct PIN or password
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={Boolean(currentUser?.pin && currentUser?.preferences.requirePinOnResume)}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic('medium');
              if (!currentUser?.pin) {
                handleOpenChangePin();
              } else {
                updateUserPreferences({
                  requirePinOnResume: !currentUser?.preferences.requirePinOnResume,
                });
              }
            }}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
              currentUser?.pin && currentUser?.preferences.requirePinOnResume
                ? 'bg-emerald-500'
                : 'bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                currentUser?.pin && currentUser?.preferences.requirePinOnResume
                  ? 'translate-x-6'
                  : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Categories & Customization Section */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Expense & Income Categories</h2>
              <p className="text-[11px] text-slate-400">
                {userData?.categories.length || 0} categories ({userData?.categories.filter((c) => c.isCustom).length || 0} custom)
              </p>
            </div>
          </div>

          {onOpenCategoryManager && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenCategoryManager();
              }}
              className="text-xs bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 px-3 py-1.5 rounded-xl font-medium ios-touch-active"
            >
              Manage Categories
            </button>
          )}
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Includes standard defaults (Groceries, Housing & Rent, Bills & Utilities, Salary, etc.) plus your custom personalized categories with icons and colors.
        </p>
      </div>

      {/* Local Backup & Data Hub (Core Feature) */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Local Backup & Restore</h2>
              <p className="text-[11px] text-slate-400">Save your data to device files or import back</p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            No Cloud Needed
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Zenith keeps all financial records local and private. Export your vault anytime to save a JSON
          backup or CSV spreadsheet on your iPhone, iPad, or Mac.
        </p>

        {/* Export / Import Button Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              triggerHaptic('light');
              if (currentUser) exportSingleUserBackup(currentUser.id);
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-left flex items-start gap-3 transition ios-touch-active"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Backup Current Account</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Download JSON with your transactions, budgets & goals
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              exportAllUsersBackup();
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-left flex items-start gap-3 transition ios-touch-active"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Backup All Device Vaults</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Save full multi-user backup file ({users.length} accounts)
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              fileInputRef.current?.click();
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-left flex items-start gap-3 transition ios-touch-active sm:col-span-2"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Restore from Backup File</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select a previously saved Zenith JSON file to merge or replace data
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              if (currentUser && userData) {
                exportTransactionsToCSV(userData);
              }
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-left flex items-start gap-3 transition ios-touch-active sm:col-span-2"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Export to Spreadsheet (CSV)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Download structured CSV file for Microsoft Excel, Apple Numbers, or Google Sheets
              </p>
            </div>
          </button>
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelected}
          className="hidden"
        />

        {/* Restore Error Message */}
        {restoreError && (
          <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{restoreError}</span>
          </div>
        )}

        {/* Restore Success Message */}
        {restoreSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Backup successfully restored! Reloading data...</span>
          </div>
        )}
      </div>

      {/* Preferences Section */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white">Currency & Preferences</h2>

        <div className="space-y-3">
          {/* Currency */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-white">Primary Currency</span>
              <p className="text-[11px] text-slate-400">Applied across all your budget summaries</p>
            </div>
            <select
              value={currentUser?.currency.code || 'USD'}
              onChange={(e) => updateUserCurrency(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 focus:outline-none"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Haptics */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div>
              <span className="text-xs font-medium text-white">Haptic Touch Feedback</span>
              <p className="text-[11px] text-slate-400">Vibrations on button taps (iOS & mobile)</p>
            </div>
            <input
              type="checkbox"
              checked={currentUser?.preferences.enableHaptics ?? true}
              onChange={(e) => updateUserPreferences({ enableHaptics: e.target.checked })}
              className="w-5 h-5 rounded text-emerald-500 bg-slate-950 border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* iOS App & GitHub Pages Status Card */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">iOS & Device Optimization</h2>
              <p className="text-[11px] text-slate-400">PWA, offline cache, and standalone mode</p>
            </div>
          </div>

          <span
            className={`text-[10px] px-2.5 py-1 rounded-full font-semibold border ${
              isInstalled
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
            }`}
          >
            {isInstalled ? 'Standalone iOS App' : isIOS ? 'iOS Safari Mode' : 'Web App'}
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          This app is designed specifically for iPhone and iPad devices. When added to your Home
          Screen, it runs in fullscreen standalone mode with full offline functionality and native
          safe-area support.
        </p>

        <div className="flex flex-wrap gap-2.5 pt-1">
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenIOSGuide();
            }}
            className="flex items-center gap-2 py-2 px-3.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-500/30 ios-touch-active"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>How to install on iPhone & iPad</span>
          </button>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Globe className="w-3.5 h-3.5 text-emerald-400" />
            <span>GitHub Pages: 100% Compatible (Offline Vault)</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Details Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-white">Edit Profile Details</h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Choose Avatar</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setEditAvatar(emoji)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        editAvatar === emoji
                          ? 'bg-emerald-600/40 border-2 border-emerald-400 scale-110'
                          : 'bg-slate-800 border border-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Accent Color</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setEditColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        editColor === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Create New Password</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePasswordOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Enter your old password once, and your new password twice to avoid typos.
            </p>

            {passwordModalError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{passwordModalError}</span>
              </div>
            )}

            {passwordModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{passwordModalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              {/* Old Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Current (Old) Password <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                  >
                    {showOldPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showOldPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showOldPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter existing password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password (1st Entry) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    New Password (min 6 chars) <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showNewPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password (2nd Entry below) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Confirm New Password <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showConfirmNewPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-enter new password to confirm"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className={`w-full rounded-xl bg-slate-950 border pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none ${
                      confirmNewPassword && confirmNewPassword !== newPassword
                        ? 'border-rose-500 focus:border-rose-500'
                        : confirmNewPassword && confirmNewPassword === newPassword
                        ? 'border-emerald-500 focus:border-emerald-500'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmNewPassword && confirmNewPassword !== newPassword && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match yet.</p>
                )}
                {confirmNewPassword && confirmNewPassword === newPassword && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1"
                >
                  {isUpdatingPassword ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Save Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change PIN Modal (Exact same procedure as password) */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-400">
                <KeyRound className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">
                  {currentUser?.pin ? 'Change 4-Digit Passcode (PIN)' : 'Set 4-Digit Passcode (PIN)'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChangePinOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              {currentUser?.pin
                ? 'Enter your current PIN once, and your new 4-digit PIN twice to avoid typos.'
                : 'Enter your new 4-digit PIN twice below to avoid typos.'}
            </p>

            {pinModalError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{pinModalError}</span>
              </div>
            )}

            {pinModalSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{pinModalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePinSubmit} className="space-y-3.5">
              {/* Old PIN if one exists */}
              {currentUser?.pin && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">
                      Current (Old) 4-Digit PIN <span className="text-rose-400">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowOldPin(!showOldPin)}
                      className="text-[11px] text-slate-400 hover:text-teal-400 flex items-center gap-1"
                    >
                      {showOldPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showOldPin ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showOldPin ? 'text' : 'password'}
                      required
                      maxLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      placeholder="e.g. 1234"
                      value={oldPin}
                      onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                      className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 tracking-widest text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPin(!showOldPin)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-white"
                    >
                      {showOldPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* New PIN (1st Entry) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    New 4-Digit PIN <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="text-[11px] text-slate-400 hover:text-teal-400 flex items-center gap-1"
                  >
                    {showNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showNewPin ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showNewPin ? 'text' : 'password'}
                    required
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="4 digits (e.g. 2468)"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 tracking-widest text-center"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPin(!showNewPin)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New PIN (2nd Entry below) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    Confirm New 4-Digit PIN <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPin(!showConfirmNewPin)}
                    className="text-[11px] text-slate-400 hover:text-teal-400 flex items-center gap-1"
                  >
                    {showConfirmNewPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showConfirmNewPin ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmNewPin ? 'text' : 'password'}
                    required
                    maxLength={4}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="Re-enter 4 digits to confirm"
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                    className={`w-full rounded-xl bg-slate-950 border pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none tracking-widest text-center ${
                      confirmNewPin && confirmNewPin !== newPin
                        ? 'border-rose-500 focus:border-rose-500'
                        : confirmNewPin && confirmNewPin === newPin
                        ? 'border-teal-500 focus:border-teal-500'
                        : 'border-slate-700 focus:border-teal-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPin(!showConfirmNewPin)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showConfirmNewPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmNewPin && confirmNewPin !== newPin && (
                  <p className="text-[11px] text-rose-400 mt-1">PINs do not match yet.</p>
                )}
                {confirmNewPin && confirmNewPin === newPin && (
                  <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> PINs match
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                {currentUser?.pin && (
                  <button
                    type="button"
                    onClick={handleRemovePin}
                    className="py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-medium"
                  >
                    Remove PIN
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md"
                >
                  Save Passcode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Passcode Modal (Entering secret code "abc123") */}
      {isAdminPromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Enter Admin Passcode</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdminPromptOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Enter the secret administrator passcode (<code className="text-amber-300 font-mono">abc123</code>) to unlock Admin Mode.
            </p>

            {adminPromptError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300">
                {adminPromptError}
              </div>
            )}

            <form onSubmit={handleAdminPasscodeSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type={showAdminPasscode ? 'text' : 'password'}
                  required
                  autoFocus
                  placeholder="Secret passcode"
                  value={adminPasscodeInput}
                  onChange={(e) => setAdminPasscodeInput(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPasscode(!showAdminPasscode)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showAdminPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdminPromptOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md"
                >
                  Unlock Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Login Modal: Verify User Password */}
      {adminTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Admin Account Login</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminTargetUser(null)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                style={{ backgroundColor: adminTargetUser.color }}
              >
                {adminTargetUser.avatar}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{adminTargetUser.name}</h4>
                <p className="text-[11px] text-amber-300 font-mono truncate">{adminTargetUser.email}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300">
              <strong className="text-white">Security Rule:</strong> Admins can only log into this user's account if the user's password is provided correctly.
            </p>

            {adminLoginError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Enter {adminTargetUser.name}'s Password
                </label>
                <div className="relative">
                  <input
                    type={showAdminUserPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="User's account password"
                    value={adminUserPassword}
                    onChange={(e) => setAdminUserPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminUserPassword(!showAdminUserPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showAdminUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdminTargetUser(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdminLoggingIn}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5"
                >
                  {isAdminLoggingIn ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Verify & Log In</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Preview & Confirmation Dialog */}
      {restorePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-white">Valid Backup File Found</h3>
            </div>

            <p className="text-xs text-slate-400">
              Exported on {new Date(restorePreview.exportedAt).toLocaleDateString()}. Contains:
            </p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {restorePreview.accounts.map((acc, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{acc.avatar}</span>
                    <span className="font-medium text-white">{acc.name}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {acc.transactionCount} records • {acc.budgetCount} budgets
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Restore Strategy
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setRestoreMode('merge')}
                  className={`py-2 rounded-xl border text-center transition ${
                    restoreMode === 'merge'
                      ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Merge With Existing
                </button>
                <button
                  type="button"
                  onClick={() => setRestoreMode('replace')}
                  className={`py-2 rounded-xl border text-center transition ${
                    restoreMode === 'replace'
                      ? 'bg-rose-600/30 border-rose-500 text-rose-200 font-semibold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  Replace All Data
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestorePreview(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleConfirmRestore}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
