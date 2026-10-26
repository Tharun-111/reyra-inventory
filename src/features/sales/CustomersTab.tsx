import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  ExternalLink,
  Edit2,
  X,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { db } from '../../services/database';
import { Customer, Order } from '../../types';
import { useSettings } from '../../context/SettingsContext';

export const CustomersTab: React.FC = () => {
  const { formatMoney } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>(() => db.getCustomers());
  const [orders, setOrders] = useState<Order[]>(() => db.getOrders());
  const [searchQuery, setSearchQuery] = useState('');

  // Selected customer for side drawer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Edit Customer Modal
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const refreshData = () => {
    setCustomers(db.getCustomers());
    setOrders(db.getOrders());
  };

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, searchQuery]);

  // Customer Table Rows (as requested in Section 10: Order Date, Name, Email ID, Contact, Order No., Order Value)
  const customerOrderRows = useMemo(() => {
    const rows: {
      customer: Customer;
      latestOrder?: Order;
    }[] = [];

    filteredCustomers.forEach(cust => {
      const custOrders = orders.filter(o => o.customer_id === cust.id);
      const latestOrder = custOrders.length > 0 ? custOrders[0] : undefined;
      rows.push({
        customer: cust,
        latestOrder,
      });
    });

    return rows;
  }, [filteredCustomers, orders]);

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setEditName(c.name || '');
    setEditEmail(c.email || '');
    setEditPhone(c.phone || '');
    setEditAddress(c.address || '');
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;

    db.saveCustomer({
      id: editingCustomer.id,
      name: editName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      address: editAddress.trim(),
    });

    setEditingCustomer(null);
    refreshData();
  };

  return (
    <div className="space-y-4">
      {/* Top Search & Metrics */}
      <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, phone, email..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400">
          Total Registered Customers: <strong className="text-slate-900 dark:text-white">{customers.length}</strong>
        </div>
      </div>

      {/* Main Customers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Order Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Email ID</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Latest Order No.</th>
                <th className="py-3 px-4">Total Order Value (INR)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {customerOrderRows.map(({ customer, latestOrder }) => (
                <tr
                  key={customer.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {latestOrder ? latestOrder.order_date : customer.last_order_date || 'N/A'}
                  </td>

                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    <button
                      onClick={() => setSelectedCustomer(customer)}
                      className="text-left hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    >
                      {customer.name}
                    </button>
                  </td>

                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {customer.email || '—'}
                  </td>

                  <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                    {customer.phone}
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {latestOrder ? `#${latestOrder.order_number}` : 'None'}
                  </td>

                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {formatMoney(customer.total_spent)}
                    <span className="text-[10px] text-slate-400 block font-normal">
                      ({customer.total_orders} orders)
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                      >
                        History
                      </button>
                      <button
                        onClick={() => handleOpenEdit(customer)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Customer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer History Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Customer Profile & History
                </h3>
                <p className="text-xs text-slate-500">{selectedCustomer.name}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Customer Contact Details */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                  <Phone className="w-4 h-4 text-blue-600" /> {selectedCustomer.phone}
                </div>
                {selectedCustomer.email && (
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                    <Mail className="w-4 h-4 text-blue-600" /> {selectedCustomer.email}
                  </div>
                )}
                {selectedCustomer.address && (
                  <div className="flex items-start gap-2 text-slate-700 dark:text-slate-200 font-medium">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>{selectedCustomer.address}</span>
                  </div>
                )}
              </div>

              {/* Purchase Summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-100 dark:border-blue-900">
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 block">
                    Total Orders
                  </span>
                  <span className="text-xl font-bold text-blue-950 dark:text-white">
                    {selectedCustomer.total_orders}
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl border border-emerald-100 dark:border-emerald-900">
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block">
                    Total Spent
                  </span>
                  <span className="text-xl font-bold text-emerald-950 dark:text-white">
                    {formatMoney(selectedCustomer.total_spent)}
                  </span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-[11px]">
                  Recent Orders
                </h4>
                {orders
                  .filter(o => o.customer_id === selectedCustomer.id)
                  .map(o => (
                    <div
                      key={o.id}
                      className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          #{o.order_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">
                          {o.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500">
                        <span>{o.order_date}</span>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">
                          {formatMoney(o.total_amount)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit Customer Info</h3>
              <button
                onClick={() => setEditingCustomer(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">Address</label>
                <textarea
                  value={editAddress}
                  onChange={e => setEditAddress(e.target.value)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
