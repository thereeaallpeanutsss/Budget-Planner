import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Delete, Lock, ScanFace, Users } from 'lucide-react';
import { triggerHaptic } from '../../services/storage';

interface PinLockScreenProps {
  onOpenAccountSwitcher?: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onOpenAccountSwitcher }) => {
  const { currentUser, unlockWithPin } = useAuth();
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    triggerHaptic('light');
    const newPin = pin + digit;
    setPin(newPin);

    if (newPin.length === 4) {
      setTimeout(() => {
        const success = unlockWithPin(newPin);
        if (!success) {
          setErrorShake(true);
          setTimeout(() => {
            setErrorShake(false);
            setPin('');
          }, 500);
        }
      }, 100);
    }
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    setPin((prev) => prev.slice(0, -1));
  };

  const handleBiometricMock = () => {
    triggerHaptic('success');
    // For convenience / simulation of Face ID on mobile iOS
    if (currentUser?.pin) {
      unlockWithPin(currentUser.pin);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/60 p-6 pt-safe pb-safe text-white">
      {/* Top Header */}
      <div className="flex w-full items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-3 py-1.5 rounded-full backdrop-blur-md">
          <Lock className="w-3.5 h-3.5" />
          <span>Local Vault Encrypted</span>
        </div>

        {onOpenAccountSwitcher && (
          <button
            onClick={() => {
              triggerHaptic('light');
              onOpenAccountSwitcher();
            }}
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-full ios-touch-active"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Switch User</span>
          </button>
        )}
      </div>

      {/* User Avatar & Lock Prompt */}
      <div className="flex flex-col items-center text-center -mt-6">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-2xl border-2 border-white/20 mb-3"
          style={{ backgroundColor: currentUser?.color || '#10b981' }}
        >
          {currentUser?.avatar || '👤'}
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">{currentUser?.name}</h2>
        <p className="text-xs text-slate-400 mt-1">Enter your 4-digit Passcode</p>

        {/* PIN Dots Indicator */}
        <div
          className={`flex items-center gap-4 mt-6 ${
            errorShake ? 'animate-bounce text-red-400' : ''
          }`}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  errorShake
                    ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-500/40'
                    : isFilled
                    ? 'bg-emerald-400 scale-125 shadow-md shadow-emerald-400/50'
                    : 'bg-slate-700/70 border border-slate-600'
                }`}
              />
            );
          })}
        </div>

        {errorShake && (
          <p className="text-xs text-rose-400 font-medium mt-3 animate-fade-in">
            Incorrect passcode. Please try again.
          </p>
        )}
      </div>

      {/* iOS Style Numeric Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-4 pb-4">
        {[
          { num: '1', sub: '' },
          { num: '2', sub: 'ABC' },
          { num: '3', sub: 'DEF' },
          { num: '4', sub: 'GHI' },
          { num: '5', sub: 'JKL' },
          { num: '6', sub: 'MNO' },
          { num: '7', sub: 'PQRS' },
          { num: '8', sub: 'TUV' },
          { num: '9', sub: 'WXYZ' },
        ].map((item) => (
          <button
            key={item.num}
            onClick={() => handleDigit(item.num)}
            className="flex flex-col items-center justify-center h-18 rounded-full bg-slate-800/50 hover:bg-slate-700/70 border border-white/5 shadow-sm ios-touch-active active:bg-slate-600/80 transition-all"
          >
            <span className="text-2xl font-light text-white leading-none">{item.num}</span>
            {item.sub && (
              <span className="text-[9px] font-semibold text-slate-400 tracking-widest mt-1">
                {item.sub}
              </span>
            )}
          </button>
        ))}

        {/* Biometrics Simulator */}
        <button
          onClick={handleBiometricMock}
          title="Face ID / Quick Unlock"
          className="flex flex-col items-center justify-center h-18 rounded-full bg-slate-800/20 hover:bg-slate-800/50 text-emerald-400 border border-emerald-500/10 ios-touch-active transition-all"
        >
          <ScanFace className="w-6 h-6" />
          <span className="text-[9px] text-slate-400 mt-1">Face ID</span>
        </button>

        {/* Zero */}
        <button
          onClick={() => handleDigit('0')}
          className="flex flex-col items-center justify-center h-18 rounded-full bg-slate-800/50 hover:bg-slate-700/70 border border-white/5 shadow-sm ios-touch-active active:bg-slate-600/80 transition-all"
        >
          <span className="text-2xl font-light text-white leading-none">0</span>
        </button>

        {/* Backspace */}
        <button
          onClick={handleBackspace}
          className="flex flex-col items-center justify-center h-18 rounded-full bg-slate-800/20 hover:bg-slate-800/50 text-slate-400 hover:text-white border border-white/5 ios-touch-active transition-all"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
