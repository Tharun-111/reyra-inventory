import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Truck,
  Building,
  Calendar,
} from 'lucide-react';
import { db } from '../../services/database';
import { Product, ProductVariant, PurchaseItem } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchaseCreated: () => void;
}

interface DraftPurchaseItem {
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  sku: string;
  quantity: number;
  unit_cost: number;
}

export const AddPurchaseModal: React.FC<AddPurchaseModalProps> = ({
  isOpen,
  onClose,
  onPurchaseCreated,
}) => {
  const { formatMoney, defaultCurrency } = useSettings();
  const products = useMemo(() => db.getProducts(false), [isOpen]);

  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [poNumber, setPoNumber] = useState(`PO-${Date.now().toString().slice(-6)}`);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partial' | 'Unpaid'>('Unpaid');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DraftPurchaseItem[]>([]);
  const [modalError, setModalError] = useState<string | null>(null);

  const handleAddItem = () => {
    if (products.length === 0) return;
    const p = products[0];
    const v = p.variants?.[0];
    setItems(prev => [
      ...prev,
      {
        product_id: p.id,
        variant_id: v?.id,
        product_name: p.name || '',
        variant_name: v?.variant_name || '',
        sku: v ? v.sku : p.sku,
        quantity: 10,
        unit_cost: v ? (v.buy_price ?? 0) : (p.buy_price ?? 0),
      },
    ]);
  };

  const handleProductSelect = (idx: number, prodId: string) => {
    const p = products.find(prod => prod.id === prodId);
    if (!p) return;
    const v = p.variants?.[0];
    const updated = [...items];
    updated[idx] = {
      product_id: p.id,
      variant_id: v?.id,
      product_name: p.name || '',
      variant_name: v?.variant_name || '',
      sku: v ? v.sku : p.sku,
      quantity: 10,
      unit_cost: v ? (v.buy_price ?? 0) : (p.buy_price ?? 0),
    };
    setItems(updated);
  };

  const handleVariantSelect = (idx: number, varId: string) => {
    const it = items[idx];
    const p = products.find(prod => prod.id === it.product_id);
    if (!p || !p.variants) return;
    const v = p.variants.find(varnt => varnt.id === varId);
    if (!v) return;
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      variant_id: v.id,
      variant_name: v.variant_name || '',
      sku: v.sku,
      unit_cost: v.buy_price ?? 0,
    };
    setItems(updated);
  };

  const handleUpdateItem = (idx: number, field: keyof DraftPurchaseItem, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const grandTotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.quantity * it.unit_cost, 0);
  }, [items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!vendorName.trim()) {
      setModalError('Vendor / Supplier Name is required.');
      return;
    }
    if (items.length === 0) {
      setModalError('Please add at least one item to restock.');
      return;
    }
    for (const it of items) {
      if (it.quantity <= 0) {
        setModalError(`Quantity for "${it.product_name}" must be greater than 0.`);
        return;
      }
    }

    const formattedItems: Omit<PurchaseItem, 'id' | 'purchase_id'>[] = items.map(it => ({
      product_id: it.product_id,
      variant_id: it.variant_id,
      product_name: it.product_name,
      variant_name: it.variant_name,
      sku: it.sku,
      quantity: Number(it.quantity),
      unit_cost: Number(it.unit_cost),
      total_cost: Number(it.quantity) * Number(it.unit_cost),
    }));

    const res = db.createPurchase({
      po_number: poNumber,
      vendor_name: vendorName.trim(),
      vendor_contact: vendorContact.trim() || undefined,
      order_date: orderDate,
      expected_delivery_date: expectedDate,
      payment_status: paymentStatus,
      status: 'Ordered',
      grand_total: grandTotal,
      notes: notes.trim() || undefined,
      items: formattedItems,
    });

    if (!res.success) {
      setModalError(res.error || 'Failed to create purchase order.');
      return;
    }

    onPurchaseCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create Purchase Order (PO)
              </h3>
              <p className="text-xs text-slate-500">
                Supplier procurement and warehouse restock management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Vendor Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Vendor / Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={vendorName}
                onChange={e => setVendorName(e.target.value)}
                placeholder="e.g. Acme Manufacturing Ltd."
                className="mt-1 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Vendor Contact / Email
              </label>
              <input
                type="text"
                value={vendorContact}
                onChange={e => setVendorContact(e.target.value)}
                placeholder="e.g. sales@acme.com / phone"
                className="mt-1 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                PO Number
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Order Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDate}
                onChange={e => setExpectedDate(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={e => setPaymentStatus(e.target.value as any)}
                className="mt-1 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              >
                <option value="Unpaid">Unpaid / On Credit</option>
                <option value="Partial">Partial Advance Paid</option>
                <option value="Paid">Fully Paid</option>
              </select>
            </div>
          </div>

          {/* Restock Line Items */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                Procurement Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-blue-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Product Item
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 font-semibold border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">Product</th>
                    <th className="py-2.5 px-3">Variant</th>
                    <th className="py-2.5 px-3 w-24">Restock Qty</th>
                    <th className="py-2.5 px-3 w-28">Cost / Unit</th>
                    <th className="py-2.5 px-3 text-right">Total</th>
                    <th className="py-2.5 px-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((it, idx) => {
                    const prod = products.find(p => p.id === it.product_id);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <select
                            value={it.product_id}
                            onChange={e => handleProductSelect(idx, e.target.value)}
                            className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          {prod?.variants && prod.variants.length > 0 ? (
                            <select
                              value={it.variant_id || ''}
                              onChange={e => handleVariantSelect(idx, e.target.value)}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-xs"
                            >
                              {prod.variants.map(v => (
                                <option key={v.id} value={v.id}>
                                  {v.variant_name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-slate-400">Standard</span>
                          )}
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            value={it.quantity ?? 1}
                            onChange={e =>
                              handleUpdateItem(idx, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg font-bold"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.unit_cost ?? 0}
                            onChange={e =>
                              handleUpdateItem(idx, 'unit_cost', parseFloat(e.target.value) || 0)
                            }
                            className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg"
                          />
                        </td>

                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                          {formatMoney(it.quantity * it.unit_cost)}
                        </td>

                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grand Total */}
          <div className="flex justify-end pt-2">
            <div className="w-60 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between font-bold text-sm">
              <span>Total PO Value:</span>
              <span className="text-blue-600 dark:text-blue-400">{formatMoney(grandTotal)}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Create Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
