import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Building,
  DollarSign,
  Shield,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Database,
  Sun,
  Moon,
  Laptop,
  KeyRound,
  HelpCircle,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  User,
  Upload,
  FileUp,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { db } from '../../services/database';
import { UserRole } from '../../types';
import { ReyraLogo } from '../../components/brand/ReyraLogo';
import { BackupRestoreCenter } from './BackupRestoreCenter';

const LOGO_PRESETS = [
  {
    id: 'default-luxury',
    name: 'Default Luxury Reyra Emblem',
    description: 'Gold Architectural R on Deep Emerald',
    url: '',
    preview: '/assets/reyra_logo.jpg',
  },
  {
    id: 'sapphire-orbit',
    name: 'Sapphire Orbit',
    description: 'Modern Blue & Cyan Tech Gradient',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="so" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%232563eb"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23so)"/><circle cx="50" cy="50" r="26" fill="none" stroke="white" stroke-width="7"/><path d="M50 24 A26 26 0 0 1 76 50" fill="none" stroke="%23fbbf24" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="50" r="9" fill="white"/></svg>',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="so" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%232563eb"/><stop offset="100%" stop-color="%2306b6d4"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23so)"/><circle cx="50" cy="50" r="26" fill="none" stroke="white" stroke-width="7"/><path d="M50 24 A26 26 0 0 1 76 50" fill="none" stroke="%23fbbf24" stroke-width="7" stroke-linecap="round"/><circle cx="50" cy="50" r="9" fill="white"/></svg>',
  },
  {
    id: 'violet-vertex',
    name: 'Apex Violet Vertex',
    description: 'Vibrant Purple & Magenta Prismatic',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="vv" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%237c3aed"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23vv)"/><polygon points="50,22 80,75 20,75" fill="none" stroke="white" stroke-width="7" stroke-linejoin="round"/><polygon points="50,40 68,72 32,72" fill="white"/></svg>',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="vv" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%237c3aed"/><stop offset="100%" stop-color="%23ec4899"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23vv)"/><polygon points="50,22 80,75 20,75" fill="none" stroke="white" stroke-width="7" stroke-linejoin="round"/><polygon points="50,40 68,72 32,72" fill="white"/></svg>',
  },
  {
    id: 'emerald-shield',
    name: 'Emerald Shield',
    description: 'Secure Forest Green Geometric Badge',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="es" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23059669"/><stop offset="100%" stop-color="%2310b981"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23es)"/><polygon points="50,18 82,36 82,64 50,82 18,64 18,36" fill="none" stroke="white" stroke-width="6"/><path d="M35 50 L45 60 L65 40" fill="none" stroke="%23fef08a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="es" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="%23059669"/><stop offset="100%" stop-color="%2310b981"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(%23es)"/><polygon points="50,18 82,36 82,64 50,82 18,64 18,36" fill="none" stroke="white" stroke-width="6"/><path d="M35 50 L45 60 L65 40" fill="none" stroke="%23fef08a" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  {
    id: 'monogram-dark',
    name: 'Obsidian Monogram',
    description: 'Minimalist Cyan R on Obsidian Slate',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%230f172a"/><text x="50" y="68" font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="900" text-anchor="middle" fill="%2338bdf8">R</text></svg>',
    preview: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="%230f172a"/><text x="50" y="68" font-family="system-ui,-apple-system,sans-serif" font-size="52" font-weight="900" text-anchor="middle" fill="%2338bdf8">R</text></svg>',
  },
];

const COMMON_SECURITY_QUESTIONS = [
  'What is your all time GoTo place?',
  'What was the name of your first school?',
  'What is your favorite book or movie?',
  'What was the model of your first car?',
  'What city were you born in?',
];

export const SettingsPage: React.FC = () => {
  const { settings, updateSettings, defaultCurrency } = useSettings();
  const {
    currentUser,
    switchRole,
    securityCredentials,
    updateSecurityCredentials,
    verifyCurrentPassword,
    verifySecurityAnswer,
    logout,
  } = useAuth();
  const { theme, setTheme } = useTheme();

  // Business Parameters State
  const [brandName, setBrandName] = useState(settings.brand_name || '');
  const [businessEmail, setBusinessEmail] = useState(
    settings.business_email || settings.company_email || ''
  );
  const [businessPhone, setBusinessPhone] = useState(
    settings.business_phone || settings.company_phone || ''
  );
  const [businessAddress, setBusinessAddress] = useState(
    settings.business_address || settings.company_address || ''
  );
  const [taxId, setTaxId] = useState(settings.tax_identifier || settings.tax_id || '');
  const [currencySymbol, setCurrencySymbol] = useState(
    settings.currency_symbol || defaultCurrency?.symbol || '₹'
  );
  const [currencyCode, setCurrencyCode] = useState(
    settings.currency_code || settings.default_currency_code || 'INR'
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.low_stock_threshold ?? 10);
  const [defaultTaxRate, setDefaultTaxRate] = useState(settings.default_tax_rate ?? 18);
  const [allowNegativeStock, setAllowNegativeStock] = useState(
    settings.allow_negative_stock ?? false
  );
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoice_prefix || 'INV-');

  // Brand Logo State for Header Customization
  const [brandLogo, setBrandLogo] = useState(settings.brand_logo || '');
  const [logoModeTab, setLogoModeTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [logoUploadError, setLogoUploadError] = useState('');
  const [logoSuccessMessage, setLogoSuccessMessage] = useState('');

  // Security Credentials State
  // 1. Username
  const [authUsername, setAuthUsername] = useState(securityCredentials.username || 'admin');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [usernameError, setUsernameError] = useState('');

  // 2. Change Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pwdVerificationMethod, setPwdVerificationMethod] = useState<'current_password' | 'security_question'>('current_password');
  const [pwdCurrentPasswordInput, setPwdCurrentPasswordInput] = useState('');
  const [showPwdCurrentPassword, setShowPwdCurrentPassword] = useState(false);
  const [pwdSecurityAnswerInput, setPwdSecurityAnswerInput] = useState('');
  const [showPwdSecurityAnswer, setShowPwdSecurityAnswer] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 3. Change Security Question
  const [newQuestionSelect, setNewQuestionSelect] = useState(COMMON_SECURITY_QUESTIONS[0]);
  const [customQuestionText, setCustomQuestionText] = useState('');
  const [isCustomNewQuestion, setIsCustomNewQuestion] = useState(false);
  const [newAnswerInput, setNewAnswerInput] = useState('');
  const [showNewAnswerInput, setShowNewAnswerInput] = useState(false);
  const [questionVerificationMethod, setQuestionVerificationMethod] = useState<'current_password' | 'previous_question'>('current_password');
  const [questionVerifyPasswordInput, setQuestionVerifyPasswordInput] = useState('');
  const [showQuestionVerifyPassword, setShowQuestionVerifyPassword] = useState(false);
  const [previousAnswerInput, setPreviousAnswerInput] = useState('');
  const [showPreviousAnswerInput, setShowPreviousAnswerInput] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [isUpdatingQuestion, setIsUpdatingQuestion] = useState(false);

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setBrandName(settings.brand_name || '');
    setBrandLogo(settings.brand_logo || '');
    setBusinessEmail(settings.business_email || settings.company_email || '');
    setBusinessPhone(settings.business_phone || settings.company_phone || '');
    setBusinessAddress(settings.business_address || settings.company_address || '');
    setTaxId(settings.tax_identifier || settings.tax_id || '');
    setCurrencySymbol(settings.currency_symbol || defaultCurrency?.symbol || '₹');
    setCurrencyCode(settings.currency_code || settings.default_currency_code || 'INR');
    setLowStockThreshold(settings.low_stock_threshold ?? 10);
    setDefaultTaxRate(settings.default_tax_rate ?? 18);
    setAllowNegativeStock(settings.allow_negative_stock ?? false);
    setInvoicePrefix(settings.invoice_prefix || 'INV-');
  }, [settings, defaultCurrency]);

  const handleApplyLogo = (newLogoUrl: string) => {
    setBrandLogo(newLogoUrl);
    updateSettings({ brand_logo: newLogoUrl });
    setLogoSuccessMessage('Header logo updated successfully! Changes reflect across the top header.');
    setTimeout(() => setLogoSuccessMessage(''), 3500);
  };

  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogoUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Please select a valid image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoUploadError('Image size exceeds 2MB limit. Please upload an image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        handleApplyLogo(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    setLogoUploadError('');
    if (!customUrlInput.trim()) {
      setLogoUploadError('Please enter a valid image URL.');
      return;
    }
    handleApplyLogo(customUrlInput.trim());
  };

  const handleResetToDefaultLogo = () => {
    setCustomUrlInput('');
    setLogoUploadError('');
    handleApplyLogo('');
  };

  useEffect(() => {
    setAuthUsername(securityCredentials.username || 'admin');
  }, [securityCredentials]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      brand_name: brandName.trim(),
      company_name: brandName.trim(),
      brand_logo: brandLogo,
      company_email: businessEmail.trim(),
      business_email: businessEmail.trim(),
      company_phone: businessPhone.trim(),
      business_phone: businessPhone.trim(),
      company_address: businessAddress.trim(),
      business_address: businessAddress.trim(),
      tax_id: taxId.trim(),
      tax_identifier: taxId.trim(),
      currency_symbol: currencySymbol.trim(),
      currency_code: currencyCode.trim(),
      default_currency_code: currencyCode.trim(),
      low_stock_threshold: Number(lowStockThreshold),
      default_tax_rate: Number(defaultTaxRate),
      allow_negative_stock: allowNegativeStock,
      invoice_prefix: invoicePrefix.trim(),
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError('');
    setUsernameSuccess('');
    if (!authUsername.trim()) {
      setUsernameError('Username cannot be empty.');
      return;
    }
    await updateSecurityCredentials({ username: authUsername.trim() });
    setUsernameSuccess('Login username updated successfully.');
    setTimeout(() => setUsernameSuccess(''), 3000);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (!newPassword || newPassword.length < 4) {
      setPwdError('New password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError('New passwords do not match. Please verify both fields.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (pwdVerificationMethod === 'current_password') {
        if (!pwdCurrentPasswordInput.trim()) {
          setPwdError('Please enter your current password to authorize changing your password.');
          setIsUpdatingPassword(false);
          return;
        }
        const isValid = await verifyCurrentPassword(pwdCurrentPasswordInput);
        if (!isValid) {
          setPwdError('Verification failed: Incorrect current password. Please enter your valid current password or switch to answering your security question.');
          setIsUpdatingPassword(false);
          return;
        }
      } else {
        if (!pwdSecurityAnswerInput.trim()) {
          setPwdError('Please answer your security question to authorize changing your password.');
          setIsUpdatingPassword(false);
          return;
        }
        const isValid = await verifySecurityAnswer(pwdSecurityAnswerInput);
        if (!isValid) {
          setPwdError(`Verification failed: Incorrect answer to your security question ("${securityCredentials.securityQuestion}"). Please enter your correct answer or switch to entering your current password.`);
          setIsUpdatingPassword(false);
          return;
        }
      }

      await updateSecurityCredentials({ password: newPassword });
      setPwdSuccess('Password changed successfully with cryptographic encryption!');
      setNewPassword('');
      setConfirmNewPassword('');
      setPwdCurrentPasswordInput('');
      setPwdSecurityAnswerInput('');
      setTimeout(() => setPwdSuccess(''), 4000);
    } catch {
      setPwdError('An error occurred while updating password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateSecurityQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuestionError('');
    setQuestionSuccess('');

    const targetQuestion = isCustomNewQuestion ? customQuestionText.trim() : newQuestionSelect.trim();
    if (!targetQuestion) {
      setQuestionError('Please specify a valid security question.');
      return;
    }
    if (!newAnswerInput.trim()) {
      setQuestionError('Please provide an answer for your new security question.');
      return;
    }

    setIsUpdatingQuestion(true);
    try {
      if (questionVerificationMethod === 'current_password') {
        if (!questionVerifyPasswordInput.trim()) {
          setQuestionError('Please enter your current password to authorize changing your security question.');
          setIsUpdatingQuestion(false);
          return;
        }
        const isValid = await verifyCurrentPassword(questionVerifyPasswordInput);
        if (!isValid) {
          setQuestionError('Verification failed: Incorrect current password. Please enter your valid current password or answer your previous security question.');
          setIsUpdatingQuestion(false);
          return;
        }
      } else {
        if (!previousAnswerInput.trim()) {
          setQuestionError('Please answer your previous security question to authorize this change.');
          setIsUpdatingQuestion(false);
          return;
        }
        const isValid = await verifySecurityAnswer(previousAnswerInput);
        if (!isValid) {
          setQuestionError(`Verification failed: Incorrect answer to your previous security question ("${securityCredentials.securityQuestion}"). Please enter your correct answer or switch to entering your current password.`);
          setIsUpdatingQuestion(false);
          return;
        }
      }

      await updateSecurityCredentials({
        securityQuestion: targetQuestion,
        securityAnswer: newAnswerInput.trim(),
      });
      setQuestionSuccess('Security question and recovery answer updated successfully!');
      setNewAnswerInput('');
      setCustomQuestionText('');
      setQuestionVerifyPasswordInput('');
      setPreviousAnswerInput('');
      setTimeout(() => setQuestionSuccess(''), 4000);
    } catch {
      setQuestionError('An error occurred while updating the security question. Please try again.');
    } finally {
      setIsUpdatingQuestion(false);
    }
  };

  const roleDescriptions: Record<UserRole, string> = {
    admin: 'Full unrestricted super-administrator privileges across all modules, settings & RBAC.',
    manager: 'Can manage orders, inventory, catalog, customer records, and generate financial reports.',
    sales: 'Can create orders, register customers, process quotes, and generate invoices.',
    inventory: 'Can adjust warehouse stock, verify shipments, and manage SKU catalog.',
    purchase: 'Can create vendor purchase orders and receive incoming shipments.',
    viewer: 'Read-only access across inventory dashboards and order records.',
  };

  return (
    <div id="settings-page-container" className="space-y-6 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          System &amp; Business Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Manage system theme, login security &amp; credentials, tax details, currency, and role permissions
        </p>
      </div>

      {/* Global Success Notification */}
      {saveSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Business parameters updated successfully. Invoices and computation rules have been refreshed.
        </div>
      )}

      {/* ================= 1. THEME & APPEARANCE (SETTINGS ONLY) ================= */}
      <div
        id="section-theme-settings"
        className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
      >
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Appearance &amp; Display Theme
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Switch the application interface between Light mode and Dark mode
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light Mode Option */}
          <button
            type="button"
            id="theme-btn-light"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 text-center transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-600 ring-2 ring-blue-600/20 text-blue-900 dark:text-blue-100 font-bold shadow-xs'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold">Light Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Clean, crisp daylight palette</div>
            </div>
            {theme === 'light' && (
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            )}
          </button>

          {/* Dark Mode Option */}
          <button
            type="button"
            id="theme-btn-dark"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 text-center transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-600 ring-2 ring-blue-600/20 text-blue-900 dark:text-blue-100 font-bold shadow-xs'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-slate-800 text-indigo-300 dark:bg-indigo-950 dark:text-indigo-400">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold">Dark Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">High-contrast, easy on eyes</div>
            </div>
            {theme === 'dark' && (
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            )}
          </button>

          {/* System Default Option */}
          <button
            type="button"
            id="theme-btn-system"
            onClick={() => setTheme('system')}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2.5 text-center transition-all cursor-pointer ${
              theme === 'system'
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-600 ring-2 ring-blue-600/20 text-blue-900 dark:text-blue-100 font-bold shadow-xs'
                : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="p-2.5 rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold">System Default</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Syncs with OS preference</div>
            </div>
            {theme === 'system' && (
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= 2. HEADER & BRAND LOGO CUSTOMIZATION ================= */}
      <div
        id="section-header-logo"
        className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-emerald-600" />
              Header &amp; Brand Logo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Change the logo displayed in the top application header anytime
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetToDefaultLogo}
            className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Reset back to the original luxury Reyra emerald & gold emblem"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            Reset to Default Logo
          </button>
        </div>

        {logoSuccessMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{logoSuccessMessage}</span>
          </div>
        )}

        {logoUploadError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{logoUploadError}</span>
          </div>
        )}

        {/* Live Header Logo Preview Display */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 shadow-xs flex items-center justify-center">
              <ReyraLogo size="lg" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Active Header Logo</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                  !brandLogo || brandLogo === '/assets/reyra_logo.jpg'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                }`}>
                  {!brandLogo || brandLogo === '/assets/reyra_logo.jpg' ? 'Default Reyra Emblem' : 'Custom Brand Logo'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Displays in the top navigation bar at the top-left of every screen.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs">
              <span className="text-[11px] text-slate-400">Header Preview:</span>
              <ReyraLogo size="sm" />
              <span className="font-bold text-slate-800 dark:text-slate-200">{brandName || 'REYRA'}</span>
            </div>
          </div>
        </div>

        {/* Selection Modes: File Upload / URL / Presets */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl text-xs font-semibold max-w-md">
            <button
              type="button"
              onClick={() => setLogoModeTab('upload')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                logoModeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => setLogoModeTab('url')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                logoModeTab === 'url'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Image URL
            </button>
            <button
              type="button"
              onClick={() => setLogoModeTab('presets')}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                logoModeTab === 'presets'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Curated Presets
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {logoModeTab === 'upload' && (
            <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center gap-2.5">
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Select a new logo from your device
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Supports PNG, JPG, SVG, or WEBP (Max 2MB). Automatically adapts across the top header.
                </div>
              </div>
              <label className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer transition-colors inline-flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                Browse Image File
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  className="hidden"
                  onChange={handleLogoFileUpload}
                />
              </label>
            </div>
          )}

          {/* Mode 2: Custom URL */}
          {logoModeTab === 'url' && (
            <form onSubmit={handleApplyCustomUrl} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Logo Image Web URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={e => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    Apply URL
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter any direct image link or hosted asset URL.
                </p>
              </div>
            </form>
          )}

          {/* Mode 3: Curated Presets */}
          {logoModeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LOGO_PRESETS.map(preset => {
                const isSelected =
                  (!brandLogo && preset.id === 'default-luxury') ||
                  brandLogo === preset.url ||
                  (preset.url === '' && brandLogo === '/assets/reyra_logo.jpg');
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyLogo(preset.url)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/20 font-semibold shadow-xs'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center p-0.5">
                      <img
                        src={preset.preview}
                        alt={preset.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {preset.description}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= 3. SECURITY & LOGIN CREDENTIALS (PASSWORD & SECURITY QUESTION) ================= */}
      <div
        id="section-security-credentials"
        className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-600" />
              Login Credentials &amp; Security Controls
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Securely update your username, change password, or configure recovery security questions
            </p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="self-start sm:self-auto px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-rose-200 dark:border-rose-900/60 cursor-pointer"
            title="Lock workspace and test login credentials"
          >
            <LogOut className="w-3.5 h-3.5" /> Lock &amp; Test Login
          </button>
        </div>

        {/* --- Sub-Card 1: Login Username / ID --- */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Login Username / ID
            </h3>
          </div>

          {usernameSuccess && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{usernameSuccess}</span>
            </div>
          )}

          {usernameError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{usernameError}</span>
            </div>
          )}

          <form onSubmit={handleSaveUsername} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={authUsername}
                onChange={e => setAuthUsername(e.target.value)}
                placeholder="Enter login username"
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Save className="w-3.5 h-3.5" /> Save Username
            </button>
          </form>
        </div>

        {/* --- Sub-Card 2: Change Password --- */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Change Account Password
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Requires either current password OR answering your security question
            </span>
          </div>

          {pwdSuccess && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{pwdSuccess}</span>
            </div>
          )}

          {pwdError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{pwdError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 4 chars)"
                    className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmNewPassword}
                    onChange={e => setConfirmNewPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Method Box */}
            <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Authorization Verification (Choose 1 method):
                </span>
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setPwdVerificationMethod('current_password');
                      setPwdError('');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      pwdVerificationMethod === 'current_password'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Current Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPwdVerificationMethod('security_question');
                      setPwdError('');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      pwdVerificationMethod === 'security_question'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Security Question
                  </button>
                </div>
              </div>

              {pwdVerificationMethod === 'current_password' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Current Password to Authorize:
                  </label>
                  <div className="relative">
                    <input
                      type={showPwdCurrentPassword ? 'text' : 'password'}
                      required
                      value={pwdCurrentPasswordInput}
                      onChange={e => setPwdCurrentPasswordInput(e.target.value)}
                      placeholder="Your current account password"
                      className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwdCurrentPassword(!showPwdCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPwdCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">Security Question:</span>{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      &ldquo;{securityCredentials.securityQuestion || 'What is your all time GoTo place?'}&rdquo;
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPwdSecurityAnswer ? 'text' : 'password'}
                      required
                      value={pwdSecurityAnswerInput}
                      onChange={e => setPwdSecurityAnswerInput(e.target.value)}
                      placeholder="Type the answer to your security question"
                      className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwdSecurityAnswer(!showPwdSecurityAnswer)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPwdSecurityAnswer ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                {isUpdatingPassword ? 'Verifying & Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* --- Sub-Card 3: Change Security Question & Answer --- */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Change Security Question &amp; Answer
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Requires either current password OR answering your previous security question
            </span>
          </div>

          <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/60 rounded-xl text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span className="font-semibold text-indigo-700 dark:text-indigo-400 shrink-0">Current Question:</span>
            <span className="font-bold text-slate-900 dark:text-white truncate">
              &ldquo;{securityCredentials.securityQuestion || 'What is your all time GoTo place?'}&rdquo;
            </span>
          </div>

          {questionSuccess && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{questionSuccess}</span>
            </div>
          )}

          {questionError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{questionError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateSecurityQuestion} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  New Security Question
                </label>
                <select
                  value={isCustomNewQuestion ? 'CUSTOM' : newQuestionSelect}
                  onChange={e => {
                    if (e.target.value === 'CUSTOM') {
                      setIsCustomNewQuestion(true);
                      setCustomQuestionText('');
                    } else {
                      setIsCustomNewQuestion(false);
                      setNewQuestionSelect(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  {COMMON_SECURITY_QUESTIONS.map(q => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                  <option value="CUSTOM">Custom Question...</option>
                </select>

                {isCustomNewQuestion && (
                  <input
                    type="text"
                    required
                    value={customQuestionText}
                    onChange={e => setCustomQuestionText(e.target.value)}
                    placeholder="Type your custom security question"
                    className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  New Security Answer
                </label>
                <div className="relative">
                  <input
                    type={showNewAnswerInput ? 'text' : 'password'}
                    required
                    value={newAnswerInput}
                    onChange={e => setNewAnswerInput(e.target.value)}
                    placeholder="Type the answer for your new question"
                    className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewAnswerInput(!showNewAnswerInput)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewAnswerInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Method Box */}
            <div className="p-3.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Authorization Verification (Choose 1 method):
                </span>
                <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionVerificationMethod('current_password');
                      setQuestionError('');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      questionVerificationMethod === 'current_password'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Current Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionVerificationMethod('previous_question');
                      setQuestionError('');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                      questionVerificationMethod === 'previous_question'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    Previous Security Question
                  </button>
                </div>
              </div>

              {questionVerificationMethod === 'current_password' ? (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Enter Current Password to Authorize:
                  </label>
                  <div className="relative">
                    <input
                      type={showQuestionVerifyPassword ? 'text' : 'password'}
                      required
                      value={questionVerifyPasswordInput}
                      onChange={e => setQuestionVerifyPasswordInput(e.target.value)}
                      placeholder="Your current account password"
                      className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowQuestionVerifyPassword(!showQuestionVerifyPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showQuestionVerifyPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-indigo-700 dark:text-indigo-400">Previous Question:</span>{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      &ldquo;{securityCredentials.securityQuestion || 'What is your all time GoTo place?'}&rdquo;
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPreviousAnswerInput ? 'text' : 'password'}
                      required
                      value={previousAnswerInput}
                      onChange={e => setPreviousAnswerInput(e.target.value)}
                      placeholder="Type the answer to your previous security question"
                      className="w-full pl-3 pr-10 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPreviousAnswerInput(!showPreviousAnswerInput)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPreviousAnswerInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingQuestion}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {isUpdatingQuestion ? 'Verifying & Updating...' : 'Update Security Question'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Role Switcher Sandbox (RBAC) */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" /> Active User Role Simulation (RBAC)
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            Current: {currentUser?.role}
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Switch user roles to simulate security policies and verify permission gates:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {(['admin', 'manager', 'sales', 'inventory', 'purchase', 'viewer'] as UserRole[]).map(r => (
            <button
              key={r}
              type="button"
              onClick={() => switchRole(r)}
              className={`p-2.5 rounded-xl border text-center font-semibold text-xs capitalize transition-all cursor-pointer ${
                currentUser?.role === r
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {currentUser?.role && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <strong>Role Permissions:</strong> {roleDescriptions[currentUser.role]}
          </p>
        )}
      </div>

      {/* Settings Form for Business Profile */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Identity */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" /> Business Profile &amp; Letterhead
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Company / Brand Legal Name
              </label>
              <input
                type="text"
                required
                value={brandName}
                onChange={e => setBrandName(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                GSTIN / Tax Registration ID
              </label>
              <input
                type="text"
                value={taxId}
                onChange={e => setTaxId(e.target.value)}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Business Support Email
              </label>
              <input
                type="email"
                required
                value={businessEmail}
                onChange={e => setBusinessEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Official Contact Phone
              </label>
              <input
                type="text"
                required
                value={businessPhone}
                onChange={e => setBusinessPhone(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Full Registered Address (printed on A4 invoices)
              </label>
              <input
                type="text"
                required
                value={businessAddress}
                onChange={e => setBusinessAddress(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Currency & Inventory Rules */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" /> Currency &amp; Inventory Parameters
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Currency Symbol
              </label>
              <input
                type="text"
                required
                value={currencySymbol}
                onChange={e => setCurrencySymbol(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Currency Code (ISO 4217)
              </label>
              <input
                type="text"
                required
                value={currencyCode}
                onChange={e => setCurrencyCode(e.target.value.toUpperCase())}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Default Sales Tax / GST Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={defaultTaxRate}
                onChange={e => setDefaultTaxRate(parseFloat(e.target.value) || 0)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Low Stock Threshold (Alert Units)
              </label>
              <input
                type="number"
                min="1"
                value={lowStockThreshold}
                onChange={e => setLowStockThreshold(parseInt(e.target.value) || 1)}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Invoice Number Prefix
              </label>
              <input
                type="text"
                value={invoicePrefix}
                onChange={e => setInvoicePrefix(e.target.value.toUpperCase())}
                className="mt-1 w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono uppercase"
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={allowNegativeStock}
                  onChange={e => setAllowNegativeStock(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Allow Negative Stock Units
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Business Parameters */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" /> Save Business Parameters
          </button>
        </div>
      </form>

      {/* ================= 6. DATABASE BACKUP & RESTORE CENTER (PORTABILITY & RECOVERY) ================= */}
      <div id="section-backup-restore" className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600" /> Database Backup &amp; Data Portability Center
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manually backup, inspect, restore, or safely roll back your operational database
          </p>
        </div>

        <BackupRestoreCenter />
      </div>
    </div>
  );
};
