import React, { useState } from 'react';
import {
  X,
  PackageCheck,
  Truck,
  CheckCircle,
  Inbox,
  AlertOctagon,
  FileText,
  RotateCcw,
  User,
  Calendar,
  CreditCard,
  Building,
} from 'lucide-react';
import { db } from '../../services/database';
import { Order, OrderStatus } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onOrderUpdated: () => void;
  onGenerateInvoice?: (order: Order) => void;
  onInitiateReturn?: (order: Order) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onOrderUpdated,
  onGenerateInvoice,
  onInitiateReturn,
}) => {
  const { formatMoney } = useSettings();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !order) return null;

  const handleStatusChange = (newStatus: OrderStatus) => {
    setIsUpdatingStatus(true);
    db.updateOrderStatus(order.id, newStatus);
    setIsUpdatingStatus(false);
    onOrderUpdated();
  };

  const handleCancelOrder = () => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this order? This will automatically restore the deducted product inventory and register an audit ledger record.'
    );
    if (!confirmCancel) return;

    db.cancelOrder(order.id, true);
    onOrderUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Order Details
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                  #{order.order_number}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    order.status === 'Delivered'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                      : order.status === 'Cancelled'
                      ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
                      : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Placed on {order.order_date} via {order.sales_channel_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Status Progression Workflow */}
          {order.status !== 'Cancelled' && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Fulfillment Status Progression
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(['Received', 'Packed', 'Shipped', 'Delivered'] as OrderStatus[]).map(st => {
                  const isActive = order.status === st;
                  return (
                    <button
                      key={st}
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusChange(st)}
                      className={`py-2 px-2 text-center rounded-lg font-semibold transition-all flex flex-col items-center gap-1 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'Received' && <Inbox className="w-3.5 h-3.5" />}
                      {st === 'Packed' && <PackageCheck className="w-3.5 h-3.5" />}
                      {st === 'Shipped' && <Truck className="w-3.5 h-3.5" />}
                      {st === 'Delivered' && <CheckCircle className="w-3.5 h-3.5" />}
                      <span className="text-[11px]">{st}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer & Payment Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Customer Information
              </span>
              <div className="text-slate-700 dark:text-slate-300 font-medium">
                {order.customer_name}
              </div>
              <div className="text-slate-500">Phone: {order.customer_phone}</div>
              {order.customer_email && (
                <div className="text-slate-500">Email: {order.customer_email}</div>
              )}
              {order.shipping_address && (
                <div className="text-slate-500">Address: {order.shipping_address}</div>
              )}
            </div>

            <div className="p-3.5 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" /> Payment &amp; Channel
              </span>
              <div className="text-slate-700 dark:text-slate-300">
                Payment Method: <strong>{order.payment_method}</strong>
              </div>
              <div className="text-slate-700 dark:text-slate-300">
                Channel: <strong>{order.sales_channel_name}</strong>
              </div>
              <div className="text-slate-500">Order Date: {order.order_date}</div>
              <div className="text-slate-500">
                Invoiced:{' '}
                <strong className={order.is_invoiced ? 'text-emerald-600' : 'text-slate-600'}>
                  {order.is_invoiced ? 'Yes (Invoice Generated)' : 'No (Pending)'}
                </strong>
              </div>
            </div>
          </div>

          {/* Purchased Line Items */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block">
              Purchased Items ({order.items.length})
            </span>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Item Details</th>
                    <th className="py-2.5 px-3">Qty</th>
                    <th className="py-2.5 px-3">Unit Rate</th>
                    <th className="py-2.5 px-3">Discount</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {order.items.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {item.product_name}
                        </div>
                        {item.variant_name && (
                          <div className="text-[11px] text-blue-600">{item.variant_name}</div>
                        )}
                        <div className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</div>
                      </td>
                      <td className="py-2 px-3 font-bold">{item.quantity}</td>
                      <td className="py-2 px-3">{formatMoney(item.unit_price)}</td>
                      <td className="py-2 px-3">{item.discount ? `${item.discount}%` : '—'}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {formatMoney(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-end">
            <div className="w-64 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>{formatMoney(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Total Discount:</span>
                <span>-{formatMoney(order.total_discount)}</span>
              </div>
              {order.tax_amount > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Taxes:</span>
                  <span>+{formatMoney(order.tax_amount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                <span>Total Paid:</span>
                <span className="text-blue-600 dark:text-blue-400">
                  {formatMoney(order.total_amount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <div>
            {order.status !== 'Cancelled' && (
              <button
                onClick={handleCancelOrder}
                className="px-3 py-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <AlertOctagon className="w-3.5 h-3.5" /> Cancel Order &amp; Restore Stock
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onGenerateInvoice && (
              <button
                onClick={() => {
                  onGenerateInvoice(order);
                  onClose();
                }}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                {order.is_invoiced ? 'View Invoice' : 'Generate Invoice'}
              </button>
            )}

            {onInitiateReturn && order.status === 'Delivered' && (
              <button
                onClick={() => {
                  onInitiateReturn(order);
                  onClose();
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Process Return
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
