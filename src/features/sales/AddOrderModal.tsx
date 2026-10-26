import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Scan,
  User,
  ShoppingBag,
  CreditCard,
  Building,
} from 'lucide-react';
import { db } from '../../services/database';
import { Product, ProductVariant, PaymentMethod, SalesChannel, OrderLineItem } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
  preselectedProduct?: Product | null;
  preselectedVariant?: ProductVariant | null;
}

interface DraftLineItem {
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  sku: string;
  quantity: number;
  unit_price: number;
  discount: number;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
  preselectedProduct,
  preselectedVariant,
}) => {
  const { formatMoney, defaultCurrency, settings } = useSettings();

  // Reference data
  const products = useMemo(() => db.getProducts(false), [isOpen]);
  const customers = useMemo(() => db.getCustomers(), [isOpen]);
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>(() => db.getSalesChannels());

  // Form states
  const [orderNumber, setOrderNumber] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [channelId, setChannelId] = useState<string>('');
  const [newChannelName, setNewChannelName] = useState('');
  const [showNewChannelInput, setShowNewChannelInput] = useState(false);

  // Customer selection
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('new');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  // Line items
  const [items, setItems] = useState<DraftLineItem[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setOrderNumber(db.getNextOrderNumber());
      setOrderDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setValidationError(null);

      const channels = db.getSalesChannels();
      setSalesChannels(channels);
      if (channels.length > 0) {
        setChannelId(channels[0].id);
      }

      // Reset customer
      setSelectedCustomerId('new');
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setShippingAddress('');

      // Pre-add item if passed from barcode scanner or product page
      if (preselectedProduct) {
        const variant = preselectedVariant;
        setItems([
          {
            product_id: preselectedProduct.id,
            variant_id: variant?.id,
            product_name: preselectedProduct.name,
            variant_name: variant?.variant_name,
            sku: variant ? variant.sku : preselectedProduct.sku,
            quantity: 1,
            unit_price: variant ? variant.selling_price : preselectedProduct.selling_price,
            discount: variant ? variant.discount : preselectedProduct.discount,
          },
        ]);
      } else {
        // Start with one empty slot
        setItems([]);
      }
    }
  }, [isOpen, preselectedProduct, preselectedVariant]);

  // When existing customer is chosen, autofill
  const handleCustomerChange = (id: string) => {
    setSelectedCustomerId(id);
    if (id === 'new') {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setShippingAddress('');
    } else {
      const found = customers.find(c => c.id === id);
      if (found) {
        setCustomerName(found.name || '');
        setCustomerPhone(found.phone || '');
        setCustomerEmail(found.email || '');
        setShippingAddress(found.address || '');
      }
    }
  };

  // Add line item
  const handleAddLineItem = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    const defaultVariant = defaultProduct.variants?.[0];

    setItems(prev => [
      ...prev,
      {
        product_id: defaultProduct.id,
        variant_id: defaultVariant?.id,
        product_name: defaultProduct.name || '',
        variant_name: defaultVariant?.variant_name || '',
        sku: defaultVariant ? defaultVariant.sku : defaultProduct.sku,
        quantity: 1,
        unit_price: defaultVariant ? (defaultVariant.selling_price ?? 0) : (defaultProduct.selling_price ?? 0),
        discount: defaultVariant ? (defaultVariant.discount ?? 0) : (defaultProduct.discount ?? 0),
      },
    ]);
  };

  const handleProductSelect = (index: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    const variant = prod.variants?.[0];
    const updated = [...items];
    updated[index] = {
      product_id: prod.id,
      variant_id: variant?.id,
      product_name: prod.name || '',
      variant_name: variant?.variant_name || '',
      sku: variant ? variant.sku : prod.sku,
      quantity: 1,
      unit_price: variant ? (variant.selling_price ?? 0) : (prod.selling_price ?? 0),
      discount: variant ? (variant.discount ?? 0) : (prod.discount ?? 0),
    };
    setItems(updated);
  };

  const handleVariantSelect = (index: number, variantId: string) => {
    const item = items[index];
    const prod = products.find(p => p.id === item.product_id);
    if (!prod || !prod.variants) return;

    const variant = prod.variants.find(v => v.id === variantId);
    if (!variant) return;

    const updated = [...items];
    updated[index] = {
      ...updated[index],
      variant_id: variant.id,
      variant_name: variant.variant_name || '',
      sku: variant.sku,
      unit_price: variant.selling_price ?? 0,
      discount: variant.discount ?? 0,
    };
    setItems(updated);
  };

  const handleItemFieldChange = (index: number, field: keyof DraftLineItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Add Sales Channel dynamically
  const handleAddNewChannel = () => {
    if (!newChannelName.trim()) return;
    const added = db.addSalesChannel(newChannelName.trim());
    setSalesChannels(db.getSalesChannels());
    setChannelId(added.id);
    setNewChannelName('');
    setShowNewChannelInput(false);
  };

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + it.quantity * it.unit_price, 0);
  }, [items]);

  const totalDiscount = useMemo(() => {
    return items.reduce((sum, it) => {
      const lineSub = it.quantity * it.unit_price;
      return sum + (lineSub * (it.discount || 0)) / 100;
    }, 0);
  }, [items]);

  const taxAmount = useMemo(() => {
    const taxable = subtotal - totalDiscount;
    return (taxable * (settings.default_tax_rate || 0)) / 100;
  }, [subtotal, totalDiscount, settings.default_tax_rate]);

  const grandTotal = useMemo(() => {
    return Math.max(subtotal - totalDiscount + taxAmount, 0);
  }, [subtotal, totalDiscount, taxAmount]);

  // Submit Order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!customerName.trim()) {
      setValidationError('Customer Name is required.');
      return;
    }
    if (!customerPhone.trim()) {
      setValidationError('Customer Phone Number is required.');
      return;
    }
    if (items.length === 0) {
      setValidationError('Please add at least one line item to the order.');
      return;
    }

    // Check stock availability for each item
    for (const it of items) {
      if (it.quantity <= 0) {
        setValidationError(`Quantity for "${it.product_name}" must be at least 1.`);
        return;
      }
      const prod = products.find(p => p.id === it.product_id);
      if (prod) {
        const availableUnits = it.variant_id
          ? prod.variants?.find(v => v.id === it.variant_id)?.units || 0
          : prod.units;
        if (it.quantity > availableUnits && !settings.allow_negative_stock) {
          setValidationError(
            `Insufficient stock for "${it.product_name}" (${it.variant_name || 'Standard'}). Available: ${availableUnits}, Requested: ${it.quantity}.`
          );
          return;
        }
      }
    }

    const channel = salesChannels.find(c => c.id === channelId);

    const formattedItems: Omit<OrderLineItem, 'id' | 'order_id' | 'created_at'>[] = items.map(it => {
      const lineSub = it.quantity * it.unit_price;
      const lineDisc = (lineSub * (it.discount || 0)) / 100;
      return {
        product_id: it.product_id,
        variant_id: it.variant_id,
        product_name: it.product_name,
        variant_name: it.variant_name,
        sku: it.sku,
        quantity: Number(it.quantity),
        unit_price: Number(it.unit_price),
        discount: Number(it.discount),
        tax_amount: 0,
        subtotal: lineSub - lineDisc,
      };
    });

    const res = db.createOrder({
      order_number: orderNumber,
      order_date: orderDate,
      customer_id: selectedCustomerId !== 'new' ? selectedCustomerId : undefined,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || undefined,
      shipping_address: shippingAddress.trim() || undefined,
      status: 'Received',
      payment_method: paymentMethod,
      sales_channel_id: channelId,
      sales_channel_name: channel?.channel_name || 'In-store Direct',
      subtotal,
      total_discount: totalDiscount,
      tax_amount: taxAmount,
      total_amount: grandTotal,
      currency: defaultCurrency.code,
      items: formattedItems,
    });

    if (!res.success) {
      setValidationError(res.error || 'Failed to create order.');
      return;
    }

    onOrderCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Create Sales Order
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
                  #{orderNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated stock deduction & transactional audit integration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmitOrder} className="flex-1 overflow-y-auto p-5 space-y-5">
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Customer & Order Metadata Grid */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600" /> Customer Information
              </span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-slate-500">Select Customer:</label>
                <select
                  value={selectedCustomerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className="px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="new">+ New Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="optional@domain.com"
                  className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Shipping Address
                </label>
                <input
                  type="text"
                  value={shippingAddress}
                  onChange={e => setShippingAddress(e.target.value)}
                  placeholder="City, State, Pincode"
                  className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Order Details: Date, Payment, Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Order Date
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
              >
                <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                <option value="Cash">Cash on Delivery / Direct Cash</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / RTGS)</option>
                <option value="Other">Other Gateway</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Sales Channel
                </label>
                <button
                  type="button"
                  onClick={() => setShowNewChannelInput(!showNewChannelInput)}
                  className="text-[10px] text-blue-600 font-semibold hover:underline"
                >
                  {showNewChannelInput ? 'Cancel' : '+ New Channel'}
                </button>
              </div>

              {showNewChannelInput ? (
                <div className="mt-1 flex gap-1">
                  <input
                    type="text"
                    placeholder="Channel name..."
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewChannel}
                    className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-semibold text-xs"
                  >
                    Add
                  </button>
                </div>
              ) : (
                <select
                  value={channelId}
                  onChange={e => setChannelId(e.target.value)}
                  className="mt-1 w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white"
                >
                  {salesChannels.map(sc => (
                    <option key={sc.id} value={sc.id}>
                      {sc.channel_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Order Line Items ({items.length})
              </span>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line Item
              </button>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2.5 px-3">Product Item</th>
                    <th className="py-2.5 px-3">Variant</th>
                    <th className="py-2.5 px-3 w-20">Qty</th>
                    <th className="py-2.5 px-3 w-28">Rate ({defaultCurrency.symbol})</th>
                    <th className="py-2.5 px-3 w-20">Disc %</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                    <th className="py-2.5 px-3 w-10 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No items added yet. Click &quot;Add Line Item&quot; to build the order.
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => {
                      const prod = products.find(p => p.id === item.product_id);
                      const lineSub = item.quantity * item.unit_price;
                      const lineTotal = lineSub - (lineSub * (item.discount || 0)) / 100;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          {/* Product select */}
                          <td className="py-2 px-3">
                            <select
                              value={item.product_id}
                              onChange={e => handleProductSelect(idx, e.target.value)}
                              className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-semibold"
                            >
                              {products.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.units} in stock)
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* Variant select if applicable */}
                          <td className="py-2 px-3">
                            {prod?.item_type === 'variant' && prod.variants && prod.variants.length > 0 ? (
                              <select
                                value={item.variant_id || ''}
                                onChange={e => handleVariantSelect(idx, e.target.value)}
                                className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-xs"
                              >
                                {prod.variants.map(v => (
                                  <option key={v.id} value={v.id}>
                                    {v.variant_name} ({v.units} left)
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-slate-400 text-xs">Standard</span>
                            )}
                          </td>

                          {/* Qty */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity ?? 1}
                              onChange={e =>
                                handleItemFieldChange(idx, 'quantity', parseInt(e.target.value) || 1)
                              }
                              className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-bold"
                            />
                          </td>

                          {/* Rate */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price ?? 0}
                              onChange={e =>
                                handleItemFieldChange(
                                  idx,
                                  'unit_price',
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-xs font-semibold"
                            />
                          </td>

                          {/* Discount % */}
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={item.discount ?? 0}
                              onChange={e =>
                                handleItemFieldChange(idx, 'discount', parseFloat(e.target.value) || 0)
                              }
                              className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-xs"
                            />
                          </td>

                          {/* Line Total */}
                          <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                            {formatMoney(lineTotal)}
                          </td>

                          {/* Remove */}
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation Totals Box */}
          <div className="flex justify-end pt-2">
            <div className="w-full sm:w-72 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Total Discount:</span>
                <span className="font-semibold">-{formatMoney(totalDiscount)}</span>
              </div>
              {settings.default_tax_rate > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Tax ({settings.default_tax_rate}%):</span>
                  <span className="font-semibold">+{formatMoney(taxAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-bold text-slate-900 dark:text-white">
                <span>Grand Total:</span>
                <span className="text-blue-600 dark:text-blue-400">{formatMoney(grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" /> Save &amp; Deduct Stock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
