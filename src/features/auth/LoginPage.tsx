import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { ReyraLogo } from '../../components/brand/ReyraLogo';

type AuthViewMode = 'login' | 'forgot_password';

export const LoginPage: React.FC = () => {
  const { login, securityCredentials, verifySecurityAnswer, resetPassword, isLockedDueToInactivity } = useAuth();
  const { settings } = useSettings();

  const [viewMode, setViewMode] = useState<AuthViewMode>('login');

  // Login form state
  const [username, setUsername] = useState(securityCredentials.username || 'admin');
  const [password, setPassword] = useState(securityCredentials.password || 'admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot password form state
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('Please provide both your username and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(username, password, rememberMe);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');

    if (!securityAnswer.trim()) {
      setForgotError('Please enter your answer to the security question.');
      return;
    }

    setIsLoading(true);
    // Verify security answer with rate-limiting and hashing
    const isAnswerCorrect = await verifySecurityAnswer(securityAnswer);
    if (!isAnswerCorrect) {
      setIsLoading(false);
      setForgotError('Incorrect answer or too many attempts. Please verify and retry.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setIsLoading(false);
      setForgotError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setIsLoading(false);
      setForgotError('Passwords do not match. Please verify.');
      return;
    }

    // Perform password reset
    const res = await resetPassword(newPassword);
    setIsLoading(false);
    if (res.success) {
      setPassword(newPassword);
      setSecurityAnswer('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Password successfully reset! You can now sign in with your new password.');
      setViewMode('login');
    } else {
      setForgotError(res.error || 'Unable to reset password.');
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div
      id="login-dialogue-screen"
      className="min-h-screen w-full bg-slate-100/80 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 transition-colors relative select-none"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-500/10 dark:bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Dialogue Box */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden transition-all duration-200">
        {/* Top Header Badge */}
        <div className="pt-8 pb-4 px-6 sm:px-8 text-center border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex justify-center mb-3">
            <ReyraLogo size="lg" className="shadow-xs" />
          </div>
          <h1 className="text-2xl tracking-normal text-slate-900 dark:text-white">
            {(() => {
              const rawName = settings.brand_name || 'Reyra Inventory';
              const match = rawName.match(/^(reyra)\s*(.*)$/i);
              if (match) {
                return (
                  <span className="inline-flex items-baseline gap-1.5 justify-center leading-none">
                    <span
                      className="font-serif font-medium text-2xl tracking-normal text-slate-900 dark:text-white"
                      style={{ fontFamily: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif" }}
                    >
                      {match[1]}
                    </span>
                    {match[2] && (
                      <span className="font-sans font-normal text-lg tracking-normal text-slate-600 dark:text-slate-400">
                        {match[2]}
                      </span>
                    )}
                  </span>
                );
              }
              return (
                <span
                  className="font-serif font-medium text-2xl tracking-normal text-slate-900 dark:text-white leading-none"
                  style={{ fontFamily: "'Playfair Display', Georgia, Cambria, 'Times New Roman', serif" }}
                >
                  {rawName}
                </span>
              );
            })()}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Inventory &amp; Business Management
          </p>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8">
          {viewMode === 'login' ? (
            /* ================= VIEW: SIGN IN ================= */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Sign In to System
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter your username and password to proceed
                </p>
              </div>

              {/* Status messages */}
              {isLockedDueToInactivity && !errorMessage && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Session locked due to inactivity for security. Please sign in to resume your session.</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Username / ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-username"
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Password Input with Forgot Password link */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('forgot_password');
                      setErrorMessage('');
                      setForgotError('');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline hover:text-blue-700 cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    Remember this session
                  </span>
                </label>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Protected
                </span>
              </div>

              {/* Sign In Button */}
              <button
                id="btn-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Sign In to System</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick default credential helper */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Default Admin Login:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleQuickFill(
                      securityCredentials.username || 'admin',
                      securityCredentials.password || 'admin123'
                    )
                  }
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-colors"
                >
                  Fill Default ({securityCredentials.username || 'admin'})
                </button>
              </div>
            </form>
          ) : (
            /* ================= VIEW: FORGOT PASSWORD / SECURITY QUESTION ================= */
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setForgotError('');
                  }}
                  className="p-1 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Back to Sign In"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    Reset Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verify identity using your registered security question
                  </p>
                </div>
              </div>

              {/* Error message */}
              {forgotError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{forgotError}</span>
                </div>
              )}

              {/* Security Question Card */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Security Question</span>
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  &ldquo;{securityCredentials.securityQuestion || 'What is your all time GoTo place?'}&rdquo;
                </div>
              </div>

              {/* Answer Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Your Answer
                </label>
                <input
                  id="input-security-answer"
                  type="text"
                  required
                  autoFocus
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  placeholder="Enter the answer you configured in settings"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="input-new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 4 characters"
                    className="block w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  id="input-confirm-password"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="block w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  id="btn-verify-reset-password"
                  type="submit"
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-xs transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify Answer &amp; Set New Password</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('login');
                    setForgotError('');
                  }}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel &amp; Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
