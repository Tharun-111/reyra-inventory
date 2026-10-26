import React, { useEffect } from 'react';
import { Search, Sparkles } from 'lucide-react';

interface GlobalSearchBarProps {
  onOpen: () => void;
  className?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({ onOpen, className = '' }) => {
  // Global shortcut: Cmd+K, Ctrl+K, or pressing "/" when not focused on an input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpen();
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        onOpen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);

  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);

  return (
    <button
      id="btn-global-search-header"
      type="button"
      onClick={onOpen}
      className={`group relative flex items-center justify-between gap-3 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent ${className}`}
      title={`Global Search (Hotkey: ${isMac ? '⌘K' : 'Ctrl+K'} or /)`}
      aria-label="Search products, orders, or purchase records across database"
    >
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 min-w-0">
        <Search className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
        <span className="truncate font-medium text-slate-600 dark:text-slate-300">
          Search products, sales orders, POs...
        </span>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
          {isMac ? '⌘K' : 'Ctrl+K'}
        </kbd>
      </div>
    </button>
  );
};
