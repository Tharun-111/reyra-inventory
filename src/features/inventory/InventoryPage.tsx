import React, { useState, useMemo } from 'react';
import {
  Boxes,
  History,
  Check,
  Edit3,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Search,
  Layers,
  Save,
  Sliders,
  Barcode,
  Printer,
} from 'lucide-react';
import { db } from '../../services/database';
import { Product, InventoryMovement } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { InventoryBarcodePrintModal } from './InventoryBarcodePrintModal';

export const InventoryPage: React.FC = () => {
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState<'inventory' | 'ledger'>('inventory');
  const [products, setProducts] = useState<Product[]>(() => db.getProducts(false));
  const [movements, setMovements] = useState<InventoryMovement[]>(() => db.getInventoryMovements());
  const [searchQuery, setSearchQuery] = useState('');

  // Editing state for inline edits
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editUnits, setEditUnits] = useState<number>(0);
  const [editDiscount, setEditDiscount] = useState<number>(0);

  // Stock Adjustment Modal
  const [adjustModalState, setAdjustModalState] = useState<{
    isOpen: boolean;
    product: Product | null;
    variantId?: string;
    variantName?: string;
  }>({ isOpen: false, product: null });
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('Physical Audit Count Correction');

  // Barcode Printing State
  const [isBarcodePrintModalOpen, setIsBarcodePrintModalOpen] = useState(false);
  const [printTargetProductId, setPrintTargetProductId] = useState<string | undefined>(undefined);
  const [printTargetVariantId, setPrintTargetVariantId] = useState<string | undefined>(undefined);

  const refreshData = () => {
    setProducts(db.getProducts(false));
    setMovements(db.getInventoryMovements());
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.variants?.some(v => v.variant_name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q))
    );
  }, [products, searchQuery]);

  // Filtered Movements
  const filteredMovements = useMemo(() => {
    if (!searchQuery.trim()) return movements;
    const q = searchQuery.toLowerCase();
    return movements.filter(
      m =>
        m.product_name.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        m.reference_number?.toLowerCase().includes(q) ||
        m.reason.toLowerCase().includes(q)
    );
  }, [movements, searchQuery]);

  const handleStartInlineEdit = (p: Product) => {
    setEditingRowId(p.id);
    setEditUnits(p.units ?? 0);
    setEditDiscount(p.discount ?? 0);
  };

  const handleSaveInlineEdit = (productId: string) => {
    if (editUnits < 0 && !settings.allow_negative_stock) {
      alert('Negative inventory is disabled in business settings.');
      return;
    }
    db.updateProductUnitsAndDiscount(productId, editUnits, editDiscount);
    setEditingRowId(null);
    refreshData();
  };

  const handleOpenAdjustModal = (p: Product, variantId?: string, variantName?: string) => {
    const currentUnits = variantId
      ? p.variants?.find(v => v.id === variantId)?.units ?? 0
      : p.units ?? 0;
    setAdjustModalState({
      isOpen: true,
      product: p,
      variantId,
      variantName,
    });
    setAdjustQty(currentUnits);
    setAdjustReason('Physical Audit Count Correction');
  };

  const handleSaveAdjustment = () => {
    if (!adjustModalState.product) return;
    if (adjustQty < 0 && !settings.allow_negative_stock) {
      alert('Negative stock units are prohibited by policy.');
      return;
    }

    const currentUnits = adjustModalState.variantId
      ? adjustModalState.product.variants?.find(v => v.id === adjustModalState.variantId)?.units || 0
      : adjustModalState.product.units;

    const discount = adjustModalState.variantId
      ? adjustModalState.product.variants?.find(v => v.id === adjustModalState.variantId)?.discount || 0
      : adjustModalState.product.discount;

    db.updateProductUnitsAndDiscount(
      adjustModalState.product.id,
      adjustQty,
      discount,
      adjustModalState.variantId
    );

    setAdjustModalState({ isOpen: false, product: null });
    refreshData();
  };

  return (
    <div id="inventory-page-container" className="space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Inventory Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Stock levels, inline unit adjustments, and auditable movement ledger
          </p>
        </div>

        {/* Right: Print Barcodes Button & View Toggle Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            id="btn-inventory-print-barcodes"
            type="button"
            onClick={() => {
              setPrintTargetProductId(undefined);
              setPrintTargetVariantId(undefined);
              setIsBarcodePrintModalOpen(true);
            }}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Open Barcode Label Printing Studio"
          >
            <Barcode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Print Barcodes</span>
          </button>

          {/* View Toggle Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xs">
            <button
              id="tab-inventory-stock"
              onClick={() => setActiveTab('inventory')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Boxes className="w-4 h-4" /> Live Stock Overview
            </button>
            <button
              id="tab-inventory-ledger"
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'ledger'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <History className="w-4 h-4" /> Auditable Movements Ledger
            </button>
          </div>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'inventory' ? 'Search inventory products...' : 'Search ledger by SKU, order, reason...'
            }
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Healthy Stock
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Low Stock (&lt;{settings.low_stock_threshold})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Out of Stock
          </span>
        </div>
      </div>

      {/* TAB 1: Live Inventory Table */}
      {activeTab === 'inventory' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Variants</th>
                  <th className="py-3 px-4">Units (Editable)</th>
                  <th className="py-3 px-4">Discount % (Editable)</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredProducts.map(p => {
                  const isEditing = editingRowId === p.id;
                  const hasVariants = p.item_type === 'variant' && p.variants && p.variants.length > 0;
                  const isOutOfStock = p.units <= 0;
                  const isLowStock = p.units > 0 && p.units <= settings.low_stock_threshold;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Product Name */}
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">
                            {p.name}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">SKU: {p.sku}</div>
                        </div>
                      </td>

                      {/* Variants / Number of Variants */}
                      <td className="py-3 px-4">
                        {hasVariants ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            <Layers className="w-3.5 h-3.5" />
                            {p.variants.length} variant{p.variants.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">Single (None)</span>
                        )}
                      </td>

                      {/* Units */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editUnits ?? 0}
                            onChange={e => setEditUnits(parseInt(e.target.value) || 0)}
                            className="w-24 px-2 py-1 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        ) : (
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {p.units} units
                          </span>
                        )}
                      </td>

                      {/* Discount */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={editDiscount ?? 0}
                            onChange={e => setEditDiscount(parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border border-blue-500 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                        ) : (
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {p.discount}%
                          </span>
                        )}
                      </td>

                      {/* Stock Status */}
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" /> Available
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isEditing ? (
                            <button
                              onClick={() => handleSaveInlineEdit(p.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                            >
                              <Save className="w-3.5 h-3.5" /> Save
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleStartInlineEdit(p)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Quick Inline Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setPrintTargetProductId(p.id);
                                  setPrintTargetVariantId(undefined);
                                  setIsBarcodePrintModalOpen(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="Print Barcodes for this Product"
                              >
                                <Barcode className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenAdjustModal(p)}
                                className="px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                              >
                                Stock Adjustment
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Auditable Movement Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              Complete Inventory Ledger History ({filteredMovements.length} records)
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Audit-compliant transactional trail
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Product / Variant</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Qty Change</th>
                  <th className="py-3 px-4">Balance After</th>
                  <th className="py-3 px-4">Ref #</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredMovements.map(m => {
                  const isPositive = m.quantity_changed > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                        {new Date(m.created_at).toLocaleString('en-IN', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {m.product_name}
                        {m.variant_name && (
                          <span className="block text-[11px] font-normal text-blue-600">
                            {m.variant_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{m.sku}</td>
                      <td className="py-3 px-4">
                        <span className="capitalize font-semibold text-slate-700 dark:text-slate-300">
                          {m.movement_type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-0.5 font-bold ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {isPositive ? `+${m.quantity_changed}` : m.quantity_changed}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {m.balance_after} units
                      </td>
                      <td className="py-3 px-4 font-mono text-blue-600 dark:text-blue-400">
                        {m.reference_number || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {m.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalState.isOpen && adjustModalState.product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Stock Level Adjustment
                </h3>
                <p className="text-xs text-slate-500">
                  {adjustModalState.product.name}
                  {adjustModalState.variantName && ` (${adjustModalState.variantName})`}
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200">
                  New Verified Stock Quantity:
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustQty}
                  onChange={e => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200">
                  Adjustment Reason / Audit Note:
                </label>
                <select
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Physical Audit Count Correction">Physical Audit Count Correction</option>
                  <option value="Damaged Stock Written Off">Damaged Stock Written Off</option>
                  <option value="Supplier Sample / Demonstration">Supplier Sample / Demonstration</option>
                  <option value="Internal Use">Internal Use</option>
                  <option value="Lost / Unaccounted">Lost / Unaccounted</option>
                </select>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustModalState({ isOpen: false, product: null })}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAdjustment}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-xs transition-colors"
              >
                Save & Update Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Print Studio Modal */}
      <InventoryBarcodePrintModal
        isOpen={isBarcodePrintModalOpen}
        onClose={() => {
          setIsBarcodePrintModalOpen(false);
          setPrintTargetProductId(undefined);
          setPrintTargetVariantId(undefined);
        }}
        products={products}
        initialSelectedProductId={printTargetProductId}
        initialVariantId={printTargetVariantId}
      />
    </div>
  );
};
