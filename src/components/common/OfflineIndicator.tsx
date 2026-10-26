import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 text-slate-100 px-3.5 py-2 text-xs font-medium shadow-xl border border-slate-700/60 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-300"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
      </span>
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Offline Mode — All changes and orders are saved directly on this device</span>
    </div>
  );
};
