import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, Users, Smartphone, ShieldCheck, LogOut } from 'lucide-react';
import { triggerHaptic } from '../../services/storage';

interface TopBarProps {
  title: string;
  onOpenAccountModal: () => void;
  onOpenIOSGuide: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  title,
  onOpenAccountModal,
  onOpenIOSGuide,
}) => {
  const { currentUser, lockApp, logout } = useAuth();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 pt-[max(env(safe-area-inset-top),8px)] pb-2.5 px-4">
      <div className="flex items-center justify-between">
        {/* App Title */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            Z
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-none">
              {title}
            </h1>
            <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" />
              <span>Offline Vault</span>
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenIOSGuide();
            }}
            title="Install on iOS"
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white ios-touch-active"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>

          {currentUser?.pin && (
            <button
              onClick={() => {
                triggerHaptic('light');
                lockApp();
              }}
              title="Lock App"
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 hover:text-amber-300 ios-touch-active"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              if (window.confirm('Log out of this account?')) {
                logout();
              }
            }}
            title="Log Out"
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 ios-touch-active"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAccountModal();
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md border border-white/20 ios-touch-active ml-1"
            style={{ backgroundColor: currentUser?.color || '#10b981' }}
          >
            {currentUser?.avatar || '👤'}
          </button>
        </div>
      </div>
    </header>
  );
};
