import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  FileText,
  Calendar,
  CreditCard,
  Building,
  RotateCcw,
} from 'lucide-react';
import { db } from '../../services/database';
import { Order, OrderStatus, PaymentMethod } from '../../types';
import { useSettings } from '../../context/SettingsContext';
import { AddOrderModal } from './AddOrderModal';
import { OrderDetailsModal } from './OrderDetailsModal';

interface OrdersTabProps {
  initialStatusFilter?: OrderStatus | 'ALL';
  initialSearchQuery?: string;
  onNavigateToInvoicesWithOrder?: (order: Order) => void;
  onNavigateToReturnsWithOrder?: (order: Order) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  initialStatusFilter = 'ALL',
  initialSearchQuery = '',
  onNavigateToInvoicesWithOrder,
  onNavigateToReturnsWithOrder,
}) => {
  const { formatMoney } = useSettings();

  const [orders, setOrders] = useState<Order[]>(() => db.getOrders());
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
      setCurrentPage(1);
    }
  }, [initialSearchQuery]);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>(initialStatusFilter);
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (initialStatusFilter) {
      setStatusFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const refreshOrders = () => {
    setOrders(db.getOrders());
    if (selectedOrder) {
      const refreshed = db.getOrders().find(o => o.id === selectedOrder.id);
      setSelectedOrder(refreshed || null);
    }
  };

  const salesChannels = useMemo(() => db.getSalesChannels(), []);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status filter
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      // Channel filter
      if (channelFilter !== 'ALL' && o.sales_channel_id !== channelFilter) return false;
      // Payment filter
      if (paymentFilter !== 'ALL' && o.payment_method !== paymentFilter) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchNum = o.order_number.toLowerCase().includes(q);
      const matchCust = o.customer_name.toLowerCase().includes(q);
      const matchPhone = o.customer_phone.includes(q);
      const matchItem = o.items.some(it => it.product_name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q));

      return matchNum || matchCust || matchPhone || matchItem;
    });
  }, [orders, statusFilter, channelFilter, paymentFilter, searchQuery]);

  const totalPages = Math.max(Math.ceil(filteredOrders.length / pageSize), 1);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'Received':
        return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900';
      case 'Packed':
        return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900';
      case 'Shipped':
        return 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900';
      case 'Delivered':
        return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900';
      case 'Cancelled':
        return 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900';
      case 'Returned':
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Actions Row */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery || ''}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search order #, customer, item..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter || 'ALL'}
            onChange={e => {
              setStatusFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Statuses</option>
            <option value="Received">Received</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Returned">Returned</option>
          </select>

          {/* Sales Channel Filter */}
          <select
            value={channelFilter || 'ALL'}
            onChange={e => {
              setChannelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Channels</option>
            {salesChannels.map(sc => (
              <option key={sc.id} value={sc.id}>
                {sc.channel_name}
              </option>
            ))}
          </select>

          {/* Payment Method Filter */}
          <select
            value={paymentFilter || 'ALL'}
            onChange={e => {
              setPaymentFilter(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">All Payments</option>
            <option value="UPI">UPI</option>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
          </select>

          {/* Add Order Button */}
          <button
            id="btn-new-order"
            onClick={() => setIsAddModalOpen(true)}
            className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Order
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Order #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Items Count</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map(o => (
                  <tr
                    key={o.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      #{o.order_number}
                    </td>

                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {o.order_date}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {o.customer_name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {o.customer_phone}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                      {o.sales_channel_name}
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      {o.payment_method}
                    </td>

                    <td className="py-3 px-4 font-semibold">
                      {o.items.reduce((s, it) => s + it.quantity, 0)} pcs ({o.items.length} items)
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {formatMoney(o.total_amount)}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                          o.status
                        )}`}
                      >
                        {o.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Inspect Order Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {onNavigateToInvoicesWithOrder && (
                          <button
                            onClick={() => onNavigateToInvoicesWithOrder(o)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Invoice Order"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}

                        {onNavigateToReturnsWithOrder && o.status === 'Delivered' && (
                          <button
                            onClick={() => onNavigateToReturnsWithOrder(o)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Process Return"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
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

      {/* Add Order Modal */}
      <AddOrderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onOrderCreated={refreshOrders}
      />

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onOrderUpdated={refreshOrders}
        onGenerateInvoice={onNavigateToInvoicesWithOrder}
        onInitiateReturn={onNavigateToReturnsWithOrder}
      />
    </div>
  );
};
