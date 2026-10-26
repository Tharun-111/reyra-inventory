import React, { useState, useEffect, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  FileUp,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Package,
  ShoppingCart,
  Users,
  Layers,
  FileText,
  Copy,
  Clock,
  ArrowRight,
  Info,
  History,
  Check,
  X,
  FileSpreadsheet,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { db } from '../../services/database';
import { BackupInspectResult, BackupSummary, BackupCounts } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface BackupRestoreCenterProps {
  onDataRestored?: () => void;
}

export const BackupRestoreCenter: React.FC<BackupRestoreCenterProps> = ({ onDataRestored }) => {
  const { verifyCurrentPassword } = useAuth();
  
  // Factory Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isVerifyingReset, setIsVerifyingReset] = useState(false);

  // Database Live Counters
  const [liveStats, setLiveStats] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    movements: 0,
    purchases: 0,
    invoices: 0,
  });

  // Safety Snapshot state
  const [safetyInfo, setSafetyInfo] = useState<{ created_at: string; counts: BackupCounts } | null>(null);

  // File Inspection state
  const [inspectedFile, setInspectedFile] = useState<BackupInspectResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [createSafetyPoint, setCreateSafetyPoint] = useState<boolean>(true);

  // UI state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshState = () => {
    const prods = db.getProducts(true);
    const ords = db.getOrders();
    const custs = db.getCustomers();
    const movs = db.getInventoryMovements();
    const purs = db.getPurchases();
    const invs = db.getInvoices();

    setLiveStats({
      products: prods.length,
      orders: ords.length,
      customers: custs.length,
      movements: movs.length,
      purchases: purs.length,
      invoices: invs.length,
    });

    setSafetyInfo(db.getSafetySnapshotInfo());
  };

  useEffect(() => {
    refreshState();
  }, []);

  // --- EXPORT HANDLERS ---
  const handleDownloadBackup = (catalogOnly: boolean = false) => {
    try {
      const backupJson = db.exportDatabaseBackup(catalogOnly);
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const prefix = catalogOnly ? 'reyra_catalog_inventory' : 'reyra_full_database_backup';
      const filename = `${prefix}_${timestamp}.json`;

      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatusMessage({
        type: 'success',
        text: catalogOnly
          ? `Catalog & Inventory backup downloaded successfully (${filename})`
          : `Complete system backup downloaded successfully (${filename})`,
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: 'Failed to generate backup file: ' + (err?.message || 'Unknown error'),
      });
    }
  };

  const handleCopyBackupToClipboard = async () => {
    try {
      const backupJson = db.exportDatabaseBackup(false);
      await navigator.clipboard.writeText(backupJson);
      setCopiedBackup(true);
      setStatusMessage({
        type: 'success',
        text: 'Complete database JSON copied to clipboard!',
      });
      setTimeout(() => {
        setCopiedBackup(false);
        setStatusMessage(null);
      }, 3500);
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Failed to copy to clipboard. Please use the Download option instead.',
      });
    }
  };

  // --- FILE SELECTION & INSPECTION ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStatusMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      const inspectRes = db.inspectBackupFile(content);
      setInspectedFile(inspectRes);

      if (!inspectRes.valid) {
        setStatusMessage({
          type: 'error',
          text: inspectRes.error || 'The selected file is not a valid REYRA database backup.',
        });
      }
    };

    reader.onerror = () => {
      setStatusMessage({
        type: 'error',
        text: 'Could not read file from device.',
      });
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  // --- EXECUTE RESTORE ---
  const handleExecuteRestore = () => {
    if (!inspectedFile || !inspectedFile.valid || !inspectedFile.data) return;

    const confirmMsg =
      restoreMode === 'replace'
        ? `Are you sure you want to perform a FULL RESTORE from "${fileName}"?\n\nThis will replace all current operational data with the contents of the backup archive. A safety snapshot will be created.`
        : `Are you sure you want to MERGE records from "${fileName}" into your current database?`;

    if (!window.confirm(confirmMsg)) return;

    setIsProcessing(true);
    setStatusMessage({
      type: 'info',
      text: 'Verifying data integrity and executing restore procedure...',
    });

    setTimeout(() => {
      const res = db.restoreDatabase(inspectedFile.data, {
        mode: restoreMode,
        createSafetyPoint,
      });

      setIsProcessing(false);

      if (res.success) {
        setInspectedFile(null);
        setFileName('');
        refreshState();
        setStatusMessage({
          type: 'success',
          text: `Database successfully restored! Restored ${res.restoredCounts?.products || 0} products, ${
            res.restoredCounts?.orders || 0
          } orders. Reloading workspace...`,
        });

        if (onDataRestored) {
          onDataRestored();
        }

        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'Failed to restore database.',
        });
      }
    }, 400);
  };

  // --- ROLLBACK SAFETY SNAPSHOT ---
  const handleRollbackSnapshot = () => {
    if (!safetyInfo) return;
    if (
      !window.confirm(
        'Roll back to the safety snapshot created before the last restore? This will return the database to that exact previous moment.'
      )
    ) {
      return;
    }

    const res = db.restoreSafetySnapshot();
    if (res.success) {
      db.clearSafetySnapshot();
      refreshState();
      setStatusMessage({
        type: 'success',
        text: 'Database successfully rolled back to pre-restore safety snapshot! Refreshing...',
      });
      setTimeout(() => window.location.reload(), 1200);
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Rollback failed.',
      });
    }
  };

  const handleClearSafetySnapshot = () => {
    db.clearSafetySnapshot();
    setSafetyInfo(null);
    setStatusMessage({
      type: 'info',
      text: 'Safety snapshot discarded.',
    });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetSampleData = () => {
    setResetPasswordInput('');
    setResetError('');
    setIsResetModalOpen(true);
  };

  const handleExecuteFactoryReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordInput.trim()) {
      setResetError('Please enter your account password.');
      return;
    }

    setIsVerifyingReset(true);
    setResetError('');
    try {
      const isValid = await verifyCurrentPassword(resetPasswordInput);
      if (!isValid) {
        setResetError('Incorrect password. Authorization denied. Database was not reset.');
        setIsVerifyingReset(false);
        return;
      }

      setIsResetModalOpen(false);
      setResetPasswordInput('');
      db.resetToSampleData();
      refreshState();
      setStatusMessage({
        type: 'success',
        text: 'Factory reset authorized and database restored to demo state. Reloading...',
      });
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setResetError('Verification failed. Please try again.');
    } finally {
      setIsVerifyingReset(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications / Feedback */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-300'
              : 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
            {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
            {statusMessage.type === 'info' && <Info className="w-4 h-4 text-blue-600 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Safety Rollback Alert Banner (if snapshot exists) */}
      {safetyInfo && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <span>Safety Restore Point Available</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                  Protected
                </span>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-0.5">
                Created before the last restore on {new Date(safetyInfo.created_at).toLocaleString()} (contains{' '}
                {safetyInfo.counts.products} products, {safetyInfo.counts.orders} orders).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleRollbackSnapshot}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo / Rollback
            </button>
            <button
              type="button"
              onClick={handleClearSafetySnapshot}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl text-xs transition-colors cursor-pointer"
              title="Discard this safety snapshot"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Live Workspace Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <Package className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Products</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {liveStats.products}
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Orders</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {liveStats.orders}
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Customers</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {liveStats.customers}
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <Layers className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Movements</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {liveStats.movements}
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Purchases</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {liveStats.purchases}
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Invoices</div>
            <div className="text-base font-extrabold text-slate-900 dark:text-white truncate">
              {liveStats.invoices}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ================= CARD 1: BACKUP DATABASE TO FILE ================= */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Backup Database to File
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Export complete data snapshot into a portable JSON archive
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Backup Archive Includes:
              </div>
              <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <li>• Complete Product Catalog &amp; Variants</li>
                <li>• Stock Levels &amp; Inventory History</li>
                <li>• Customer &amp; Vendor Directories</li>
                <li>• Orders, Sales Invoices &amp; Returns</li>
                <li>• Purchase Orders &amp; Procurement</li>
                <li>• Business Branding &amp; Tax Settings</li>
              </ul>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => handleDownloadBackup(false)}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Full System Backup (.JSON)
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadBackup(true)}
                className="flex-1 py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Only backup catalog, SKU variants, and warehouse stock units"
              >
                <Package className="w-3.5 h-3.5 text-blue-500" />
                Catalog &amp; Stock Only
              </button>

              <button
                type="button"
                onClick={handleCopyBackupToClipboard}
                className="py-2 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                title="Copy raw JSON to clipboard"
              >
                {copiedBackup ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    Copy JSON
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ================= CARD 2: RESTORE DATABASE FROM FILE ================= */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Restore Database from File
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Recover system data or migrate records from a backup JSON file
                </p>
              </div>
            </div>

            {/* File Drop/Selection Area */}
            {!inspectedFile?.valid ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center gap-2 transition-colors cursor-pointer"
              >
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Select Backup File to Restore
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Click to browse your device for a valid REYRA .json backup archive
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              /* Verified Inspection Card */
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                        Verified Backup Archive
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {fileName}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setInspectedFile(null);
                      setFileName('');
                    }}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                    title="Remove selected file"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Details Breakdown */}
                {inspectedFile.summary && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Products</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {inspectedFile.summary.counts.products}
                      </div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Orders</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {inspectedFile.summary.counts.orders}
                      </div>
                    </div>
                    <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">Customers</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {inspectedFile.summary.counts.customers}
                      </div>
                    </div>
                  </div>
                )}

                {/* Restore Mode Toggle */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Choose Restore Strategy:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRestoreMode('replace')}
                      className={`p-2 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                        restoreMode === 'replace'
                          ? 'bg-white dark:bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 font-bold text-blue-700 dark:text-blue-300'
                          : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold">Full Replace</div>
                      <div className="text-[10px] opacity-75">Clean Disaster Recovery</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRestoreMode('merge')}
                      className={`p-2 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                        restoreMode === 'merge'
                          ? 'bg-white dark:bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 font-bold text-blue-700 dark:text-blue-300'
                          : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="font-bold">Safe Merge</div>
                      <div className="text-[10px] opacity-75">Append / Upsert Records</div>
                    </button>
                  </div>
                </div>

                {/* Safety Snapshot Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={createSafetyPoint}
                    onChange={(e) => setCreateSafetyPoint(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Create safety restore point before applying (allows instant undo)</span>
                </label>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <div className="pt-2">
            {inspectedFile?.valid ? (
              <button
                type="button"
                onClick={handleExecuteRestore}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isProcessing ? 'Restoring Database...' : `Execute ${restoreMode === 'replace' ? 'Full Replace' : 'Safe Merge'}`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileUp className="w-4 h-4 text-emerald-600" />
                Choose Backup File to Restore
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Factory Reset Section */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Factory Reset &amp; Sample Data</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Restore factory default demo catalog and reset all transactional logs to initial sample state.
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetSampleData}
          className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
        >
          Reset To Factory Sample Data
        </button>
      </div>

      {/* Factory Reset Password Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/80 rounded-xl text-rose-600">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Authorize Factory Reset
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  Destructive Action: Password Required
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Resetting to factory defaults will clear all custom products, inventory movements, sales orders, invoices, and customers, restoring initial factory demo data. Please enter your account password to confirm.
            </p>

            <form onSubmit={handleExecuteFactoryReset} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Account Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    value={resetPasswordInput}
                    onChange={(e) => setResetPasswordInput(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {resetError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{resetError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetModalOpen(false);
                    setResetPasswordInput('');
                    setResetError('');
                  }}
                  disabled={isVerifyingReset}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingReset || !resetPasswordInput.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {isVerifyingReset ? 'Verifying...' : 'Authorize & Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
