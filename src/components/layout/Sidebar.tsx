import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  TrendingUp,
  ShoppingBag,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Settings as SettingsIcon,
} from 'lucide-react';

export type NavPage = 'dashboard' | 'products' | 'inventory' | 'sales' | 'purchases' | 'documents' | 'settings';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('erp_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('erp_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'products', label: 'Products / Items', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
    { id: 'documents', label: 'Documents', icon: FileText },
  ];

  const handleNavClick = (page: NavPage) => {
    onSelectPage(page);
    if (isOpenMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 ease-in-out ${
          isCollapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          isOpenMobile ? 'translate-x-0 w-64 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="h-16 flex lg:hidden items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <span className="font-semibold text-slate-900 dark:text-white">Navigation</span>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                } ${isCollapsed ? 'lg:justify-center' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                  }`}
                />
                <span className={`truncate whitespace-nowrap ${isCollapsed ? 'lg:hidden' : 'block'}`}>
                  {item.label}
                </span>

                {/* Tooltip on collapsed desktop view */}
                {isCollapsed && (
                  <div className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-md whitespace-nowrap shadow-lg z-50 pointer-events-none items-center">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer: Collapse/Expand Desktop Button */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 hidden lg:flex items-center justify-between">
          <button
            id="btn-toggle-sidebar-desktop"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`w-full flex items-center justify-center p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-medium gap-2 ${
              isCollapsed ? '' : ''
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
