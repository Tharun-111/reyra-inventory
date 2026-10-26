import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Printer,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  Calendar,
  User,
} from 'lucide-react';
import { db } from '../../services/database';
import { Invoice, Order } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { InvoicePrintView } from './InvoicePrintView';
import { downloadInvoicePdf } from './invoicePdf';

interface InvoicesTabProps {
  preselectedOrderForInvoice?: Order | null;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = ({ preselectedOrderForInvoice }) => {
  const { settings, formatMoney } = useSettings();

  const [invoices, setInvoices] = useState<Invoice[]>(() => db.getInvoices());
  const [orders, setOrders] = useState<Order[]>(() => db.getOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Creation Wizard Modal
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [wizardError, setWizardError] = useState<string | null>(null);

  // Selected invoice for A4 print
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // Uninvoiced orders for dropdown
  const uninvoicedOrders = useMemo(() => {
    return orders.filter(o => !o.is_invoiced && o.status !== 'Cancelled');
  }, [orders]);

  const refreshData = () => {
    setInvoices(db.getInvoices());
    setOrders(db.getOrders());
  };

  useEffect(() => {
    if (preselectedOrderForInvoice) {
      if (!preselectedOrderForInvoice.is_invoiced) {
        setIsWizardOpen(true);
        handleSelectOrder(preselectedOrderForInvoice.id);
      } else {
        // Already invoiced, find the existing invoice and preview it
        const inv = db.getInvoices().find(i => i.order_id === preselectedOrderForInvoice.id);
        if (inv) setPrintInvoice(inv);
      }
    }
  }, [preselectedOrderForInvoice]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setWizardError(null);
    const ord = orders.find(o => o.id === orderId);
    if (ord) {
      setCustomerName(ord.customer_name || '');
      setCustomerPhone(ord.customer_phone || '');
      setCustomerEmail(ord.customer_email || '');
    }
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);

    if (!selectedOrderId) {
      setWizardError('Please select an order to invoice.');
      return;
    }

    const res = db.generateInvoiceForOrder(selectedOrderId);
    if (!res.success || !res.invoice) {
      setWizardError(res.error || 'Failed to generate invoice.');
      return;
    }

    refreshData();
    setIsWizardOpen(false);
    setPrintInvoice(res.invoice);
  };

  const handleDirectDownload = async (inv: Invoice) => {
    setDownloadingId(inv.id);
    try {
      await downloadInvoicePdf(inv, settings);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const q = searchQuery.toLowerCase();
    return invoices.filter(
      inv =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.customer_phone.includes(q) ||
        inv.order_number.toLowerCase().includes(q)
    );
  }, [invoices, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Top Header & Search */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search invoice #, order #, customer..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        <button
          id="btn-generate-invoice"
          onClick={() => {
            setIsWizardOpen(true);
            if (uninvoicedOrders.length > 0) {
              handleSelectOrder(uninvoicedOrders[0].id);
            }
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Generate New Invoice
        </button>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No invoices generated yet. Click &quot;Generate New Invoice&quot; to create one from an order.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      #{inv.invoice_number}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {inv.invoice_date}
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {inv.customer_name}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-500">{inv.customer_phone}</td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                      #{inv.order_number}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {inv.items.length} items
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {inv.currency_symbol || inv.currency || inv.currency_code || '₹'}{' '}
                      {(inv.total_amount ?? 0).toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPrintInvoice(inv)}
                          className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="View and print invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                        <button
                          onClick={() => handleDirectDownload(inv)}
                          disabled={downloadingId === inv.id}
                          className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                          title="Download PDF invoice file"
                        >
                          {downloadingId === inv.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoicing Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Generate Tax Invoice
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select an uninvoiced order to create a finalized tax invoice
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 space-y-4 text-xs">
              {wizardError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* Order Number Dropdown (Uninvoiced Orders Only) */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Select Order to Invoice <span className="text-red-500">*</span>
                </label>
                {uninvoicedOrders.length === 0 ? (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-700 dark:text-amber-300">
                    All recent orders have already been invoiced! Create a new order first.
                  </div>
                ) : (
                  <select
                    required
                    value={selectedOrderId}
                    onChange={e => handleSelectOrder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs"
                  >
                    <option value="">-- Choose an order --</option>
                    {uninvoicedOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        #{o.order_number} — {o.customer_name} ({formatMoney(o.total_amount)}) [
                        {o.order_date}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Populated Customer Details */}
              {selectedOrderId && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                  <span className="font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] block">
                    Customer &amp; Billed Details
                  </span>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300">
                      Customer Name
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={customerName || ''}
                      className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={customerPhone || ''}
                      className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 dark:text-slate-300">
                      Email ID
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={customerEmail || 'Not provided'}
                      className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedOrderId}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Create &amp; Preview Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* A4 Print Modal */}
      {printInvoice && (
        <InvoicePrintView invoice={printInvoice} onClose={() => setPrintInvoice(null)} />
      )}
    </div>
  );
};
