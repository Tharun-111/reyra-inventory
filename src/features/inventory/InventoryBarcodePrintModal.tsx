import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  FileDown,
  Barcode,
  CheckSquare,
  Square,
  Search,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Product, ProductVariant } from '../../types';
import { renderBarcode } from '../../services/barcode';
import { useSettings } from '../../context/SettingsContext';

interface InventoryBarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  initialSelectedProductId?: string;
  initialVariantId?: string;
}

interface LabelPrintItem {
  id: string; // unique key (productId or productId-variantId)
  product: Product;
  variant?: ProductVariant;
  name: string;
  sku: string;
  barcode: string;
  mrp: number;
  sellingPrice: number;
  stockUnits: number;
  printQty: number;
  isSelected: boolean;
}

type QuantityPreset = 'single' | 'stock' | 'custom';
type LabelLayout = 'grid' | 'thermal';

export const InventoryBarcodePrintModal: React.FC<InventoryBarcodePrintModalProps> = ({
  isOpen,
  onClose,
  products,
  initialSelectedProductId,
  initialVariantId,
}) => {
  const { formatMoney, settings } = useSettings();

  const [labelItems, setLabelItems] = useState<LabelPrintItem[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [quantityPreset, setQuantityPreset] = useState<QuantityPreset>('single');
  const [labelLayout, setLabelLayout] = useState<LabelLayout>('grid');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  // Display toggles
  const [showBrand, setShowBrand] = useState(true);
  const [showSku, setShowSku] = useState(true);
  const [showPrice, setShowPrice] = useState(true);

  // Initialize label items when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const items: LabelPrintItem[] = [];

    products.forEach(p => {
      if (p.item_type === 'variant' && p.variants && p.variants.length > 0) {
        p.variants.forEach(v => {
          const isTarget = initialSelectedProductId === p.id && (!initialVariantId || initialVariantId === v.id);
          items.push({
            id: `${p.id}-${v.id}`,
            product: p,
            variant: v,
            name: `${p.name} (${v.variant_name})`,
            sku: v.sku || p.sku,
            barcode: v.barcode || v.sku || p.barcode || p.sku,
            mrp: v.mrp || p.mrp || 0,
            sellingPrice: v.selling_price || p.selling_price || 0,
            stockUnits: v.units ?? 0,
            printQty: initialSelectedProductId ? (isTarget ? 1 : 0) : 1,
            isSelected: initialSelectedProductId ? isTarget : true,
          });
        });
      } else {
        const isTarget = !initialSelectedProductId || initialSelectedProductId === p.id;
        items.push({
          id: p.id,
          product: p,
          name: p.name,
          sku: p.sku,
          barcode: p.barcode || p.sku,
          mrp: p.mrp || 0,
          sellingPrice: p.selling_price || 0,
          stockUnits: p.units ?? 0,
          printQty: initialSelectedProductId ? (isTarget ? 1 : 0) : 1,
          isSelected: isTarget,
        });
      }
    });

    setLabelItems(items);
    setSearchFilter('');
    setQuantityPreset('single');
  }, [isOpen, products, initialSelectedProductId, initialVariantId]);

  // Apply quantity presets
  const handleApplyPreset = (preset: QuantityPreset) => {
    setQuantityPreset(preset);
    setLabelItems(prev =>
      prev.map(item => {
        if (!item.isSelected) return item;
        if (preset === 'single') {
          return { ...item, printQty: 1 };
        }
        if (preset === 'stock') {
          return { ...item, printQty: Math.max(1, item.stockUnits) };
        }
        return item;
      })
    );
  };

  const handleToggleSelectAll = (select: boolean) => {
    setLabelItems(prev =>
      prev.map(item => ({
        ...item,
        isSelected: select,
        printQty: select ? (item.printQty > 0 ? item.printQty : 1) : 0,
      }))
    );
  };

  const handleToggleItem = (id: string) => {
    setLabelItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextSelect = !item.isSelected;
          return {
            ...item,
            isSelected: nextSelect,
            printQty: nextSelect ? (item.printQty > 0 ? item.printQty : 1) : 0,
          };
        }
        return item;
      })
    );
  };

  const handleUpdateQty = (id: string, qty: number) => {
    const validQty = Math.max(0, qty);
    setLabelItems(prev =>
      prev.map(item =>
        item.id === id
          ? {
              ...item,
              printQty: validQty,
              isSelected: validQty > 0,
            }
          : item
      )
    );
  };

  // Generate flattened array of labels to render and download
  const flattenedLabels = useMemo(() => {
    const list: LabelPrintItem[] = [];
    labelItems.forEach(item => {
      if (item.isSelected && item.printQty > 0) {
        for (let i = 0; i < item.printQty; i++) {
          list.push(item);
        }
      }
    });
    return list;
  }, [labelItems]);

  const filteredItems = useMemo(() => {
    if (!searchFilter.trim()) return labelItems;
    const q = searchFilter.toLowerCase();
    return labelItems.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.barcode.toLowerCase().includes(q)
    );
  }, [labelItems, searchFilter]);

  const totalSelectedCount = labelItems.filter(i => i.isSelected).length;

  if (!isOpen) return null;

  const handleDownload = async () => {
    const preview = document.getElementById('printable-barcode-container');
    if (!preview || flattenedLabels.length === 0 || isDownloading) return;

    setIsDownloading(true);
    setDownloadError('');
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: labelLayout === 'thermal' ? [80, 50] : 'a4',
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = labelLayout === 'grid' ? 8 : 3;
      const columns = labelLayout === 'grid' ? 3 : 1;
      const rows = labelLayout === 'grid' ? 8 : 1;
      const gap = labelLayout === 'grid' ? 2 : 0;
      const cellWidth = (pageWidth - margin * 2 - gap * (columns - 1)) / columns;
      const cellHeight = (pageHeight - margin * 2 - gap * (rows - 1)) / rows;
      const barcodeSvgs = preview.querySelectorAll<SVGSVGElement>('.barcode-print-sticker svg');

      for (let index = 0; index < flattenedLabels.length; index++) {
        if (index > 0 && index % (columns * rows) === 0) pdf.addPage();

        const barcodeSvg = barcodeSvgs[index];
        if (!barcodeSvg) throw new Error(`Barcode ${index + 1} is missing from the preview.`);
        const barcodeUrl = URL.createObjectURL(new Blob(
          [new XMLSerializer().serializeToString(barcodeSvg)],
          { type: 'image/svg+xml;charset=utf-8' }
        ));
        const barcodeImage = new Image();
        try {
          await new Promise<void>((resolve, reject) => {
            barcodeImage.onload = () => resolve();
            barcodeImage.onerror = () => reject(new Error(`Barcode ${index + 1} could not be rendered.`));
            barcodeImage.src = barcodeUrl;
          });
        } finally {
          URL.revokeObjectURL(barcodeUrl);
        }

        // Draw barcode labels directly so PDF export does not depend on
        // html2canvas parsing the app's modern CSS color values.
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = labelLayout === 'grid' ? 340 : 400;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('The barcode canvas could not be initialized.');
        const width = canvas.width;
        const height = canvas.height;
        const label = flattenedLabels[index];
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.strokeStyle = '#94a3b8';
        context.lineWidth = 2;
        context.setLineDash([8, 6]);
        context.strokeRect(2, 2, width - 4, height - 4);
        context.setLineDash([]);
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        let textY = 28;
        if (showBrand) {
          context.fillStyle = '#64748b';
          context.font = 'bold 18px Arial, sans-serif';
          context.fillText(settings.brand_name || 'REYRA', width / 2, textY, width - 40);
          textY += 30;
        }
        context.fillStyle = '#0f172a';
        context.font = 'bold 22px Arial, sans-serif';
        context.fillText(label.name, width / 2, textY, width - 40);
        textY += 28;

        if (showSku) {
          context.fillStyle = '#475569';
          context.font = '16px monospace';
          context.fillText(`SKU: ${label.sku}`, width / 2, textY, width - 40);
          textY += 24;
        }

        const barcodeMaxWidth = width - 56;
        const barcodeMaxHeight = height - textY - (showPrice ? 66 : 22);
        const barcodeScale = Math.min(
          barcodeMaxWidth / barcodeImage.naturalWidth,
          barcodeMaxHeight / barcodeImage.naturalHeight
        );
        const barcodeWidth = barcodeImage.naturalWidth * barcodeScale;
        const barcodeHeight = barcodeImage.naturalHeight * barcodeScale;
        context.drawImage(
          barcodeImage,
          (width - barcodeWidth) / 2,
          textY + (barcodeMaxHeight - barcodeHeight) / 2,
          barcodeWidth,
          barcodeHeight
        );

        if (showPrice) {
          context.fillStyle = '#0f172a';
          context.font = 'bold 19px Arial, sans-serif';
          const priceText = label.mrp > label.sellingPrice
            ? `MRP: ${formatMoney(label.mrp)}   Sale: ${formatMoney(label.sellingPrice)}`
            : `Sale: ${formatMoney(label.sellingPrice)}`;
          context.fillText(priceText, width / 2, height - 28, width - 40);
        }

        const slot = index % (columns * rows);
        const column = slot % columns;
        const row = Math.floor(slot / columns);
        const scale = Math.min(cellWidth / canvas.width, cellHeight / canvas.height);
        const imageWidth = canvas.width * scale;
        const imageHeight = canvas.height * scale;
        const x = margin + column * (cellWidth + gap) + (cellWidth - imageWidth) / 2;
        const y = margin + row * (cellHeight + gap) + (cellHeight - imageHeight) / 2;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imageWidth, imageHeight);
      }

      const date = new Date().toISOString().slice(0, 10);
      pdf.save(`REYRA-Barcodes-${date}.pdf`);
    } catch (error) {
      console.error('Barcode PDF download failed:', error);
      const message = error instanceof Error ? error.message : String(error);
      setDownloadError(`PDF download failed: ${message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col no-print">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Download Inventory Barcodes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate a PDF of Code128 barcode labels for inventory products &amp; variants
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split view (Left: Controls & Selection, Right: Live Barcode Preview) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* Left Panel: Item Selection & Print Settings (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 overflow-y-auto space-y-4">
            {/* Quantity Mode Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Sticker Quantity Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('single')}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                    quantityPreset === 'single'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  1 per SKU
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('stock')}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                    quantityPreset === 'stock'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Match Stock
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityPreset('custom')}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all ${
                    quantityPreset === 'custom'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Custom
                </button>
              </div>
            </div>

            {/* Layout & Content Toggles */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Layout Format</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setLabelLayout('grid')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      labelLayout === 'grid'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    A4 Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setLabelLayout('thermal')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      labelLayout === 'thermal'
                        ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-2xs'
                        : 'text-slate-500'
                    }`}
                  >
                    Thermal 2x1&quot;
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-200/80 dark:border-slate-700/80 pt-2 flex flex-wrap items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={showBrand}
                    onChange={e => setShowBrand(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Brand</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={showSku}
                    onChange={e => setShowSku(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>SKU</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300 select-none">
                  <input
                    type="checkbox"
                    checked={showPrice}
                    onChange={e => setShowPrice(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Price / MRP</span>
                </label>
              </div>
            </div>

            {/* Inventory Item Selection List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Select Items ({totalSelectedCount}/{labelItems.length})
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Deselect
                  </button>
                </div>
              </div>

              {/* Quick Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="Filter items by title or SKU..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* List */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
                {filteredItems.map(item => (
                  <div
                    key={item.id}
                    className={`pt-1.5 flex items-center justify-between gap-2 p-1.5 rounded-xl transition-colors ${
                      item.isSelected
                        ? 'bg-blue-50/60 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleItem(item.id)}
                      className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer"
                    >
                      {item.isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="font-mono">SKU: {item.sku}</span>
                          <span>•</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">
                            {item.stockUnits} units in stock
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400 font-semibold mr-1">Qty:</span>
                      <input
                        type="number"
                        min="0"
                        max="999"
                        value={item.printQty}
                        onChange={e => handleUpdateQty(item.id, parseInt(e.target.value) || 0)}
                        className="w-14 px-1.5 py-1 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Live Barcode Preview (7 cols) */}
          <div className="lg:col-span-7 bg-slate-100/70 dark:bg-slate-950/60 p-4 sm:p-6 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Live Barcode Preview
              </div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-900">
                {flattenedLabels.length} Total Sticker{flattenedLabels.length !== 1 ? 's' : ''}
              </span>
            </div>

            {flattenedLabels.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <Barcode className="w-12 h-12 stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-semibold">No barcode stickers selected.</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Select at least one product on the left or set quantity greater than 0.
                </p>
              </div>
            ) : (
              <div
                id="printable-barcode-container"
                className={`w-full bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs ${
                  labelLayout === 'grid'
                    ? 'grid grid-cols-2 sm:grid-cols-3 gap-3'
                    : 'flex flex-col items-center gap-4 max-w-xs mx-auto'
                }`}
              >
                {flattenedLabels.map((item, index) => (
                  <BarcodeStickerCard
                    key={`${item.id}-${index}`}
                    item={item}
                    brandName={settings.brand_name || 'REYRA'}
                    showBrand={showBrand}
                    showSku={showSku}
                    showPrice={showPrice}
                    formatMoney={formatMoney}
                    layout={labelLayout}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>Download the selected Code128 labels as a PDF. Grid layout fits multiple labels per A4 page.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {downloadError && <span className="text-xs text-red-600" role="alert">{downloadError}</span>}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-download-barcodes"
              type="button"
              disabled={flattenedLabels.length === 0 || isDownloading}
              onClick={handleDownload}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>{isDownloading ? 'Creating PDF…' : `Download ${flattenedLabels.length} Label${flattenedLabels.length !== 1 ? 's' : ''}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BarcodeStickerCardProps {
  item: LabelPrintItem;
  brandName: string;
  showBrand: boolean;
  showSku: boolean;
  showPrice: boolean;
  formatMoney: (amount: number) => string;
  layout: LabelLayout;
}

const BarcodeStickerCard: React.FC<BarcodeStickerCardProps> = ({
  item,
  brandName,
  showBrand,
  showSku,
  showPrice,
  formatMoney,
  layout,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && item.barcode) {
      renderBarcode(svgRef.current, item.barcode, {
        width: layout === 'thermal' ? 1.8 : 1.4,
        height: layout === 'thermal' ? 38 : 30,
        fontSize: layout === 'thermal' ? 12 : 10,
        margin: 2,
      });
    }
  }, [item.barcode, layout]);

  return (
    <div
      className={`barcode-print-sticker bg-white text-slate-900 border border-dashed border-slate-300 rounded-xl p-3 flex flex-col items-center justify-between text-center select-none shadow-2xs break-inside-avoid ${
        layout === 'thermal' ? 'w-full max-w-[260px]' : 'w-full'
      }`}
    >
      {showBrand && (
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 truncate max-w-full">
          {brandName}
        </div>
      )}
      <div className="text-xs font-bold text-slate-900 truncate max-w-full mt-0.5">
        {item.name}
      </div>

      {showSku && (
        <div className="text-[9px] font-mono text-slate-500 mt-0.5">
          SKU: {item.sku}
        </div>
      )}

      <div className="my-1.5 flex justify-center max-w-full overflow-hidden bg-white">
        <svg ref={svgRef} className="max-w-full" />
      </div>

      {showPrice && (
        <div className="flex items-center justify-center gap-2 text-[10px]">
          {item.mrp > item.sellingPrice && (
            <span className="text-slate-400 line-through">MRP: {formatMoney(item.mrp)}</span>
          )}
          <span className="font-bold text-slate-900 text-xs">
            Sale: {formatMoney(item.sellingPrice)}
          </span>
        </div>
      )}
    </div>
  );
};
