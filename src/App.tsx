import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingBag,
  Truck,
  FileSpreadsheet,
  Settings,
  ScanBarcode,
  Menu,
  X,
  Bell,
  Search,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { db } from './services/database';
import { usbScanner } from './services/barcode';
import { OrderStatus, Product, ProductVariant, Order, Purchase, Customer } from './types';

// Feature Pages
import { LoginPage } from './features/auth/LoginPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProductListPage } from './features/products/ProductListPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { SalesModule, SalesSubTab } from './features/sales/SalesModule';
import { PurchaseListPage } from './features/purchases/PurchaseListPage';
import { ReportsPage } from './features/reports/ReportsPage';
import { SettingsPage } from './features/settings/SettingsPage';

// Global Modals & Search
import { BarcodeScannerModal } from './features/products/BarcodeScannerModal';
import { AddOrderModal } from './features/sales/AddOrderModal';
import { ProductBarcodeModal } from './features/products/ProductBarcodeModal';
import { GlobalSearchBar } from './components/search/GlobalSearchBar';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { GeminiChatbotModal } from './components/ai/GeminiChatbotModal';
import { ReyraLogo } from './components/brand/ReyraLogo';
import { PWAInstallButton } from './components/common/PWAInstallButton';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export type MainNavigationTab =
  | 'dashboard'
  | 'products'
  | 'inventory'
  | 'sales'
  | 'purchases'
  | 'reports'
  | 'settings';

