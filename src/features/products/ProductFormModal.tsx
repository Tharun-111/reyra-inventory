import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Upload,
  Layers,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
} from 'lucide-react';
import { db } from '../../services/database';
import { Product, ProductType, ProductVariant } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingProduct?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  editingProduct,
}) => {
  const { defaultCurrency } = useSettings();

  const [name, setName] = useState('');
  const [sourcingAgency, setSourcingAgency] = useState('');
  const [itemType, setItemType] = useState<ProductType>('single');
  const [sku, setSku] = useState('');
  const [units, setUnits] = useState<number>(0);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [mrp, setMrp] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [images, setImages] = useState<string[]>([]);

  // Variants state
  const [variants, setVariants] = useState<Omit<ProductVariant, 'id' | 'product_id' | 'created_at' | 'updated_at'>[]>([
    {
      variant_name: 'Default Variant',
      sku: '',
      barcode: '',
      units: 10,
      buy_price: 0,
      selling_price: 0,
      mrp: 0,
      discount: 0,
    },
  ]);

  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name || '');
      setSourcingAgency(editingProduct.sourcing_agency || '');
      setItemType(editingProduct.item_type || 'single');
      setSku(editingProduct.sku || '');
      setUnits(editingProduct.units ?? 0);
      setBuyPrice(editingProduct.buy_price ?? 0);
      setSellingPrice(editingProduct.selling_price ?? 0);
      setMrp(editingProduct.mrp ?? 0);
      setDiscount(editingProduct.discount ?? 0);
      setImages(editingProduct.images || []);
      if (editingProduct.variants && editingProduct.variants.length > 0) {
        setVariants(
          editingProduct.variants.map(v => ({
            variant_name: v.variant_name || '',
            sku: v.sku || '',
            barcode: v.barcode || v.sku || '',
            units: v.units ?? 0,
            buy_price: v.buy_price ?? 0,
            selling_price: v.selling_price ?? 0,
            mrp: v.mrp ?? 0,
            discount: v.discount ?? 0,
          }))
        );
      }
    } else {
      resetForm();
    }
  }, [editingProduct, isOpen]);

  const resetForm = () => {
    setName('');
    setSourcingAgency('');
    setItemType('single');
    setSku('');
    setUnits(0);
    setBuyPrice(0);
    setSellingPrice(0);
    setMrp(0);
    setDiscount(0);
    setImages([]);
    setVariants([
      {
        variant_name: 'Variant 1',
        sku: '',
        barcode: '',
        units: 0,
        buy_price: 0,
        selling_price: 0,
        mrp: 0,
        discount: 0,
      },
    ]);
    setValidationError(null);
  };

  const handleAddImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (images.length >= 5) {
        setValidationError('Maximum 5 images permitted per product.');
        return;
      }
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = uploadEvent => {
        if (uploadEvent.target?.result) {
          setImages(prev => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddVariantRow = () => {
    setVariants([
      ...variants,
      {
        variant_name: `Variant ${variants.length + 1}`,
        sku: `${sku || 'SKU'}-V${variants.length + 1}`,
        barcode: '',
        units: 0,
        buy_price: buyPrice,
        selling_price: sellingPrice,
        mrp: mrp,
        discount: discount,
      },
    ]);
  };

  const handleRemoveVariantRow = (idx: number) => {
    if (variants.length <= 1) {
      setValidationError('A variant product must have at least one variant.');
      return;
    }
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const updateVariantField = (idx: number, field: string, val: any) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: val };
    setVariants(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validation
    if (!name.trim()) {
      setValidationError('Product Name is required.');
      return;
    }
    if (!sku.trim()) {
      setValidationError('Primary SKU is required.');
      return;
    }
    if (units < 0) {
      setValidationError('Units cannot be negative.');
      return;
    }
    if (sellingPrice < 0 || buyPrice < 0 || mrp < 0) {
      setValidationError('Price values must be non-negative.');
      return;
    }
    if (discount < 0 || discount > 100) {
      setValidationError('Discount must be between 0% and 100%.');
      return;
    }

    let formattedVariants: ProductVariant[] = [];
    let totalCalculatedUnits = units;

    if (itemType === 'variant') {
      if (variants.length === 0) {
        setValidationError('At least one variant must be defined for variant items.');
        return;
      }
      for (const v of variants) {
        if (!v.variant_name.trim()) {
          setValidationError('All variants must have a name (e.g. Size: L, Color: Navy).');
          return;
        }
        if (!v.sku.trim()) {
          setValidationError('Every variant requires its own unique SKU.');
          return;
        }
        if (v.units < 0) {
          setValidationError('Variant units cannot be negative.');
          return;
        }
      }

      totalCalculatedUnits = variants.reduce((acc, v) => acc + (Number(v.units) || 0), 0);
      formattedVariants = variants.map((v, i) => ({
        id: editingProduct?.variants?.[i]?.id || 'var-' + Date.now() + '-' + i,
        product_id: editingProduct?.id || '',
        variant_name: v.variant_name,
        sku: v.sku.trim().toUpperCase(),
        barcode: v.barcode || v.sku.trim().toUpperCase(),
        units: Number(v.units) || 0,
        buy_price: Number(v.buy_price) || 0,
        selling_price: Number(v.selling_price) || 0,
        mrp: Number(v.mrp) || 0,
        discount: Number(v.discount) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
    }

    const res = db.saveProduct({
      id: editingProduct?.id,
      name: name.trim(),
      sourcing_agency: sourcingAgency.trim(),
      item_type: itemType,
      sku: sku.trim().toUpperCase(),
      barcode: sku.trim().toUpperCase(),
      units: totalCalculatedUnits,
      buy_price: Number(buyPrice) || 0,
      selling_price: Number(sellingPrice) || 0,
      mrp: Number(mrp) || 0,
      discount: Number(discount) || 0,
      images,
      is_archived: editingProduct?.is_archived || false,
      variants: formattedVariants,
    });

    if (!res.success) {
      setValidationError(res.error || 'Failed to save product.');
      return;
    }

    onSaved();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {editingProduct ? 'Edit Product Item' : 'Add New Product Item'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enterprise catalog management with pricing and variant matrix
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ergonomic Office Chair"
                className="mt-1 w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Sourcing Agency / Supplier
              </label>
              <input
                type="text"
                value={sourcingAgency}
                onChange={e => setSourcingAgency(e.target.value)}
                placeholder="e.g. Apex Industrial Works"
                className="mt-1 w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Item Structure Type
              </label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setItemType('single')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                    itemType === 'single'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Single Item
                </button>
                <button
                  type="button"
                  onClick={() => setItemType('variant')}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors ${
                    itemType === 'variant'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Variant Item
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                Primary SKU <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={e => setSku(e.target.value)}
                placeholder="e.g. CHR-ERG-01"
                className="mt-1 w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono uppercase"
              />
            </div>

            {itemType === 'single' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Initial Units In Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={units ?? 0}
                  onChange={e => setUnits(parseInt(e.target.value) || 0)}
                  className="mt-1 w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            )}
          </div>

          {/* Pricing Row */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Pricing Configuration ({defaultCurrency.symbol} {defaultCurrency.code})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Buy / Cost Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={buyPrice ?? 0}
                  onChange={e => setBuyPrice(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Selling Price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice ?? 0}
                  onChange={e => setSellingPrice(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Market Price (MRP)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={mrp ?? 0}
                  onChange={e => setMrp(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={discount ?? 0}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="mt-1 w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Variants Section */}
          {itemType === 'variant' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" /> Variant Matrix ({variants.length})
                </label>
                <button
                  type="button"
                  onClick={handleAddVariantRow}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Variant
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder="Variant Name (e.g. Red / M)"
                        value={v.variant_name || ''}
                        onChange={e => updateVariantField(idx, 'variant_name', e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-medium"
                      />
                      <input
                        type="text"
                        placeholder="Variant SKU"
                        value={v.sku || ''}
                        onChange={e => updateVariantField(idx, 'sku', e.target.value.toUpperCase())}
                        className="w-36 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white font-mono uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantRow(idx)}
                        className="p-1 text-red-500 hover:text-red-700"
                        title="Remove Variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block">Stock:</span>
                        <input
                          type="number"
                          min="0"
                          value={v.units ?? 0}
                          onChange={e => updateVariantField(idx, 'units', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block">Buy:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={v.buy_price ?? 0}
                          onChange={e => updateVariantField(idx, 'buy_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sale:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={v.selling_price ?? 0}
                          onChange={e => updateVariantField(idx, 'selling_price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block">MRP:</span>
                        <input
                          type="number"
                          step="0.01"
                          value={v.mrp ?? 0}
                          onChange={e => updateVariantField(idx, 'mrp', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                      <div>
                        <span className="text-slate-500 block">Disc%:</span>
                        <input
                          type="number"
                          step="0.1"
                          value={v.discount ?? 0}
                          onChange={e => updateVariantField(idx, 'discount', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images Upload (1:1 Ratio, Max 5) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                Product Images (1:1 Square, Max 5)
              </label>
              <span className="text-xs text-slate-400">{images.length}/5 uploaded</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden group">
                  <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-500 cursor-pointer transition-colors bg-slate-50 dark:bg-slate-800/40">
                  <Upload className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5 font-medium">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAddImage}
                    className="hidden"
                  />
                </label>
              )}
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
              <CheckCircle2 className="w-4 h-4" />
              {editingProduct ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
