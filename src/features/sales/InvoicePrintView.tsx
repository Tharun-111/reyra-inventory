import React, { useState } from 'react';
import { Printer, Download, X, CheckCircle2, Loader2, FileCode } from 'lucide-react';
import { Invoice } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { ReyraLogo } from '../../components/brand/ReyraLogo';
import { printInvoice, downloadInvoicePdf, downloadInvoiceHtml } from './invoicePdf';

interface InvoicePrintViewProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoicePrintView: React.FC<InvoicePrintViewProps> = ({ invoice, onClose }) => {
  const { settings } = useSettings();
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handlePrint = () => {
    printInvoice(invoice, settings);
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadSuccess(false);
    try {
      await downloadInvoicePdf(invoice, settings);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadHtml = () => {
    downloadInvoiceHtml(invoice, settings);
  };

  const currencySymbol =
    invoice.currency_symbol ||
    invoice.currency ||
    invoice.currency_code ||
    settings.currency_symbol ||
    '₹';

  const fmt = (val: number | undefined | null) =>
    Number(val ?? 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const subtotal = invoice.subtotal ?? 0;
  const totalDiscount = invoice.total_discount ?? invoice.discount_total ?? 0;
  const taxAmount = invoice.tax_amount ?? invoice.tax_total ?? 0;
  const totalAmount = invoice.total_amount ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto border border-slate-200">
        {/* Modal Controls Bar (hidden during print) */}
        <div className="print:hidden p-4 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900">Tax Invoice Preview</span>
            <span className="font-mono text-xs text-blue-600 font-semibold">
              #{invoice.invoice_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download PDF Button */}
            <button
              id="btn-download-invoice-pdf"
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Download official PDF invoice file"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print A4 Button */}
            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Print document on A4 paper or save to system PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print (A4)</span>
            </button>

            {/* Download Offline HTML button */}
            <button
              onClick={handleDownloadHtml}
              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Download offline standalone HTML file"
            >
              <FileCode className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">HTML</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Document Body */}
        <div id="printable-invoice" className="p-8 sm:p-10 bg-white font-sans text-xs space-y-6">
          {/* Top Header: Business Branding & Invoice Meta */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6">
            <div>
              <div className="flex items-center gap-2.5">
                <ReyraLogo size="md" />
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">
                    {settings.brand_name || 'REYRA Inventory'}
                  </h1>
                  <p className="text-[11px] text-slate-500">
                    {settings.business_email || 'contact@reyra.com'} • {settings.business_phone || '+91 98765 43210'}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 max-w-xs leading-relaxed">
                {settings.business_address || 'Enterprise Business Park, Tech Zone'}
                {settings.tax_identifier && (
                  <span className="block font-semibold text-slate-700 mt-0.5">
                    GSTIN / Tax ID: {settings.tax_identifier}
                  </span>
                )}
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white text-[11px] font-bold tracking-widest uppercase rounded">
                TAX INVOICE
              </span>
              <div className="text-xs font-mono font-bold text-slate-900 mt-2">
                Invoice No: <span className="text-blue-600">#{invoice.invoice_number}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Invoice Date: <strong>{invoice.invoice_date}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Ref Order: <strong className="font-mono">#{invoice.order_number}</strong>
              </div>
            </div>
          </div>

          {/* Billed To Information */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Billed To (Customer):
              </span>
              <div className="text-sm font-bold text-slate-900">{invoice.customer_name}</div>
              <div className="text-[11px] text-slate-600 mt-0.5 font-mono">
                Phone: {invoice.customer_phone}
              </div>
              {invoice.customer_email && (
                <div className="text-[11px] text-slate-600">Email: {invoice.customer_email}</div>
              )}
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Payment &amp; Currency:
              </span>
              <div className="text-xs font-semibold text-slate-800">
                Currency: <span className="font-bold">{currencySymbol}</span> ({invoice.currency_code || settings.currency_code || 'INR'})
              </div>
              <div className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Paid in Full
              </div>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4">SKU</th>
                  <th className="py-2.5 px-4 text-center">Qty</th>
                  <th className="py-2.5 px-4 text-right">Unit Price</th>
                  <th className="py-2.5 px-4 text-right">Disc %</th>
                  <th className="py-2.5 px-4 text-right">Amount ({currencySymbol})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-xs">
                {(invoice.items || []).map((it, idx) => {
                  const unitPrice = it.unit_price ?? 0;
                  const itemTotal = it.line_total ?? it.subtotal ?? (unitPrice * (it.quantity || 1));
                  return (
                    <tr key={it.id || idx}>
                      <td className="py-3 px-4 text-slate-400">{idx + 1}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {it.product_name}
                        {it.variant_name && (
                          <span className="block text-[11px] font-normal text-blue-600">
                            Variant: {it.variant_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">{it.sku || '—'}</td>
                      <td className="py-3 px-4 text-center font-bold">{it.quantity}</td>
                      <td className="py-3 px-4 text-right">
                        {fmt(unitPrice)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {it.discount ? `${it.discount}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {fmt(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation Box */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span>
                  {currencySymbol} {fmt(subtotal)}
                </span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Applied:</span>
                  <span>
                    -{currencySymbol} {fmt(totalDiscount)}
                  </span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Taxes:</span>
                  <span>
                    +{currencySymbol} {fmt(taxAmount)}
                  </span>
                </div>
              )}
              <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-base font-bold text-slate-900">
                <span>Total Amount:</span>
                <span>
                  {currencySymbol} {fmt(totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Terms & Authorization */}
          <div className="pt-8 border-t border-slate-200 flex justify-between items-end text-[10px] text-slate-500">
            <div>
              <p className="font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Terms &amp; Conditions
              </p>
              <p>1. Goods once sold can be returned within 14 days subject to store return policy.</p>
              <p>2. Computer generated invoice; signature not strictly required.</p>
            </div>
            <div className="text-right">
              <div className="h-10 border-b border-dashed border-slate-300 w-36 mb-1" />
              <span className="font-semibold text-slate-700">Authorized Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