function MainApp() {
  const { theme } = useTheme();
  const { settings } = useSettings();
  const { currentUser, switchRole, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<MainNavigationTab>('dashboard');
  const [salesSubTab, setSalesSubTab] = useState<SalesSubTab>('orders');
  const [salesStatusFilter, setSalesStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search queries for target tab routing
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [purchaseSearchQuery, setPurchaseSearchQuery] = useState('');

  // Global Modals State
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiChatInitialQuery, setAiChatInitialQuery] = useState<string | undefined>(undefined);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isQuickOrderOpen, setIsQuickOrderOpen] = useState(false);
  const [hardwareScannedToast, setHardwareScannedToast] = useState<string | null>(null);

  // Print barcode modal for any product
  const [printBarcodeProduct, setPrintBarcodeProduct] = useState<{
    product: Product;
    variant?: ProductVariant;
  } | null>(null);

  // Check low stock count for alert badge
  const lowStockCount = db.getLowStockProducts().length;

  // Initialize USB / HID Barcode Scanner Hardware Listener
  useEffect(() => {
    usbScanner.init();
    const unsubscribe = usbScanner.addListener(scannedBarcode => {
      const match = db.findProductByBarcodeOrSku(scannedBarcode);
      if (match) {
        setHardwareScannedToast(
          `Scanned SKU "${scannedBarcode}": Found "${match.product.name}"`
        );
      } else {
        setHardwareScannedToast(`Scanned Barcode: "${scannedBarcode}" (Unrecognized SKU)`);
      }
      setTimeout(() => setHardwareScannedToast(null), 4000);
    });

    return () => {
      unsubscribe();
      usbScanner.destroy();
    };
  }, []);

  const handleNavigateToSalesStatus = (status: OrderStatus | 'ALL') => {
    setSalesSubTab('orders');
    setSalesStatusFilter(status);
    setActiveTab('sales');
  };

  const handleNavigateToProduct = (product: Product, variant?: ProductVariant, searchTerm?: string) => {
    setProductSearchQuery(searchTerm || product.name);
    setActiveTab('products');
  };

  const handleNavigateToOrder = (order: Order) => {
    setOrderSearchQuery(order.order_number);
    setSalesSubTab('orders');
    setSalesStatusFilter('ALL');
    setActiveTab('sales');
  };

  const handleNavigateToPurchase = (purchase: Purchase) => {
    setPurchaseSearchQuery(purchase.po_number || purchase.purchase_number || '');
    setActiveTab('purchases');
  };

  const handleNavigateToCustomer = (customer: Customer) => {
    setSalesSubTab('customers');
    setActiveTab('sales');
  };

  const handleOpenAiAssistant = (initialQuery?: string) => {
    setAiChatInitialQuery(initialQuery);
    setIsAiChatOpen(true);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'sales', label: 'Sales & Orders', icon: ShoppingBag },
    { id: 'purchases', label: 'Procurement', icon: Truck },
    { id: 'reports', label: 'Reports & Analytics', icon: FileSpreadsheet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Auth gate: prompt login dialogue when not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ReyraLogo size="lg" className="animate-pulse" />
          <div className="text-xs font-semibold text-slate-500">Loading REYRA Inventory...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Universal Header */}
      <header className="sticky top-0 z-40 w-full max-w-full overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div
              onClick={() => {
                setActiveTab('dashboard');
                setProductSearchQuery('');
                setOrderSearchQuery('');
                setPurchaseSearchQuery('');
              }}
              className="flex items-center gap-2.5 cursor-pointer select-none group"
              title="Return to Dashboard"
            >
              <ReyraLogo size="md" className="transition-transform group-hover:scale-105 shrink-0" />
              <div className="hidden sm:block truncate">
                {(() => {
                  const rawName = settings.brand_name || 'Reyra Inventory';
                  const match = rawName.match(/^(reyra)\s*(.*)$/i);
                  if (match) {
                    return (
                      <span className="inline-flex items-baseline gap-1.5 leading-none">
                        <span
                          className="font-serif font-medium text-xl sm:text-2xl tracking-normal text-slate-900 dark:text-white"
                          style={{ fontFamily: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif" }}
                        >
                          {match[1]}
                        </span>
                        {match[2] && (
                          <span className="font-sans font-normal text-base sm:text-lg tracking-normal text-slate-600 dark:text-slate-400">
                            {match[2]}
                          </span>
                        )}
                      </span>
                    );
                  }
                  return (
                    <span
                      className="font-serif font-medium text-xl sm:text-2xl tracking-normal text-slate-900 dark:text-white leading-none"
                      style={{ fontFamily: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif" }}
                    >
                      {rawName}
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-md mx-2 hidden md:block min-w-0">
            <GlobalSearchBar onOpen={() => setIsGlobalSearchOpen(true)} className="w-full" />
          </div>

          {/* Right: Actions & AI Assistant */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Search Button */}
            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              title="Global Search (Ctrl+K)"
              aria-label="Open Search"
            >
              <Search className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>

            {/* Gemini AI Assistant Trigger Button */}
            <button
              id="btn-header-gemini-ai"
              onClick={() => handleOpenAiAssistant()}
              className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Open Multi-Turn Gemini ERP AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>

            {/* Low stock warning button */}
            {lowStockCount > 0 && (
              <button
                onClick={() => setActiveTab('inventory')}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors"
                title="View Low Stock Items"
              >
                <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                <span>{lowStockCount} Low Stock</span>
              </button>
            )}

            {/* Barcode Scanner Modal Trigger */}
            <button
              id="btn-global-scanner"
              onClick={() => setIsBarcodeScannerOpen(true)}
              className="px-2.5 sm:px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
              title="Open Barcode Scanner (Camera & USB Scanner)"
            >
              <ScanBarcode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="hidden lg:inline">Scan Barcode</span>
            </button>

            {/* Offline PWA Install Button */}
            <PWAInstallButton />
          </div>
        </div>
      </header>

      {/* Hardware Barcode Scan Toast */}
      {hardwareScannedToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl shadow-2xl border border-blue-500 flex items-center gap-3 animate-in slide-in-from-bottom duration-200 text-xs font-medium">
          <ScanBarcode className="w-5 h-5 text-blue-400 shrink-0" />
          <span>{hardwareScannedToast}</span>
        </div>
      )}

      {/* Main App Layout with Sidebar and Content View */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-2 shadow-2xs space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id as MainNavigationTab);
                    if (item.id === 'sales') {
                      setSalesSubTab('orders');
                      setSalesStatusFilter('ALL');
                    }
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isActive
                          ? 'bg-blue-800 text-white'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex">
            <div className="w-64 bg-white dark:bg-slate-900 h-full p-4 space-y-2 border-r border-slate-200 dark:border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Navigation Menu
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as MainNavigationTab);
                      setIsMobileMenuOpen(false);
                      if (item.id === 'sales') {
                        setSalesSubTab('orders');
                        setSalesStatusFilter('ALL');
                      }
                    }}
                    className={`w-full px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex-1" onClick={() => setIsMobileMenuOpen(false)} />
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigateToProducts={() => setActiveTab('products')}
              onNavigateToInventory={() => setActiveTab('inventory')}
              onNavigateToSalesStatus={handleNavigateToSalesStatus}
              onNavigateToOrdersWithFilter={handleNavigateToSalesStatus}
              onNavigateToReturns={() => {
                setSalesSubTab('returns');
                setActiveTab('sales');
              }}
              onNavigateToInvoices={() => {
                setSalesSubTab('invoices');
                setActiveTab('sales');
              }}
              onOpenNewOrderModal={() => setIsQuickOrderOpen(true)}
            />
          )}

          {activeTab === 'products' && (
            <ProductListPage
              initialSearchQuery={productSearchQuery}
              onOpenBarcodeModal={(product, variant) =>
                setPrintBarcodeProduct({ product, variant })
              }
            />
          )}

          {activeTab === 'inventory' && <InventoryPage />}

          {activeTab === 'sales' && (
            <SalesModule
              initialTab={salesSubTab}
              initialOrderStatusFilter={salesStatusFilter}
              initialSearchQuery={orderSearchQuery}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchaseListPage initialSearchQuery={purchaseSearchQuery} />
          )}

          {activeTab === 'reports' && <ReportsPage />}

          {activeTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Global Search Command Palette Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onNavigateToProduct={handleNavigateToProduct}
        onNavigateToOrder={handleNavigateToOrder}
        onNavigateToPurchase={handleNavigateToPurchase}
        onNavigateToCustomer={handleNavigateToCustomer}
        onOpenAiAssistant={handleOpenAiAssistant}
      />

      {/* Gemini Multi-turn Chatbot Modal */}
      <GeminiChatbotModal
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        initialQuery={aiChatInitialQuery}
      />

      {/* Global Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onProductFound={(product, variant) => {
          setIsBarcodeScannerOpen(false);
          setActiveTab('products');
        }}
      />

      {/* Quick Add Order Modal */}
      <AddOrderModal
        isOpen={isQuickOrderOpen}
        onClose={() => setIsQuickOrderOpen(false)}
        onOrderCreated={() => {
          if (activeTab === 'sales') {
            // refresh happens in component
          }
        }}
      />

      {/* Product Barcode Print Modal */}
      {printBarcodeProduct && (
        <ProductBarcodeModal
          isOpen={Boolean(printBarcodeProduct)}
          onClose={() => setPrintBarcodeProduct(null)}
          product={printBarcodeProduct.product}
          variant={printBarcodeProduct.variant}
        />
      )}

      {/* Offline Status Badge */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
