import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Settings,
  LogOut,
  User,
  Sun,
  Moon,
  Laptop,
  Shield,
  Menu,
  KeyRound,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { Role } from '../../types';
import { ReyraLogo } from '../brand/ReyraLogo';

interface NavbarProps {
  onToggleSidebar: () => void;
  onNavigateToSettings: () => void;
  onOpenProfileModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  onNavigateToSettings,
  onOpenProfileModal,
}) => {
  const { user, logout, switchRole } = useAuth();
  const { settings, defaultCurrency } = useSettings();
  const { theme, setTheme } = useTheme();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const roles: Role[] = ['admin', 'manager', 'sales', 'inventory', 'purchase', 'viewer'];

  return (
    <header
      id="app-topbar"
      className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors"
    >
      {/* Left: Mobile Toggle & Brand Logo/Name */}
      <div className="flex items-center gap-3">
        <button
          id="btn-toggle-sidebar-mobile"
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5">
          {settings.brand_logo ? (
            <img
              src={settings.brand_logo}
              alt={settings.brand_name || 'REYRA Inventory'}
              className="w-9 h-9 rounded-xl object-contain border border-slate-200 dark:border-slate-700 bg-white shadow-2xs"
            />
          ) : (
            <ReyraLogo size="md" />
          )}
          {(() => {
            const rawName = settings.brand_name || 'Reyra Inventory';
            const match = rawName.match(/^(reyra)\s*(.*)$/i);
            if (match) {
              return (
                <span className="hidden sm:inline-flex items-baseline gap-1.5 leading-none">
                  <span
                    className="font-serif font-medium text-2xl tracking-normal text-slate-900 dark:text-white"
                    style={{ fontFamily: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif" }}
                  >
                    {match[1]}
                  </span>
                  {match[2] && (
                    <span className="font-sans font-normal text-lg tracking-normal text-slate-600 dark:text-slate-400">
                      {match[2]}
                    </span>
                  )}
                </span>
              );
            }
            return (
              <span
                className="font-serif font-medium text-2xl tracking-normal text-slate-900 dark:text-white hidden sm:inline-block leading-none"
                style={{ fontFamily: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif" }}
              >
                {rawName}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Right: Currency Indicator, Theme Switcher, Settings & User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Currency Badge */}
        <div
          id="currency-badge"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60"
          title={`Default system currency: ${defaultCurrency.name}`}
        >
          <span>Currency:</span>
          <span className="font-bold text-blue-900 dark:text-blue-100">
            {defaultCurrency.code} ({defaultCurrency.symbol})
          </span>
        </div>

        {/* Theme Menu */}
        <div className="relative" ref={themeRef}>
          <button
            id="btn-theme-toggle"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="Change theme"
            title="Appearance Theme"
          >
            {theme === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
            {theme === 'dark' && <Moon className="w-5 h-5 text-blue-400" />}
            {theme === 'system' && <Laptop className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
          </button>

          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-40 text-sm animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  setTheme('light');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                  theme === 'light' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" /> Light
                </span>
                {theme === 'light' && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setTheme('dark');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                  theme === 'dark' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-blue-400" /> Dark
                </span>
                {theme === 'dark' && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setTheme('system');
                  setIsThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/60 ${
                  theme === 'system' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Laptop className="w-4 h-4" /> System
                </span>
                {theme === 'system' && <Check className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* Quick Settings Icon */}
        <button
          id="btn-nav-settings"
          onClick={onNavigateToSettings}
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label="Application Settings"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            id="btn-user-profile-menu"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
            aria-label="User profile and account settings"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden lg:block text-left text-xs leading-tight">
              <div className="font-semibold text-slate-900 dark:text-slate-100">{user?.name || 'User'}</div>
              <div className="text-slate-500 dark:text-slate-400 capitalize">{user?.role || 'admin'}</div>
            </div>
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-40 text-sm divide-y divide-slate-100 dark:divide-slate-700/80">
              <div className="px-4 py-2.5">
                <p className="font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200">
                  <Shield className="w-3 h-3" /> Role: {user?.role.toUpperCase()}
                </div>
              </div>

              {/* Fast Role Simulator for QA testing of modular permissions */}
              <div className="px-4 py-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium block mb-1">Simulate User Role:</span>
                <div className="grid grid-cols-3 gap-1">
                  {roles.map(r => (
                    <button
                      key={r}
                      onClick={() => switchRole(r)}
                      className={`px-1.5 py-1 rounded text-[10px] font-medium uppercase tracking-wider text-center transition-colors ${
                        user?.role === r
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-1">
                <button
                  id="btn-menu-profile"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenProfileModal();
                  }}
                  className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-500" /> Account Profile
                </button>
                <button
                  id="btn-menu-settings"
                  onClick={() => {
                    setIsProfileOpen(false);
                    onNavigateToSettings();
                  }}
                  className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60 flex items-center gap-2.5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-slate-500" /> Business Settings
                </button>
              </div>

              <div className="py-1">
                <button
                  id="btn-menu-logout"
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2.5 font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
