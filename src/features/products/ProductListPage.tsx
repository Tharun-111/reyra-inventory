import React, { useState, useMemo } from 'react';
import {
  Plus,
  Scan,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Archive,
  RotateCcw,
  Edit2,
  Barcode,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { db } from '../../services/database';
import { Product, ProductVariant } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { ProductFormModal } from './ProductFormModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { ProductBarcodeModal } from './ProductBarcodeModal';

interface ProductListPageProps {
  onSelectProductForSale?: (product: Product, variant?: ProductVariant) => void;
  onOpenBarcodeModal?: (product: Product, variant?: ProductVariant) => void;
  initialSearchQuery?: string;
}

export const ProductListPage: React.FC<ProductListPageProps> = ({
  onSelectProductForSale,
  onOpenBarcodeModal,
  initialSearchQuery = '',
}) => {
  const { formatMoney } = useSettings();

  // State
  const [products, setProducts] = useState<Product[]>(() => db.getProducts(true));
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  React.useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      setCurrentPage(1);
    }
  }, [initialSearchQuery]);
  const [filterArchived, setFilterArchived] = useState<'active' | 'archived' | 'all'>('active');
  const [sortBy, setSortBy] = useState<'name' | 'units' | 'buy_price' | 'selling_price' | 'revenue'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [barcodeModalState, setBarcodeModalState] = useState<{
    isOpen: boolean;
    product: Product | null;
    variant?: ProductVariant | null;
  }>({ isOpen: false, product: null });

  // Expanded variant rows
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});

  const refreshProducts = () => {
    setProducts(db.getProducts(true));
  };

  const handleArchive = (id: string) => {
    db.archiveProduct(id);
    refreshProducts();
  };

  const handleRestore = (id: string) => {
    db.restoreProduct(id);
    refreshProducts();
  };

  const toggleVariantsExpand = (productId: string) => {
    setExpandedVariants(prev => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  // Filter and Sort
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Archive filter
      if (filterArchived === 'active' && p.is_archived) return false;
      if (filterArchived === 'archived' && !p.is_archived) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSKU = p.sku.toLowerCase().includes(q);
      const matchAgency = p.sourcing_agency?.toLowerCase().includes(q);
      const matchVariant = p.variants?.some(
        v => v.sku.toLowerCase().includes(q) || v.variant_name.toLowerCase().includes(q)
      );

      return matchName || matchSKU || matchAgency || matchVariant;
    });
  }, [products, searchQuery, filterArchived]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let aVal: any = a[sortBy as keyof Product] ?? 0;
      let bVal: any = b[sortBy as keyof Product] ?? 0;

      if (sortBy === 'revenue') {
        aVal = a.selling_price * a.units;
        bVal = b.selling_price * b.units;
      }

      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [filteredProducts, sortBy, sortAsc]);

  // Pagination
  const totalPages = Math.max(Math.ceil(sortedProducts.length / pageSize), 1);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  return (
    <div id="products-page-container" className="space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Products & Items Catalog
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage SKU inventory, variants, purchase cost and sale prices
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            id="btn-open-scanner"
            onClick={() => setIsScannerOpen(true)}
            className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors"
            title="Scan Barcode / SKU"
          >
            <Scan className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Barcode Scanner</span>
          </button>

          <button
            id="btn-add-product"
            onClick={() => {
              setEditingProduct(null);
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, SKU, variant..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        {/* Right Status Filter Chips */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => {
                setFilterArchived('active');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterArchived === 'active'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Active Items ({products.filter(p => !p.is_archived).length})
            </button>
            <button
              onClick={() => {
                setFilterArchived('archived');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterArchived === 'archived'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Archived ({products.filter(p => p.is_archived).length})
            </button>
            <button
              onClick={() => {
                setFilterArchived('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                filterArchived === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All ({products.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Product Name & SKU</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('units')}
                >
                  <div className="flex items-center gap-1">
                    Quantity {sortBy === 'units' && (sortAsc ? '↑' : '↓')}
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('buy_price')}
                >
                  <div className="flex items-center gap-1">
                    Buy Price {sortBy === 'buy_price' && (sortAsc ? '↑' : '↓')}
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('selling_price')}
                >
                  <div className="flex items-center gap-1">
                    Sale Price {sortBy === 'selling_price' && (sortAsc ? '↑' : '↓')}
                  </div>
                </th>
                <th className="py-3 px-4">MRP</th>
                <th className="py-3 px-4">Expense</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => handleSort('revenue')}
                >
                  <div className="flex items-center gap-1">
                    Revenue (Potential) {sortBy === 'revenue' && (sortAsc ? '↑' : '↓')}
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map(p => {
                  const expense = p.buy_price * p.units;
                  const potentialRevenue = p.selling_price * p.units;
                  const hasVariants = p.item_type === 'variant' && p.variants && p.variants.length > 0;
                  const isExpanded = Boolean(expandedVariants[p.id]);

                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          p.is_archived ? 'opacity-60 bg-slate-50/40 dark:bg-slate-900/40' : ''
                        }`}
                      >
                        {/* Product Name & SKU */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {/* Product Thumbnail */}
                            {p.images && p.images.length > 0 ? (
                              <img
                                src={p.images[0]}
                                alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                  {p.name}
                                </span>
                                {hasVariants && (
                                  <button
                                    onClick={() => toggleVariantsExpand(p.id)}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Layers className="w-3 h-3" />
                                    {p.variants.length} Variants
                                    <ChevronDown
                                      className={`w-3 h-3 transition-transform ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono text-[11px] mt-0.5">
                                <span>SKU: {p.sku}</span>
                                {p.sourcing_agency && (
                                  <>
                                    <span>•</span>
                                    <span className="font-sans">{p.sourcing_agency}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                              p.units === 0
                                ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
                                : p.units < 10
                                ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {p.units} units
                          </span>
                        </td>

                        {/* Buy Price */}
                        <td className="py-3 px-4 font-medium">{formatMoney(p.buy_price)}</td>

                        {/* Sale Price */}
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {formatMoney(p.selling_price)}
                          {p.discount > 0 && (
                            <span className="ml-1 text-[10px] text-emerald-600 font-medium">
                              (-{p.discount}%)
                            </span>
                          )}
                        </td>

                        {/* MRP */}
                        <td className="py-3 px-4 text-slate-500 line-through">
                          {formatMoney(p.mrp)}
                        </td>

                        {/* Expense (Units * Buy Price) */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {formatMoney(expense)}
                        </td>

                        {/* Revenue */}
                        <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatMoney(potentialRevenue)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Barcode Label Modal trigger */}
                            <button
                              onClick={() => setBarcodeModalState({ isOpen: true, product: p })}
                              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="View & Print Barcode"
                            >
                              <Barcode className="w-4 h-4" />
                            </button>

                            {/* Edit */}
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Soft Delete / Archive or Restore */}
                            {p.is_archived ? (
                              <button
                                onClick={() => handleRestore(p.id)}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors"
                                title="Restore Product"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleArchive(p.id)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 rounded-lg transition-colors"
                                title="Archive / Deactivate Product"
                              >
                                <Archive className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Variants Sub-Rows */}
                      {hasVariants && isExpanded && (
                        <tr className="bg-blue-50/30 dark:bg-slate-800/30">
                          <td colSpan={8} className="p-3 pl-14">
                            <div className="space-y-1.5 border-l-2 border-blue-500 pl-3">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                                Variant Details
                              </span>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {p.variants.map(v => (
                                  <div
                                    key={v.id}
                                    className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between"
                                  >
                                    <div>
                                      <div className="font-semibold text-slate-900 dark:text-white">
                                        {v.variant_name}
                                      </div>
                                      <div className="text-[11px] font-mono text-slate-500">
                                        SKU: {v.sku}
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                        Stock: <strong>{v.units}</strong> • Price:{' '}
                                        <strong className="text-slate-900 dark:text-white">
                                          {formatMoney(v.selling_price)}
                                        </strong>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() =>
                                        setBarcodeModalState({ isOpen: true, product: p, variant: v })
                                      }
                                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                      title="Print Variant Barcode"
                                    >
                                      <Barcode className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedProducts.length)} of {sortedProducts.length} items
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Previous
            </button>
            <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={refreshProducts}
        editingProduct={editingProduct}
      />

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectProductForSale={onSelectProductForSale}
        onEditProduct={prod => {
          setEditingProduct(prod);
          setIsAddModalOpen(true);
        }}
      />

      {/* Barcode Label Modal */}
      <ProductBarcodeModal
        isOpen={barcodeModalState.isOpen}
        onClose={() => setBarcodeModalState({ isOpen: false, product: null })}
        product={barcodeModalState.product}
        variant={barcodeModalState.variant}
      />
    </div>
  );
};
