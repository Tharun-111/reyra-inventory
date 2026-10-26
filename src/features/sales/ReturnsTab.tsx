import React, { useState, useMemo, useEffect } from 'react';
import {
  RotateCcw,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  TrendingDown,
  Package,
  Calendar,
  User,
} from 'lucide-react';
import { db } from '../../services/database';
import { Order, OrderReturn } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface ReturnsTabProps {
  preselectedOrderForReturn?: Order | null;
}

export const ReturnsTab: React.FC<ReturnsTabProps> = ({ preselectedOrderForReturn }) => {
  const { formatMoney } = useSettings();

  const [returns, setReturns] = useState<OrderReturn[]>(() => db.getReturns());
  const [orders, setOrders] = useState<Order[]>(() => db.getOrders());
  const [searchQuery, setSearchQuery] = useState('');

  // Process Return Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedLineItemId, setSelectedLineItemId] = useState<string>('');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>('Defective / Damaged during shipping');
  const [returnNotes, setReturnNotes] = useState('');
  const [refundStatus, setRefundStatus] = useState<'Refunded' | 'Pending' | 'Store Credit'>('Refunded');
  const [modalError, setModalError] = useState<string | null>(null);

  // Eligible orders (e.g. Delivered or Shipped orders)
  const eligibleOrders = useMemo(() => {
    return orders.filter(o => o.status === 'Delivered' || o.status === 'Shipped');
  }, [orders]);

  const refreshData = () => {
    setReturns(db.getReturns());
    setOrders(db.getOrders());
  };

  useEffect(() => {
    if (preselectedOrderForReturn) {
      setIsModalOpen(true);
      handleOrderSelection(preselectedOrderForReturn.id);
    }
  }, [preselectedOrderForReturn]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId);
  }, [orders, selectedOrderId]);

  const selectedLineItem = useMemo(() => {
    if (!selectedOrder) return null;
    return selectedOrder.items.find(it => it.id === selectedLineItemId) || selectedOrder.items[0];
  }, [selectedOrder, selectedLineItemId]);

  const handleOrderSelection = (orderId: string) => {
    setSelectedOrderId(orderId);
    setModalError(null);
    const ord = orders.find(o => o.id === orderId);
    if (ord && ord.items.length > 0) {
      setSelectedLineItemId(ord.items[0].id);
      setReturnQty(1);
    }
  };

  const handleLineItemSelection = (itemId: string) => {
    setSelectedLineItemId(itemId);
    setReturnQty(1);
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!selectedOrder) {
      setModalError('Please choose an eligible order.');
      return;
    }
    if (!selectedLineItem) {
      setModalError('Please choose an item to return.');
      return;
    }
    if (returnQty <= 0) {
      setModalError('Return quantity must be at least 1.');
      return;
    }
    if (returnQty > selectedLineItem.quantity) {
      setModalError(`Cannot return ${returnQty} units. Maximum purchased was ${selectedLineItem.quantity}.`);
      return;
    }

    const calculatedRefund = (selectedLineItem.subtotal / selectedLineItem.quantity) * returnQty;

    const res = db.processReturn({
      order_id: selectedOrder.id,
      order_number: selectedOrder.order_number,
      customer_id: selectedOrder.customer_id,
      customer_name: selectedOrder.customer_name,
      customer_phone: selectedOrder.customer_phone,
      product_id: selectedLineItem.product_id,
      variant_id: selectedLineItem.variant_id,
      product_name: selectedLineItem.product_name,
      variant_name: selectedLineItem.variant_name,
      sku: selectedLineItem.sku,
      quantity_returned: returnQty,
      refund_amount: calculatedRefund,
      reason: returnReason,
      notes: returnNotes.trim() || undefined,
      refund_status: refundStatus,
      restock_inventory: true,
    });

    if (!res.success) {
      setModalError(res.error || 'Failed to process return.');
      return;
    }

    refreshData();
    setIsModalOpen(false);
  };

  // Filtered returns
  const filteredReturns = useMemo(() => {
    if (!searchQuery.trim()) return returns;
    const q = searchQuery.toLowerCase();
    return returns.filter(
      r =>
        r.order_number.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        r.product_name.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
    );
  }, [returns, searchQuery]);

  return (
    <div className="space-y-5">
      {/* Top Header & New Return Action */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search returns by order #, customer, item..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        <button
          id="btn-process-return"
          onClick={() => {
            setIsModalOpen(true);
            if (eligibleOrders.length > 0) {
              handleOrderSelection(eligibleOrders[0].id);
            }
          }}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-4 h-4" /> Process Customer Return
        </button>
      </div>

      {/* Returns Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950 text-rose-600 rounded-xl">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Return Incidents</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {returns.length} records
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Items Restocked</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {returns.reduce((sum, r) => sum + r.quantity_returned, 0)} units
            </div>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Total Refund Value</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {formatMoney(returns.reduce((sum, r) => sum + r.refund_amount, 0))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Returns Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-500" />
            Customer Returns Registry ({filteredReturns.length})
          </h3>
          <span className="text-xs text-slate-500">
            Inventory auto-restocked to active warehouse
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Item Returned</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Refund Amount</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Refund Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No customer returns recorded yet.
                  </td>
                </tr>
              ) : (
                filteredReturns.map(ret => (
                  <tr
                    key={ret.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {ret.return_date}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      #{ret.order_number}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {ret.customer_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {ret.customer_phone}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {ret.product_name}
                      </div>
                      {ret.variant_name && (
                        <div className="text-[11px] text-blue-600">{ret.variant_name}</div>
                      )}
                      <div className="text-[10px] font-mono text-slate-400">SKU: {ret.sku}</div>
                    </td>

                    <td className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">
                      {ret.quantity_returned} units
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatMoney(ret.refund_amount)}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {ret.reason}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                        {ret.refund_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Return Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-600">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Process Order Return
                  </h3>
                  <p className="text-xs text-slate-500">
                    Restores stock to inventory ledger and updates financial refunds
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="p-5 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Order Selection Dropdown */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Select Order for Return <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={selectedOrderId}
                  onChange={e => handleOrderSelection(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs"
                >
                  <option value="">-- Choose delivered order --</option>
                  {eligibleOrders.map(o => (
                    <option key={o.id} value={o.id}>
                      #{o.order_number} — {o.customer_name} ({formatMoney(o.total_amount)}) [{o.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer & Items preview */}
              {selectedOrder && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Customer:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedOrder.customer_name} ({selectedOrder.customer_phone})
                    </span>
                  </div>

                  {/* Choose item from order */}
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                      Choose Item Being Returned:
                    </label>
                    <select
                      value={selectedLineItemId}
                      onChange={e => handleLineItemSelection(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                    >
                      {selectedOrder.items.map(it => (
                        <option key={it.id} value={it.id}>
                          {it.product_name} {it.variant_name ? `(${it.variant_name})` : ''} — Qty:{' '}
                          {it.quantity} (Purchased at {formatMoney(it.subtotal / it.quantity)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Return Qty and Reason */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200">
                    Units Returned <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedLineItem?.quantity || 1}
                    value={returnQty ?? 1}
                    onChange={e => setReturnQty(parseInt(e.target.value) || 1)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  />
                  {selectedLineItem && (
                    <span className="text-[10px] text-slate-500">
                      Max: {selectedLineItem.quantity} units
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-200">
                    Refund Settlement
                  </label>
                  <select
                    value={refundStatus || 'Refunded'}
                    onChange={e => setRefundStatus(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="Refunded">Direct Cash/UPI Refunded</option>
                    <option value="Store Credit">Store Credit Issued</option>
                    <option value="Pending">Refund Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200">
                  Return Reason
                </label>
                <select
                  value={returnReason || 'Defective / Damaged during shipping'}
                  onChange={e => setReturnReason(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="Defective / Damaged during shipping">Defective / Damaged during shipping</option>
                  <option value="Wrong Item or Size Received">Wrong Item or Size Received</option>
                  <option value="Customer Changed Mind">Customer Changed Mind</option>
                  <option value="Quality Not as Expected">Quality Not as Expected</option>
                  <option value="Exchange for Alternative Item">Exchange for Alternative Item</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200">
                  Inspector Notes / Remarks
                </label>
                <textarea
                  value={returnNotes || ''}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="e.g. Returned in original packaging, inspected & passed for restock"
                  rows={2}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedOrder}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Finalize Return &amp; Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
