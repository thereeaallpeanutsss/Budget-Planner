import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Users,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  X,
  LogIn,
} from 'lucide-react';
import { AVATAR_OPTIONS, SUPPORTED_CURRENCIES } from '../../utils/constants';
import { triggerHaptic, UserSummary } from '../../services/storage';

export const AuthScreen: React.FC = () => {
  const {
    login,
    signup,
    users,
    isAdminMode,
    enterAdminMode,
    exitAdminMode,
    adminLoginToUser,
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('✈️');
  const [color, setColor] = useState('#10b981');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [seedDemo, setSeedDemo] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Admin Mode modal state
  const [isAdminPromptOpen, setIsAdminPromptOpen] = useState(false);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  const [showAdminPasscode, setShowAdminPasscode] = useState(false);
  const [adminPromptError, setAdminPromptError] = useState<string | null>(null);

  // Admin login into specific user state
  const [adminLoginUser, setAdminLoginUser] = useState<UserSummary | null>(null);
  const [adminUserPasswordInput, setAdminUserPasswordInput] = useState('');
  const [showAdminUserPassword, setShowAdminUserPassword] = useState(false);
  const [adminUserLoginError, setAdminUserLoginError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please make sure both fields are identical to avoid typos.');
        triggerHaptic('warning');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        triggerHaptic('warning');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await login(email, password);
      } else {
        await signup(email, password, name, avatar, color, currencyCode, seedDemo);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
      triggerHaptic('warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExistingUser = (userEmail: string) => {
    setEmail(userEmail);
    setMode('signin');
    triggerHaptic('light');
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
    if (!adminLoginUser) return;
    setAdminUserLoginError(null);
    setIsAdminLoggingIn(true);

    try {
      await adminLoginToUser(adminLoginUser.id, adminUserPasswordInput);
      setAdminLoginUser(null);
      setAdminUserPasswordInput('');
    } catch (err: any) {
      setAdminUserLoginError(
        err.message || 'Incorrect password. Admins cannot access user data without the user\'s valid password.'
      );
      triggerHaptic('warning');
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full flex items-center justify-center bg-slate-950 p-4 sm:p-6 text-slate-100 relative overflow-hidden select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-5">
        {/* Admin Mode Active Banner */}
        {isAdminMode && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">ADMIN MODE ACTIVE</span>
                <p className="text-[10px] text-amber-300/80">Secret code verified</p>
              </div>
            </div>
            <button
              type="button"
              onClick={exitAdminMode}
              className="text-[10px] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-2.5 py-1 rounded-lg font-medium transition"
            >
              Exit Admin
            </button>
          </div>
        )}

        {/* App Branding */}
        <div className="text-center space-y-1.5">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-950/60 font-bold text-2xl">
            Z
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Zenith Budget</h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Privacy-first offline budget planner. Stored securely on your device.
          </p>
        </div>

        {/* Admin Mode Registered Users List */}
        {isAdminMode && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                All Registered Users ({users.length})
              </span>
              <span className="text-[10px] text-slate-400">Admin Directory</span>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1 no-scrollbar">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 shadow-sm"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.avatar}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{u.name}</p>
                      <p className="text-[10px] text-amber-300 font-mono truncate">{u.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setAdminLoginUser(u);
                      setAdminUserPasswordInput('');
                      setAdminUserLoginError(null);
                    }}
                    className="shrink-0 text-[11px] bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 ios-touch-active"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Log In</span>
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Note: To log in as any user, their account password must be provided.
            </p>
          </div>
        )}

        {/* Existing Local Profiles Bar */}
        {users.length > 0 && mode === 'signin' && !isAdminMode && (
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Accounts on this device
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelectExistingUser(u.email)}
                  className={`flex items-center gap-2 p-1.5 pr-3 rounded-xl border text-left transition shrink-0 ${
                    email.toLowerCase() === u.email.toLowerCase()
                      ? 'bg-slate-800 border-emerald-500/60 ring-1 ring-emerald-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-sm"
                    style={{ backgroundColor: u.color }}
                  >
                    {u.avatar}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate max-w-[100px]">
                      {u.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate max-w-[100px]">
                      {u.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'signin'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-xl transition-all ${
              mode === 'signup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5 animate-fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Full Name / Alias <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Email Address <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            </div>
          </div>

          {/* First Password Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-slate-300">
                {mode === 'signup' ? 'Create Password' : 'Password'} <span className="text-rose-400">*</span>
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
                    <span>Show Password</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-slate-700 pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
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

          {/* Second Password Box (Confirm Password below first box during sign up) */}
          {mode === 'signup' && (
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
                      <span>Show Password</span>
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
                  className={`w-full rounded-xl bg-slate-950 border pl-10 pr-10 py-2.5 text-sm text-white focus:outline-none ${
                    confirmPassword && confirmPassword !== password
                      ? 'border-rose-500 focus:border-rose-500'
                      : confirmPassword && confirmPassword === password
                      ? 'border-emerald-500 focus:border-emerald-500'
                      : 'border-slate-700 focus:border-emerald-500'
                  }`}
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
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
          )}

          {mode === 'signup' && (
            <>
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Choose Avatar Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.slice(0, 8).map((emoji) => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => {
                        triggerHaptic('light');
                        setAvatar(emoji);
                      }}
                      className={`w-9 h-9 rounded-xl text-base flex items-center justify-center transition-all ${
                        avatar === emoji
                          ? 'bg-emerald-600/40 border-2 border-emerald-400 scale-110'
                          : 'bg-slate-950 border border-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Default Currency
                </label>
                <select
                  value={currencyCode}
                  onChange={(e) => setCurrencyCode(e.target.value)}
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Seed Demo Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={seedDemo}
                  onChange={(e) => setSeedDemo(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-700 bg-slate-950"
                />
                <span>Include starter budgets, savings goals & transactions</span>
              </label>
            </>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 ios-touch-active mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security / Privacy & Admin Portal Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Local Vault • SHA-256</span>
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setIsAdminPromptOpen(true);
              setAdminPasscodeInput('');
              setAdminPromptError(null);
            }}
            className="text-slate-400 hover:text-amber-300 flex items-center gap-1 transition"
          >
            <KeyRound className="w-3 h-3 text-amber-400" />
            <span>{isAdminMode ? 'Admin Portal' : 'Admin Passcode'}</span>
          </button>
        </div>
      </div>

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
      {adminLoginUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Admin Account Login</h3>
              </div>
              <button
                type="button"
                onClick={() => setAdminLoginUser(null)}
                className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                style={{ backgroundColor: adminLoginUser.color }}
              >
                {adminLoginUser.avatar}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{adminLoginUser.name}</h4>
                <p className="text-[11px] text-amber-300 font-mono truncate">{adminLoginUser.email}</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300">
              <strong className="text-white">Security Rule:</strong> Admins can only log into this user's account if the user's password is provided correctly.
            </p>

            {adminUserLoginError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{adminUserLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Enter {adminLoginUser.name}'s Password
                </label>
                <div className="relative">
                  <input
                    type={showAdminUserPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="User's account password"
                    value={adminUserPasswordInput}
                    onChange={(e) => setAdminUserPasswordInput(e.target.value)}
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
                  onClick={() => setAdminLoginUser(null)}
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
    </div>
  );
};
