import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  UserPlus,
  Lock,
  Unlock,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  HardDrive,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import {
  AVATAR_OPTIONS,
  COLOR_OPTIONS,
  SUPPORTED_CURRENCIES,
} from '../../utils/constants';
import { triggerHaptic } from '../../services/storage';

interface AccountManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccountManagerModal: React.FC<AccountManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    users,
    currentUser,
    switchUser,
    signup,
    removeAccount,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'switch' | 'create'>('switch');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatar, setAvatar] = useState(AVATAR_OPTIONS[0]);
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [pin, setPin] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [seedDemo, setSeedDemo] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please enter the new password twice identically to prevent typos.');
      triggerHaptic('warning');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      triggerHaptic('warning');
      return;
    }

    try {
      const emailToUse = email.trim() || `${name.trim().toLowerCase().replace(/\s+/g, '')}@device.local`;
      await signup(emailToUse, password, name, avatar, color, currencyCode, seedDemo);
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPin('');
      setActiveTab('switch');
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account.');
      triggerHaptic('warning');
    }
  };

  const handleSelectUser = (userId: string) => {
    if (userId === currentUser?.id) {
      onClose();
      return;
    }
    switchUser(userId);
    onClose();
  };

  const handleDelete = (userId: string) => {
    removeAccount(userId);
    setConfirmDeleteId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-fade-in overscroll-contain select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          triggerHaptic('light');
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col select-none overscroll-contain"
        onDragStart={(e) => e.preventDefault()}
        draggable={false}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Local Device Accounts</h3>
              <p className="text-xs text-slate-400">Each account has isolated local storage</p>
            </div>
          </div>
          <button
            type="button"
            draggable={false}
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-1">
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('switch');
              }}
              className={`py-2 rounded-lg transition-all ${
                activeTab === 'switch'
                  ? 'bg-slate-800 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Switch Account ({users.length})
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('create');
              }}
              className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              New Account
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div
          className="overflow-y-auto p-6 space-y-4 flex-1 modal-scrollable no-scrollbar touch-pan-y overscroll-contain"
          onDragStart={(e) => e.preventDefault()}
        >
          {activeTab === 'switch' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Select profile to switch session</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Private on this device
                </span>
              </div>

              {users.map((u) => {
                const isActive = u.id === currentUser?.id;
                const isConfirmingDelete = confirmDeleteId === u.id;

                return (
                  <div
                    key={u.id}
                    className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-emerald-950/30 border-emerald-500/40 ring-1 ring-emerald-500/30'
                        : 'bg-slate-800/40 hover:bg-slate-800 border-slate-700/60'
                    }`}
                  >
                    <div
                      className="flex items-center gap-3.5 cursor-pointer flex-1"
                      onClick={() => handleSelectUser(u.id)}
                    >
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-md border border-white/10 shrink-0"
                        style={{ backgroundColor: u.color || '#10b981' }}
                      >
                        {u.avatar}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{u.name}</span>
                          {isActive && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          <span>Currency: {u.currencySymbol}</span>
                          <span className="flex items-center gap-1">
                            {u.hasPin ? (
                              <span className="text-amber-400 flex items-center gap-0.5">
                                <Lock className="w-3 h-3" /> PIN Locked
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-0.5">
                                <Unlock className="w-3 h-3" /> No PIN
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pl-2">
                      {isActive ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      ) : isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-xs bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg font-medium"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-xs text-slate-400 hover:text-white px-1.5 py-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(u.id)}
                          title="Delete account data"
                          className="w-7 h-7 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Account Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Personal, Family, Business, Sarah"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email / Handle (Local identifier)
                </label>
                <input
                  type="text"
                  placeholder="e.g. sarah@device.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* First Password Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Account Password (min 6 chars) <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
                  >
                    {showPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Second Password Box (Confirm Password below first box) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Confirm Password <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
                  >
                    {showConfirmPassword ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Show</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-enter password to confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-xl bg-slate-950 border pl-3.5 pr-10 py-2.5 text-sm text-white focus:outline-none ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-rose-500 focus:border-rose-500'
                        : confirmPassword && confirmPassword === password
                        ? 'border-emerald-500 focus:border-emerald-500'
                        : 'border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-[11px] text-rose-400 mt-1">Passwords do not match yet.</p>
                )}
                {confirmPassword && confirmPassword === password && (
                  <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Choose Avatar Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => {
                        triggerHaptic('light');
                        setAvatar(emoji);
                      }}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${
                        avatar === emoji
                          ? 'bg-emerald-600/40 border-2 border-emerald-400 scale-110 shadow-md'
                          : 'bg-slate-800 border border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Accent */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Profile Accent Color
                </label>
                <div className="flex items-center gap-2.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => {
                        triggerHaptic('light');
                        setColor(c);
                      }}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        color === c ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Primary Currency
                </label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4-digit PIN */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    4-Digit Security Passcode (Optional)
                  </label>
                  <span className="text-[11px] text-slate-500">Locks your account</span>
                </div>
                <input
                  type="password"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="Leave empty for quick open"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 tracking-widest text-center"
                />
              </div>

              {/* Seed Demo Data Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={seedDemo}
                  onChange={(e) => setSeedDemo(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Populate with sample starter budget & transactions</span>
              </label>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 ios-touch-active mt-2"
              >
                <UserPlus className="w-4 h-4" />
                Create Account & Switch
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
