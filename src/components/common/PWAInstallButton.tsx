import React, { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, do not show button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border border-emerald-600/30 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
        title="Install app to your device for offline desktop or mobile use"
      >
        <Download className="w-3.5 h-3.5 text-emerald-600" />
        <span className="hidden sm:inline">Install Offline App</span>
        <span className="sm:hidden">Install</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          title="Install app to home screen for offline access"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Install to Home</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Install Reyra for Offline Use
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <p className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">1.</span>
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">2.</span>
                  <span>Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-bold text-emerald-600">3.</span>
                  <span>Launch it anytime — it works completely without internet!</span>
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
