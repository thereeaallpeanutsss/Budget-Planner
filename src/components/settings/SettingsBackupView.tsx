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
} from 'lucide-react';
import {
  exportSingleUserBackup,
  exportAllUsersBackup,
  exportTransactionsToCSV,
  parseAndValidateBackup,
  restoreBackup,
  RestorePreview,
  triggerHaptic,
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
  } = useAuth();

  const { loadDemoSeedData } = useBudget();
  const { isInstalled, isIOS, isIPad } = usePWAInstall();

  // Profile Edit modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '🌿');
  const [editColor, setEditColor] = useState(currentUser?.color || '#10b981');
  const [editPin, setEditPin] = useState(currentUser?.pin || '');

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
      setEditPin(currentUser.pin || '');
      setIsEditProfileOpen(true);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileDetails({
      name: editName,
      avatar: editAvatar,
      color: editColor,
      pin: editPin,
    });
    setIsEditProfileOpen(false);
    triggerHaptic('success');
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
    // Reset input
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
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Settings & Vault</h1>
        <p className="text-xs text-slate-400">
          Manage local security, multi-user accounts, and data backups
        </p>
      </div>

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
              <p className="text-xs text-slate-400 mt-0.5">
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

        {/* Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Export Active Account */}
          <button
            onClick={() => {
              if (currentUser) {
                triggerHaptic('success');
                exportSingleUserBackup(currentUser.id);
              }
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-left flex items-start gap-3 transition ios-touch-active"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Export My Backup (JSON)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Download a JSON snapshot of {currentUser?.name}'s data
              </p>
            </div>
          </button>

          {/* Export All Accounts */}
          <button
            onClick={() => {
              triggerHaptic('success');
              exportAllUsersBackup();
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-left flex items-start gap-3 transition ios-touch-active"
          >
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Export All Accounts (JSON)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Bundle all {users.length} device profiles in one file
              </p>
            </div>
          </button>

          {/* Import / Restore Button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              fileInputRef.current?.click();
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-left flex items-start gap-3 transition ios-touch-active"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Restore from Backup</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Select a previously exported .json file
              </p>
            </div>
          </button>

          {/* Seed Demo Data */}
          <button
            onClick={() => {
              loadDemoSeedData();
            }}
            className="p-3.5 rounded-2xl bg-slate-950/60 hover:bg-slate-950 border border-slate-800 text-left flex items-start gap-3 transition ios-touch-active"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">Seed Starter Records</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Add sample transactions for groceries, salary & utilities
              </p>
            </div>
          </button>

          {/* Export to CSV */}
          <button
            onClick={() => {
              if (userData) {
                triggerHaptic('success');
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
            <span>GitHub Pages: 100% Compatible (No Backend Required)</span>
          </div>
        </div>
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

          {/* PIN Lock on App Resume */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800">
            <div>
              <span className="text-xs font-medium text-white">Require Passcode on Launch</span>
              <p className="text-[11px] text-slate-400">Show keypad when switching back to app</p>
            </div>
            <input
              type="checkbox"
              disabled={!currentUser?.pin}
              checked={Boolean(currentUser?.pin && currentUser?.preferences.requirePinOnResume)}
              onChange={(e) => updateUserPreferences({ requirePinOnResume: e.target.checked })}
              className="w-5 h-5 rounded text-emerald-500 bg-slate-950 border-slate-700 disabled:opacity-30"
            />
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
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

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  4-Digit Passcode (Leave blank to remove PIN)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="e.g. 1234"
                  value={editPin}
                  onChange={(e) => setEditPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 tracking-widest text-center"
                />
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
                type="button"
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
