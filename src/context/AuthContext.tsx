import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Role } from '../types';
import {
  hashSecret,
  verifySecret,
  checkRateLimit,
  recordFailedAttempt,
  clearRateLimit,
  generateSecureSessionToken,
  sanitizeInput,
} from '../services/security';

export interface AppSecurityCredentials {
  username: string;
  password?: string;
  passwordHash?: string;
  securityQuestion: string;
  securityAnswer?: string;
  securityAnswerHash?: string;
  autoLockMinutes?: number;
  twoFactorEnabled?: boolean;
}

export const DEFAULT_SECURITY_CREDENTIALS: AppSecurityCredentials = {
  username: 'admin',
  password: 'admin123',
  passwordHash: '',
  securityQuestion: 'What is your all time GoTo place?',
  securityAnswer: 'Paris',
  securityAnswerHash: '',
  autoLockMinutes: 30,
  twoFactorEnabled: false,
};

interface StoredSession {
  profile: UserProfile;
  token: string;
  lastActive: number;
}

interface AuthContextType {
  user: UserProfile | null;
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLockedDueToInactivity: boolean;
  securityCredentials: AppSecurityCredentials;
  login: (usernameOrEmail: string, password: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  unlockSession: (password: string) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: Role) => void;
  hasRole: (roles: Role[]) => boolean;
  updateSecurityCredentials: (creds: Partial<AppSecurityCredentials>) => Promise<void>;
  verifyCurrentPassword: (password: string) => Promise<boolean>;
  verifySecurityAnswer: (answer: string) => Promise<boolean>;
  resetPassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Built-in seed accounts for instant verification and role testing
const DEMO_USERS: Record<string, { profile: UserProfile; passwordHash: string }> = {
  'admin@company.com': {
    profile: {
      id: 'usr-admin-1',
      email: 'admin@company.com',
      name: 'Sarah Jenkins',
      role: 'admin',
      created_at: '2026-01-01T00:00:00.000Z',
    },
    passwordHash: 'admin123',
  },
  'manager@company.com': {
    profile: {
      id: 'usr-mgr-1',
      email: 'manager@company.com',
      name: 'David Miller',
      role: 'manager',
      created_at: '2026-01-05T00:00:00.000Z',
    },
    passwordHash: 'manager123',
  },
  'sales@company.com': {
    profile: {
      id: 'usr-sales-1',
      email: 'sales@company.com',
      name: 'Rohan Gupta',
      role: 'sales',
      created_at: '2026-02-10T00:00:00.000Z',
    },
    passwordHash: 'sales123',
  },
  'inventory@company.com': {
    profile: {
      id: 'usr-inv-1',
      email: 'inventory@company.com',
      name: 'Vikram Sethi',
      role: 'inventory',
      created_at: '2026-02-15T00:00:00.000Z',
    },
    passwordHash: 'inventory123',
  },
  'purchase@company.com': {
    profile: {
      id: 'usr-pur-1',
      email: 'purchase@company.com',
      name: 'Meera Nair',
      role: 'purchase',
      created_at: '2026-03-01T00:00:00.000Z',
    },
    passwordHash: 'purchase123',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLockedDueToInactivity, setIsLockedDueToInactivity] = useState<boolean>(false);
  const lastActiveRef = useRef<number>(Date.now());

  // Security Credentials state with persistent localStorage
  const [securityCredentials, setSecurityCredentials] = useState<AppSecurityCredentials>(() => {
    try {
      const saved = localStorage.getItem('erp_security_creds');
      if (saved) {
        return { ...DEFAULT_SECURITY_CREDENTIALS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SECURITY_CREDENTIALS;
  });

  // Check saved session in localStorage or sessionStorage on boot
  useEffect(() => {
    const rawSession = localStorage.getItem('erp_auth_user') || sessionStorage.getItem('erp_auth_user');
    if (rawSession) {
      try {
        const parsed = JSON.parse(rawSession);
        // Handle both legacy UserProfile format and new StoredSession format
        if (parsed.profile) {
          const session = parsed as StoredSession;
          // Check session age (e.g. 7 days for remember-me)
          const now = Date.now();
          if (now - session.lastActive > 7 * 86400 * 1000) {
            localStorage.removeItem('erp_auth_user');
            sessionStorage.removeItem('erp_auth_user');
          } else {
            setUser(session.profile);
            lastActiveRef.current = now;
          }
        } else if (parsed.id) {
          setUser(parsed as UserProfile);
          lastActiveRef.current = Date.now();
        }
      } catch {
        localStorage.removeItem('erp_auth_user');
        sessionStorage.removeItem('erp_auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  // Inactivity auto-lock monitor (configurable or default 30 minutes)
  const autoLockMinutes = securityCredentials.autoLockMinutes || 30;
  const autoLockMs = autoLockMinutes * 60 * 1000;

  const handleUserActivity = useCallback(() => {
    lastActiveRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    const throttledListener = () => {
      const now = Date.now();
      if (now - lastActiveRef.current > 5000) {
        lastActiveRef.current = now;
      }
    };

    events.forEach(evt => window.addEventListener(evt, throttledListener, { passive: true }));

    // Periodic inactivity check every 30 seconds
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActiveRef.current >= autoLockMs) {
        setIsLockedDueToInactivity(true);
        setUser(null);
      }
    }, 30000);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, throttledListener));
      clearInterval(interval);
    };
  }, [user, autoLockMs]);

  const updateSecurityCredentials = async (creds: Partial<AppSecurityCredentials>) => {
    const next: AppSecurityCredentials = { ...securityCredentials, ...creds };
    
    if (creds.password) {
      next.passwordHash = await hashSecret(creds.password);
      next.password = creds.password;
    }
    if (creds.securityAnswer) {
      next.securityAnswerHash = await hashSecret(creds.securityAnswer.trim().toLowerCase());
      next.securityAnswer = creds.securityAnswer;
    }

    setSecurityCredentials(next);
    localStorage.setItem('erp_security_creds', JSON.stringify(next));
  };

  const verifySecurityAnswer = async (answer: string): Promise<boolean> => {
    const rate = checkRateLimit('sec_answer', 5, 45);
    if (!rate.allowed) {
      return false;
    }

    const clean = answer.trim().toLowerCase();
    if (!clean) return false;

    let isMatch = false;
    if (securityCredentials.securityAnswerHash) {
      isMatch = await verifySecret(clean, securityCredentials.securityAnswerHash);
    } else if (securityCredentials.securityAnswer) {
      isMatch = clean === securityCredentials.securityAnswer.trim().toLowerCase();
    }

    if (!isMatch) {
      recordFailedAttempt('sec_answer', 5, 45);
      return false;
    }

    clearRateLimit('sec_answer');
    return true;
  };

  const verifyCurrentPassword = async (password: string): Promise<boolean> => {
    if (!password || !password.trim()) return false;
    const clean = password.trim();
    const stored = securityCredentials.passwordHash || securityCredentials.password || 'admin123';
    const isPrimary = await verifySecret(clean, stored);
    if (isPrimary) return true;

    if (user?.email && DEMO_USERS[user.email.toLowerCase()]) {
      const demoAccount = DEMO_USERS[user.email.toLowerCase()];
      return await verifySecret(clean, demoAccount.passwordHash);
    }
    return false;
  };

  const resetPassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!newPassword || newPassword.trim().length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }
    await updateSecurityCredentials({ password: newPassword });
    return { success: true };
  };

  const login = async (
    usernameOrEmail: string,
    password: string,
    remember: boolean
  ): Promise<{ success: boolean; error?: string }> => {
    // 1. Anti-Brute-Force Rate Limiting
    const rate = checkRateLimit('login', 5, 30);
    if (!rate.allowed) {
      return {
        success: false,
        error: `Security Lockout: Too many failed login attempts. Please retry in ${rate.retryAfterSeconds} seconds.`,
      };
    }

    // Brief realistic verification delay to thwart timing attacks
    await new Promise(r => setTimeout(r, 250));

    const cleanInput = sanitizeInput(usernameOrEmail).toLowerCase();
    const configuredUsername = securityCredentials.username.trim().toLowerCase();

    // 2. Check against configured securityCredentials
    const isUsernameMatch =
      cleanInput === configuredUsername ||
      cleanInput === `${configuredUsername}@company.com` ||
      cleanInput === `${configuredUsername}@reyra.com` ||
      (configuredUsername === 'admin' && (cleanInput === 'admin' || cleanInput === 'admin@company.com'));

    if (isUsernameMatch) {
      const stored = securityCredentials.passwordHash || securityCredentials.password || 'admin123';
      const isValid = await verifySecret(password, stored);

      if (!isValid) {
        const attempt = recordFailedAttempt('login', 5, 30);
        const errorMsg = attempt.locked
          ? `System locked for 30 seconds due to 5 consecutive failed attempts.`
          : 'Incorrect password. Please verify credentials.';
        return { success: false, error: errorMsg };
      }

      clearRateLimit('login');
      setIsLockedDueToInactivity(false);

      const token = generateSecureSessionToken();
      const activeProfile: UserProfile = {
        id: 'usr-admin-configured',
        email: cleanInput.includes('@') ? cleanInput : `${configuredUsername}@reyra.com`,
        name: securityCredentials.username.toUpperCase(),
        role: 'admin',
        created_at: new Date().toISOString(),
      };

      setUser(activeProfile);
      const sessionData: StoredSession = { profile: activeProfile, token, lastActive: Date.now() };

      if (remember) {
        localStorage.setItem('erp_auth_user', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('erp_auth_user', JSON.stringify(sessionData));
      }
      return { success: true };
    }

    // 3. Check built-in demo accounts (e.g. sales@company.com, manager@company.com)
    const demoAccount = DEMO_USERS[cleanInput];
    if (demoAccount) {
      const isValid = await verifySecret(password, demoAccount.passwordHash);
      if (!isValid) {
        recordFailedAttempt('login', 5, 30);
        return { success: false, error: 'Incorrect password. Please verify credentials.' };
      }

      clearRateLimit('login');
      setIsLockedDueToInactivity(false);

      const token = generateSecureSessionToken();
      setUser(demoAccount.profile);
      const sessionData: StoredSession = { profile: demoAccount.profile, token, lastActive: Date.now() };

      if (remember) {
        localStorage.setItem('erp_auth_user', JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem('erp_auth_user', JSON.stringify(sessionData));
      }
      return { success: true };
    }

    // Record failed attempt for unrecognized user
    recordFailedAttempt('login', 5, 30);
    return {
      success: false,
      error: `Invalid credentials. Username "${usernameOrEmail}" not recognized.`,
    };
  };

  const unlockSession = async (password: string): Promise<{ success: boolean; error?: string }> => {
    const stored = securityCredentials.passwordHash || securityCredentials.password || 'admin123';
    const isValid = await verifySecret(password, stored);
    if (isValid) {
      setIsLockedDueToInactivity(false);
      lastActiveRef.current = Date.now();
      return { success: true };
    }
    return { success: false, error: 'Invalid password. Session remains locked.' };
  };

  const logout = () => {
    setUser(null);
    setIsLockedDueToInactivity(false);
    localStorage.removeItem('erp_auth_user');
    sessionStorage.removeItem('erp_auth_user');
  };

  const switchRole = (newRole: Role) => {
    if (!user) return;
    const updated = { ...user, role: newRole };
    setUser(updated);
    const token = generateSecureSessionToken();
    const sessionData: StoredSession = { profile: updated, token, lastActive: Date.now() };
    if (localStorage.getItem('erp_auth_user')) {
      localStorage.setItem('erp_auth_user', JSON.stringify(sessionData));
    } else {
      sessionStorage.setItem('erp_auth_user', JSON.stringify(sessionData));
    }
  };

  const hasRole = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Super admin has all permissions
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        isAuthenticated: Boolean(user),
        isLoading,
        isLockedDueToInactivity,
        securityCredentials,
        login,
        logout,
        unlockSession,
        switchRole,
        hasRole,
        updateSecurityCredentials,
        verifyCurrentPassword,
        verifySecurityAnswer,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
