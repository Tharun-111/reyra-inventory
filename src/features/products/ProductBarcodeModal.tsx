import React, { useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { Product, ProductVariant } from '../../types';
import { renderBarcode } from '../../services/barcode';
import { useSettings } from '../../context/SettingsContext';

interface ProductBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  variant?: ProductVariant | null;
}

export const ProductBarcodeModal: React.FC<ProductBarcodeModalProps> = ({
  isOpen,
  onClose,
  product,
  variant,
}) => {
  const { formatMoney, settings } = useSettings();
  const svgRef = useRef<SVGSVGElement>(null);

  const barcodeValue = variant?.barcode || variant?.sku || product?.barcode || product?.sku || '';
  const itemName = variant ? `${product?.name} (${variant.variant_name})` : product?.name || '';
  const itemSellingPrice = variant ? variant.selling_price : product?.selling_price || 0;
  const itemMrp = variant ? variant.mrp : product?.mrp || 0;

  useEffect(() => {
    if (isOpen && svgRef.current && barcodeValue) {
      renderBarcode(svgRef.current, barcodeValue, {
        width: 2,
        height: 50,
        fontSize: 14,
      });
    }
  }, [isOpen, barcodeValue]);

  if (!isOpen || !product) return null;

  const handleDownloadBarcode = () => {
    if (!barcodeValue) return;

    // Render directly to canvas for reliable PDF output in browser and Android WebView.
    const barcodeCanvas = document.createElement('canvas');
    renderBarcode(barcodeCanvas, barcodeValue, { width: 3, height: 72, fontSize: 18, margin: 8 });
    if (!barcodeCanvas.width || !barcodeCanvas.height) {
      throw new Error('Could not render the barcode for this product.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = barcodeCanvas.width * 2;
    canvas.height = barcodeCanvas.height * 2;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not prepare the barcode image for the PDF.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(barcodeCanvas, 0, 0, canvas.width, canvas.height);

    const pageWidth = 60;
    const margin = 4;
    const contentWidth = pageWidth - margin * 2;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pageWidth, 80] });
    pdf.setTextColor(100, 116, 139);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    const brandLines = pdf.splitTextToSize(settings.brand_name || ' ', contentWidth);
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8);
    const nameLines = pdf.splitTextToSize(itemName || ' ', contentWidth);
    const barcodeWidth = contentWidth;
    const barcodeHeight = Math.min((canvas.height / canvas.width) * barcodeWidth, 25);
    const scaledBarcodeWidth = barcodeHeight === 25 ? (canvas.width / canvas.height) * barcodeHeight : barcodeWidth;
    const brandY = 5;
    const nameY = brandY + brandLines.length * 3.2 + 1.5;
    const barcodeY = nameY + nameLines.length * 3.6 + 2;
    const mrpY = barcodeY + barcodeHeight + 5;
    const saleY = mrpY + 3.5;

    // Resize before drawing. Resizing after drawing shifts/clips existing PDF content.
    pdf.internal.pageSize.height = saleY + 5;
    pdf.text(brandLines, pageWidth / 2, brandY, { align: 'center' });
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8);
    pdf.text(nameLines, pageWidth / 2, nameY, { align: 'center' });
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pageWidth - scaledBarcodeWidth) / 2, barcodeY, scaledBarcodeWidth, barcodeHeight);

    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`MRP: ${formatMoney(itemMrp)}`, pageWidth / 2, mrpY, { align: 'center' });
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(8);
    pdf.text(`Sale: ${formatMoney(itemSellingPrice)}`, pageWidth / 2, saleY, { align: 'center' });

    const safeName = (variant?.sku || product?.sku || 'barcode').replace(/[^a-z0-9-_]/gi, '_');
    pdf.save(`${safeName}-barcode.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Product Barcode Label</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center justify-center text-center space-y-3">
          {/* Printable Barcode Label Card */}
          <div
            id="printable-barcode-card"
            className="p-4 bg-white border-2 border-dashed border-slate-300 rounded-xl shadow-xs w-full flex flex-col items-center"
          >
            <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              {settings.brand_name}
            </div>
            <div className="text-xs font-bold text-slate-900 mt-1 max-w-[240px] truncate">
              {itemName}
            </div>

            <div className="my-2 bg-white flex justify-center">
              <svg ref={svgRef} className="max-w-full" />
            </div>

            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-500 line-through">MRP: {formatMoney(itemMrp)}</span>
              <span className="font-bold text-slate-900 text-sm">Sale: {formatMoney(itemSellingPrice)}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Standard Code128 thermal sticker / laser label compatible
          </p>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            Close
          </button>
          <button
            onClick={handleDownloadBarcode}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Download Label
          </button>
        </div>
      </div>
    </div>
  );
};
