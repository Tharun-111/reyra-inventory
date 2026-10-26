import React, { useState, useEffect, useRef } from 'react';
import { Camera, Scan, X, Search, CheckCircle2, AlertCircle, ShoppingCart, Sliders } from 'lucide-react';
import { db } from '../../services/database';
import { Product, ProductVariant } from '../../types';
import { useSettings } from '../../context/SettingsContext';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProductForSale?: (product: Product, variant?: ProductVariant) => void;
  onEditProduct?: (product: Product) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onSelectProductForSale,
  onEditProduct,
}) => {
  const { formatMoney } = useSettings();
  const [manualCode, setManualCode] = useState('');
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('manual');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [foundResult, setFoundResult] = useState<{ product: Product; variant?: ProductVariant } | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setFoundResult(null);
      setManualCode('');
      setSearchAttempted(false);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera streaming not supported on this device or browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);

      // Check if native BarcodeDetector is available
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        const barcodeDetector = new window.BarcodeDetector({ formats: ['code_128', 'ean_13', 'ean_8', 'qr_code', 'upc_a'] });
        const interval = setInterval(async () => {
          if (!videoRef.current || !streamRef.current) {
            clearInterval(interval);
            return;
          }
          try {
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes.length > 0) {
              const code = barcodes[0].rawValue;
              handleLookup(code);
              clearInterval(interval);
            }
          } catch {
            // frame not ready
          }
        }, 500);
      }
    } catch (err: any) {
      setCameraError(err.message || 'Could not access camera. Please use manual SKU entry or USB scanner.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleLookup = (code: string) => {
    const clean = code.trim();
    if (!clean) return;
    setSearchAttempted(true);
    const res = db.findProductOrVariantBySKU(clean);
    setFoundResult(res);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Barcode & SKU Scanner
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Camera, USB hardware scanner, or manual SKU lookup
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 px-4 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('manual');
              stopCamera();
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Manual SKU / USB Scanner
          </button>
          <button
            onClick={() => {
              setActiveTab('camera');
              startCamera();
            }}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'camera'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Device Camera
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {activeTab === 'manual' ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Enter or scan product SKU / Barcode:
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    autoFocus
                    value={manualCode || ''}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleLookup(manualCode);
                    }}
                    placeholder="e.g. EWM-M2-BLK or POLO-NAVY-M"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  {manualCode && (
                    <button
                      type="button"
                      onClick={() => setManualCode('')}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleLookup(manualCode)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <Search className="w-4 h-4" /> Lookup
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span>Tip:</span> USB barcode scanners will automatically populate and trigger search on Enter.
              </p>
            </div>
          ) : (
            <div className="space-y-3 text-center">
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center border border-slate-700">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {!cameraActive && !cameraError && (
                  <div className="text-slate-400 text-xs flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 opacity-60" />
                    <span>Click to initialize camera</span>
                  </div>
                )}
                {/* Aiming Reticle */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-3/4 h-1/2 border-2 border-dashed border-blue-500/80 rounded-lg animate-pulse" />
                  </div>
                )}
              </div>

              {cameraError && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs rounded-xl flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}

              {!cameraActive && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl"
                >
                  Start Video Scanner
                </button>
              )}
            </div>
          )}

          {/* Search Results Display */}
          {searchAttempted && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              {foundResult ? (
                <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Item Found
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {foundResult.product.name}
                      </h3>
                      {foundResult.variant && (
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          Variant: {foundResult.variant.variant_name}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatMoney(
                          foundResult.variant
                            ? foundResult.variant.selling_price
                            : foundResult.product.selling_price
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        In Stock:{' '}
                        <strong className="text-slate-800 dark:text-slate-200">
                          {foundResult.variant ? foundResult.variant.units : foundResult.product.units}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-blue-100 dark:border-blue-900/40 text-slate-600 dark:text-slate-300">
                    <div>
                      SKU:{' '}
                      <span className="font-mono font-medium text-slate-900 dark:text-white">
                        {foundResult.variant ? foundResult.variant.sku : foundResult.product.sku}
                      </span>
                    </div>
                    <div>
                      Agency:{' '}
                      <span className="font-medium text-slate-900 dark:text-white">
                        {foundResult.product.sourcing_agency || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Quick Workflow Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    {onSelectProductForSale && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProductForSale(foundResult.product, foundResult.variant);
                          onClose();
                        }}
                        className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" /> Add to New Sale
                      </button>
                    )}
                    {onEditProduct && (
                      <button
                        type="button"
                        onClick={() => {
                          onEditProduct(foundResult.product);
                          onClose();
                        }}
                        className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Sliders className="w-3.5 h-3.5" /> Edit Product
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-1">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No product matches this barcode / SKU
                  </p>
                  <p className="text-xs text-slate-500">
                    Verify the code or create a new item with this SKU.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
