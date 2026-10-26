import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Package,
  ShoppingBag,
  Truck,
  User,
  X,
  ArrowRight,
  CornerDownLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Boxes,
  Eye,
  History,
  TrendingUp,
} from 'lucide-react';
import { db } from '../../services/database';
import { Product, ProductVariant, Order, Purchase, Customer } from '../../types';
import { useSettings } from '../../context/SettingsContext';

export type SearchCategory = 'all' | 'products' | 'orders' | 'purchases' | 'customers';

export interface SearchResultItem {
  id: string;
  type: 'product' | 'order' | 'purchase' | 'customer';
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'slate';
  metaRight?: string;
  metaSecondary?: string;
  data: any;
  variant?: ProductVariant;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProduct: (product: Product, variant?: ProductVariant, searchTerm?: string) => void;
  onNavigateToOrder: (order: Order) => void;
  onNavigateToPurchase: (purchase: Purchase) => void;
  onNavigateToCustomer?: (customer: Customer) => void;
  onOpenAiAssistant?: (initialQuery?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateToProduct,
  onNavigateToOrder,
  onNavigateToPurchase,
  onNavigateToCustomer,
  onOpenAiAssistant,
}) => {
  const { formatMoney } = useSettings();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('erp_recent_searches');
      return saved ? JSON.parse(saved) : ['Wireless Mouse', 'PO-000001', '000001'];
    } catch {
      return ['Wireless Mouse', 'PO-000001', '000001'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const saveRecentSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem('erp_recent_searches', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    try {
      localStorage.setItem('erp_recent_searches', JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
  };

  // Perform database indexing & search
  const { products, orders, purchases, customers } = useMemo(() => {
    if (!isOpen) {
      return { products: [], orders: [], purchases: [], customers: [] };
    }
    return {
      products: db.getProducts(true),
      orders: db.getOrders(),
      purchases: db.getPurchases(),
      customers: db.getCustomers(),
    };
  }, [isOpen]);

  const results: SearchResultItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. PRODUCTS & VARIANTS
    if (activeCategory === 'all' || activeCategory === 'products') {
      for (const prod of products) {
        const prodMatches =
          prod.name.toLowerCase().includes(q) ||
          prod.sku.toLowerCase().includes(q) ||
          (prod.barcode && prod.barcode.toLowerCase().includes(q)) ||
          (prod.sourcing_agency && prod.sourcing_agency.toLowerCase().includes(q));

        if (prodMatches) {
          const isLowStock = prod.units <= 10 && prod.units > 0;
          const isOutOfStock = prod.units <= 0;

          items.push({
            id: `prod-${prod.id}`,
            type: 'product',
            title: prod.name,
            subtitle: `SKU: ${prod.sku}${prod.sourcing_agency ? ` • Vendor: ${prod.sourcing_agency}` : ''}`,
            badge: isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (${prod.units})` : `In Stock (${prod.units})`,
            badgeColor: isOutOfStock ? 'red' : isLowStock ? 'amber' : 'green',
            metaRight: formatMoney(prod.selling_price),
            metaSecondary: prod.item_type === 'variant' ? `${prod.variants?.length || 0} Variants` : 'Single Item',
            data: prod,
          });
        }

        // Search variants
        if (prod.variants && prod.variants.length > 0) {
          for (const variant of prod.variants) {
            const variantMatches =
              variant.variant_name.toLowerCase().includes(q) ||
              variant.sku.toLowerCase().includes(q) ||
              (variant.barcode && variant.barcode.toLowerCase().includes(q));

            if (variantMatches && !prodMatches) {
              const isVarLow = variant.units <= 10 && variant.units > 0;
              const isVarOut = variant.units <= 0;

              items.push({
                id: `prod-${prod.id}-var-${variant.id}`,
                type: 'product',
                title: `${prod.name} (${variant.variant_name})`,
                subtitle: `Variant SKU: ${variant.sku} • Parent: ${prod.sku}`,
                badge: isVarOut ? 'Out of Stock' : isVarLow ? `Low Stock (${variant.units})` : `${variant.units} Units`,
                badgeColor: isVarOut ? 'red' : isVarLow ? 'amber' : 'green',
                metaRight: formatMoney(variant.selling_price || prod.selling_price),
                metaSecondary: 'Product Variant',
                data: prod,
                variant,
              });
            }
          }
        }
      }
    }

    // 2. SALES ORDERS
    if (activeCategory === 'all' || activeCategory === 'orders') {
      for (const ord of orders) {
        const orderNum = ord.order_number || '';
        const custName = ord.customer_name || '';
        const custPhone = ord.customer_phone || '';
        const custEmail = ord.customer_email || '';
        const channelName = ord.sales_channel_name || '';
        const itemNames = ord.items?.map(i => i.product_name + ' ' + (i.sku || '')).join(' ') || '';

        const orderMatches =
          orderNum.toLowerCase().includes(q) ||
          custName.toLowerCase().includes(q) ||
          custPhone.toLowerCase().includes(q) ||
          custEmail.toLowerCase().includes(q) ||
          channelName.toLowerCase().includes(q) ||
          itemNames.toLowerCase().includes(q);

        if (orderMatches) {
          let badgeColor: 'blue' | 'green' | 'amber' | 'red' | 'purple' = 'blue';
          if (ord.status === 'Delivered') badgeColor = 'green';
          else if (ord.status === 'Pending') badgeColor = 'amber';
          else if (ord.status === 'Cancelled') badgeColor = 'red';
          else if (ord.status === 'Shipped') badgeColor = 'purple';

          const itemsSummary = ord.items && ord.items.length > 0
            ? `${ord.items.length} ${ord.items.length === 1 ? 'item' : 'items'} (${ord.items[0].product_name}${ord.items.length > 1 ? '...' : ''})`
            : 'Order details';

          items.push({
            id: `ord-${ord.id}`,
            type: 'order',
            title: `Order #${ord.order_number} - ${ord.customer_name}`,
            subtitle: `${itemsSummary} • Channel: ${ord.sales_channel_name || 'Standard'}`,
            badge: ord.status,
            badgeColor,
            metaRight: formatMoney(ord.total_amount),
            metaSecondary: ord.order_date,
            data: ord,
          });
        }
      }
    }

    // 3. PURCHASE RECORDS
    if (activeCategory === 'all' || activeCategory === 'purchases') {
      for (const pur of purchases) {
        const poNum = pur.po_number || pur.purchase_number || '';
        const vendor = pur.vendor_name || pur.sourcing_agency || '';
        const contact = pur.vendor_contact || '';
        const itemNames = pur.items?.map(i => (i.product_name || i.item_name || '') + ' ' + (i.sku || '')).join(' ') || '';

        const purMatches =
          poNum.toLowerCase().includes(q) ||
          vendor.toLowerCase().includes(q) ||
          contact.toLowerCase().includes(q) ||
          itemNames.toLowerCase().includes(q);

        if (purMatches) {
          let badgeColor: 'blue' | 'green' | 'amber' | 'red' = 'blue';
          if (pur.status === 'Received') badgeColor = 'green';
          else if (pur.status === 'Draft') badgeColor = 'amber';
          else if (pur.status === 'Cancelled') badgeColor = 'red';

          items.push({
            id: `pur-${pur.id}`,
            type: 'purchase',
            title: `PO #${poNum} - ${vendor}`,
            subtitle: `${pur.item_count || pur.items?.length || 0} Units • Payment: ${pur.payment_status}`,
            badge: pur.status,
            badgeColor,
            metaRight: formatMoney(pur.grand_total),
            metaSecondary: pur.purchase_date || pur.order_date,
            data: pur,
          });
        }
      }
    }

    // 4. CUSTOMERS
    if (activeCategory === 'all' || activeCategory === 'customers') {
      for (const cust of customers) {
        const custMatches =
          cust.name.toLowerCase().includes(q) ||
          (cust.phone && cust.phone.toLowerCase().includes(q)) ||
          (cust.email && cust.email.toLowerCase().includes(q)) ||
          (cust.address && cust.address.toLowerCase().includes(q));

        if (custMatches) {
          items.push({
            id: `cust-${cust.id}`,
            type: 'customer',
            title: cust.name,
            subtitle: `${cust.phone || 'No phone'} • ${cust.email || 'No email'}`,
            badge: `${cust.total_orders} Orders`,
            badgeColor: 'blue',
            metaRight: formatMoney(cust.total_spent),
            metaSecondary: 'Customer Profile',
            data: cust,
          });
        }
      }
    }

    return items;
  }, [query, activeCategory, products, orders, purchases, customers, formatMoney]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { all: 0, products: 0, orders: 0, purchases: 0, customers: 0 };

    let pCount = 0;
    for (const p of products) {
      if (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sourcing_agency && p.sourcing_agency.toLowerCase().includes(q)) ||
        p.variants?.some(v => v.variant_name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q))
      ) {
        pCount++;
      }
    }

    let oCount = 0;
    for (const o of orders) {
      if (
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.customer_name || '').toLowerCase().includes(q) ||
        (o.customer_phone || '').toLowerCase().includes(q) ||
        o.items?.some(i => (i.product_name || '').toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q))
      ) {
        oCount++;
      }
    }

    let purCount = 0;
    for (const pur of purchases) {
      if (
        (pur.po_number || pur.purchase_number || '').toLowerCase().includes(q) ||
        (pur.vendor_name || pur.sourcing_agency || '').toLowerCase().includes(q) ||
        pur.items?.some(i => (i.product_name || i.item_name || '').toLowerCase().includes(q))
      ) {
        purCount++;
      }
    }

    let cCount = 0;
    for (const c of customers) {
      if (
        c.name.toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q)
      ) {
        cCount++;
      }
    }

    return {
      all: pCount + oCount + purCount + cCount,
      products: pCount,
      orders: oCount,
      purchases: purCount,
      customers: cCount,
    };
  }, [query, products, orders, purchases, customers]);

  // Reset selected index when query or category changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  const handleSelectResult = (item: SearchResultItem) => {
    saveRecentSearch(query || item.title);
    onClose();

    if (item.type === 'product') {
      onNavigateToProduct(item.data, item.variant, item.data.name);
    } else if (item.type === 'order') {
      onNavigateToOrder(item.data);
    } else if (item.type === 'purchase') {
      onNavigateToPurchase(item.data);
    } else if (item.type === 'customer' && onNavigateToCustomer) {
      onNavigateToCustomer(item.data);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
      scrollItemIntoView((selectedIndex + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
      scrollItemIntoView((selectedIndex - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = results[selectedIndex];
      if (current) {
        handleSelectResult(current);
      }
    }
  };

  const scrollItemIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-search-item]');
    const target = items[index] as HTMLElement;
    if (target) {
      target.scrollIntoView({ block: 'nearest' });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="global-search-modal"
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products, SKUs, sales orders, POs, vendors, or customers..."
            className="flex-1 bg-transparent border-none text-sm sm:text-base text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-0 font-medium"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md">
            ESC
          </kbd>
        </div>

        {/* Category Tabs */}
        <div className="px-3 sm:px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            All {query && <span className="text-[10px] opacity-80">({categoryCounts.all})</span>}
          </button>

          <button
            onClick={() => setActiveCategory('products')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeCategory === 'products'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Package className="w-3 h-3" />
            Products {query && <span className="text-[10px] opacity-80">({categoryCounts.products})</span>}
          </button>

          <button
            onClick={() => setActiveCategory('orders')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeCategory === 'orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            Sales Orders {query && <span className="text-[10px] opacity-80">({categoryCounts.orders})</span>}
          </button>

          <button
            onClick={() => setActiveCategory('purchases')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeCategory === 'purchases'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <Truck className="w-3 h-3" />
            Purchase Records {query && <span className="text-[10px] opacity-80">({categoryCounts.purchases})</span>}
          </button>

          <button
            onClick={() => setActiveCategory('customers')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeCategory === 'customers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800'
            }`}
          >
            <User className="w-3 h-3" />
            Customers {query && <span className="text-[10px] opacity-80">({categoryCounts.customers})</span>}
          </button>
        </div>

        {/* Results List or Empty State */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1">
          {query.trim() === '' ? (
            /* Idle / Quick Suggestions View */
            <div className="py-4 px-3 space-y-5 text-slate-500 dark:text-slate-400">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Recent Searches
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {recentSearches.map(term => (
                      <div
                        key={term}
                        onClick={() => {
                          setQuery(term);
                          inputRef.current?.focus();
                        }}
                        className="group flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-medium cursor-pointer border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        <span>{term}</span>
                        <button
                          onClick={e => removeRecentSearch(e, term)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 opacity-60 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Jump Shortcuts */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Fast Jump Shortcuts
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setQuery('Low Stock');
                      inputRef.current?.focus();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/50">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">Low Stock Items</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">View products needing restocking</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setQuery('Pending');
                      inputRef.current?.focus();
                    }}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-left transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/50">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">Pending Orders</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Fulfill queued customer shipments</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* AI Assistant Banner */}
              {onOpenAiAssistant && (
                <div
                  onClick={() => {
                    onClose();
                    onOpenAiAssistant();
                  }}
                  className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Ask Gemini ERP Assistant
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Ask complex multi-turn questions about inventory, margins &amp; order trends
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              )}
            </div>
          ) : results.length === 0 ? (
            /* Empty Results View */
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  No matching records found for "{query}"
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Try searching by product name, variant SKU, customer name, PO number, or invoice code.
                </p>
              </div>

              {onOpenAiAssistant && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAiAssistant(`Can you look up info or provide recommendations regarding "${query}"?`);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask Gemini AI Assistant about "{query}"
                </button>
              )}
            </div>
          ) : (
            /* Results List */
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon =
                item.type === 'product'
                  ? Package
                  : item.type === 'order'
                  ? ShoppingBag
                  : item.type === 'purchase'
                  ? Truck
                  : User;

              return (
                <div
                  key={item.id}
                  data-search-item
                  onClick={() => handleSelectResult(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Icon / Type indicator */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        item.type === 'product'
                          ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400'
                          : item.type === 'order'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400'
                          : item.type === 'purchase'
                          ? 'bg-purple-50 dark:bg-purple-950/60 border-purple-200 dark:border-purple-900 text-purple-600 dark:text-purple-400'
                          : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>

                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                              item.badgeColor === 'green'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                : item.badgeColor === 'amber'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                : item.badgeColor === 'red'
                                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                : item.badgeColor === 'purple'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300'
                                : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Right metadata and action prompt */}
                  <div className="text-right shrink-0">
                    {item.metaRight && (
                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                        {item.metaRight}
                      </div>
                    )}
                    {item.metaSecondary && (
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">
                        {item.metaSecondary}
                      </div>
                    )}
                    {isSelected && (
                      <div className="hidden sm:flex items-center justify-end gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                        <span>Select</span>
                        <CornerDownLeft className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">
                ↵
              </kbd>{' '}
              Jump to record
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-[10px] font-mono">
                esc
              </kbd>{' '}
              Close
            </span>
          </div>

          <div className="text-slate-400 dark:text-slate-500">
            {results.length > 0 && `${results.length} results`}
          </div>
        </div>
      </div>
    </div>
  );
};
