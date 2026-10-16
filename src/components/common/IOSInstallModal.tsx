import React from 'react';
import { X, Share, PlusSquare, Smartphone, Tablet, CheckCircle, ExternalLink } from 'lucide-react';
import { triggerHaptic } from '../../services/storage';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* iOS Drag Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Install on iPhone & iPad</h3>
              <p className="text-xs text-slate-400">Run as a fullscreen standalone iOS Web App</p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 leading-relaxed flex items-center gap-2.5">
            <Tablet className="w-5 h-5 text-blue-400 shrink-0" />
            <span>
              Supports all iPhone sizes and iPad multitasking (Split View & Slide Over) with no browser address bar!
            </span>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {/* Step 1 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  Tap the Safari <Share className="w-3.5 h-3.5 text-blue-400 inline" /> Share button
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Located in the bottom toolbar on iPhone or top toolbar on iPad Safari.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                2
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  Scroll down & select <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" /> "Add to Home Screen"
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  In the iOS sharing menu, scroll down until you see "Add to Home Screen".
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div className="w-7 h-7 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                3
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Tap "Add" in the top-right</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Confirm the name "ZenithBudget" and the custom icon will appear on your Home Screen.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                ✓
              </div>
              <div>
                <h4 className="text-xs font-semibold text-emerald-300">
                  Launch & Enjoy Full Offline Speed
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tap the new icon on your iOS home screen. The app runs in dedicated standalone mode with no browser tabs and completely works offline!
                </p>
              </div>
            </div>
          </div>

          {/* GitHub Pages Tip */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-300">Publishing on GitHub Pages?</span>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Run <code className="text-emerald-400">npm run build</code> and deploy the <code className="text-emerald-400">dist/</code> folder. All asset paths are configured relatively.
              </p>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs ios-touch-active"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
