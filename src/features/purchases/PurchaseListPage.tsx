import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Building,
  Package,
  Eye,
  AlertCircle,
  X,
} from 'lucide-react';
import { db } from '../../services/database';
import { PurchaseOrder } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { AddPurchaseModal } from './AddPurchaseModal';

interface PurchaseListPageProps {
  initialSearchQuery?: string;
}

export const PurchaseListPage: React.FC<PurchaseListPageProps> = ({
  initialSearchQuery = '',
}) => {
  const { formatMoney } = useSettings();

  const [purchases, setPurchases] = useState<PurchaseOrder[]>(() => db.getPurchases());
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  React.useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const refreshPurchases = () => {
    setPurchases(db.getPurchases());
  };

  const handleReceivePO = (poId: string) => {
    const confirmReceive = window.confirm(
      'Confirm receipt of this purchase order? All items will be immediately added to inventory stock and an audit log created.'
    );
    if (!confirmReceive) return;

    db.receivePurchaseOrder(poId);
    refreshPurchases();
  };

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
      if (paymentFilter !== 'ALL' && p.payment_status !== paymentFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.po_number.toLowerCase().includes(q) ||
        p.vendor_name.toLowerCase().includes(q) ||
        p.items.some(it => it.product_name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
      );
    });
  }, [purchases, statusFilter, paymentFilter, searchQuery]);

  return (
    <div id="purchases-page-container" className="space-y-5 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Procurement &amp; Purchases
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage vendor purchase orders, shipments, and automated inventory restock
          </p>
        </div>

        <button
          id="btn-new-po"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> New Purchase Order
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery || ''}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by vendor, PO #, item..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter || 'ALL'}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Order Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Ordered">Ordered</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter || 'ALL'}
            onChange={e => setPaymentFilter(e.target.value)}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Vendor Name</th>
                <th className="py-3 px-4">Purchase Order #</th>
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Expected Delivery</th>
                <th className="py-3 px-4">Total Items</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Payment Status</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No purchase orders found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map(po => {
                  const totalUnits = po.items.reduce((s, it) => s + it.quantity, 0);

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {po.vendor_name}
                        </div>
                        {po.vendor_contact && (
                          <div className="text-[11px] text-slate-400">{po.vendor_contact}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {po.po_number}
                      </td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{po.order_date}</td>

                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {po.expected_delivery_date || '—'}
                      </td>

                      <td className="py-3 px-4 font-semibold">
                        {totalUnits} units ({po.items.length} items)
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {formatMoney(po.grand_total)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            po.payment_status === 'Paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                              : po.payment_status === 'Partial'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                              : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {po.payment_status}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            po.status === 'Received'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : po.status === 'Ordered'
                              ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status !== 'Received' && (
                            <button
                              onClick={() => handleReceivePO(po.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                              title="Receive Goods and Auto-Restock"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Receive
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPO(po)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="View PO Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Purchase Modal */}
      <AddPurchaseModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onPurchaseCreated={refreshPurchases}
      />

      {/* PO View Modal */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Purchase Order {selectedPO.po_number}
                </h3>
                <p className="text-xs text-slate-500">Vendor: {selectedPO.vendor_name}</p>
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto max-h-96 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px]">Order Date:</span>
                  <span className="font-semibold">{selectedPO.order_date}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Expected Date:</span>
                  <span className="font-semibold">{selectedPO.expected_delivery_date || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Status:</span>
                  <span className="font-semibold">{selectedPO.payment_status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Fulfillment Status:</span>
                  <span className="font-semibold">{selectedPO.status}</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[10px] block mb-1">
                  Ordered Line Items
                </span>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2">Item</th>
                        <th className="p-2">Qty</th>
                        <th className="p-2 text-right">Cost</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedPO.items.map(it => (
                        <tr key={it.id}>
                          <td className="p-2">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {it.product_name}
                            </div>
                            <div className="text-[10px] text-slate-400">{it.sku}</div>
                          </td>
                          <td className="p-2 font-bold">{it.quantity}</td>
                          <td className="p-2 text-right">{formatMoney(it.unit_cost)}</td>
                          <td className="p-2 text-right font-bold">{formatMoney(it.total_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-sm">
                <span>Grand Total:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatMoney(selectedPO.grand_total)}
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
