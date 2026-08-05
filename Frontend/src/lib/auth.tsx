import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useStore } from './store';
import { apiRequest } from './api';
import type { Role, User } from './types';

const IDLE_MS      = 30 * 60 * 1000;
const WARN_BEFORE  =  5 * 60 * 1000;

type LoginResult = { ok: true; user: User } | { ok: false; error: string };

interface AuthContextValue {
  user: User | null;
  initialising: boolean;
  otpPending: string | null;
  pendingSignup: { email: string; fullName: string; role: Role; phone: string; password: string } | null;
  sessionWarning: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  requestOtp: (email: string, fullName: string, role: Role, phone: string, password: string) => string;
  verifyOtp: (code: string) => Promise<LoginResult>;
  resendOtp: () => string;
  logout: () => void;
  clearOtp: () => void;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function genOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

type BackendUser = {
  id?: string; email?: string; fullName?: string;
  role?: Role; phone?: string; isActive?: boolean; createdAt?: string;
};

function toUser(u: BackendUser, fallbacks: Partial<User> = {}): User {
  return {
    id:        u.id        ?? fallbacks.id        ?? '',
    email:     u.email     ?? fallbacks.email     ?? '',
    fullName:  u.fullName  ?? fallbacks.fullName  ?? '',
    role:      u.role      ?? fallbacks.role      ?? 'parent',
    phone:     u.phone     ?? fallbacks.phone     ?? '',
    isActive:  u.isActive  ?? true,
    createdAt: u.createdAt ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  const [authUser,      setAuthUser]      = useState<User | null>(null);
  const [initialising,  setInitialising]  = useState(true);   // true while restoring session
  const [otpPending,    setOtpPending]    = useState<string | null>(null);
  const [pendingSignup, setPendingSignup] = useState<AuthContextValue['pendingSignup']>(null);
  const [currentOtp,    setCurrentOtp]    = useState('');
  const [sessionWarning, setSessionWarning] = useState(false);

  const warnTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expireTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (warnTimer.current)   clearTimeout(warnTimer.current);
    if (expireTimer.current) clearTimeout(expireTimer.current);
    warnTimer.current = expireTimer.current = null;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('haf_auth_token');
    setAuthUser(null);
    store.logout();
    setOtpPending(null);
    setPendingSignup(null);
    setCurrentOtp('');
    setSessionWarning(false);
    clearTimers();
  }, [store, clearTimers]);

  const resetIdleTimer = useCallback(() => {
    if (!authUser) return;
    clearTimers();
    setSessionWarning(false);
    warnTimer.current   = setTimeout(() => setSessionWarning(true), IDLE_MS - WARN_BEFORE);
    expireTimer.current = setTimeout(() => logout(), IDLE_MS);
  }, [authUser, clearTimers, logout]);

  const extendSession = useCallback(() => {
    setSessionWarning(false);
    resetIdleTimer();
  }, [resetIdleTimer]);

  // Idle activity listeners
  useEffect(() => {
    if (!authUser) return;
    const events: (keyof DocumentEventMap)[] = ['mousedown', 'keydown', 'scroll', 'touchstart', 'pointermove'];
    const handler = () => resetIdleTimer();
    events.forEach(e => document.addEventListener(e, handler, { passive: true }));
    resetIdleTimer();
    return () => {
      events.forEach(e => document.removeEventListener(e, handler));
      clearTimers();
    };
  }, [authUser, resetIdleTimer, clearTimers]);

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem('haf_auth_token');
    if (!token) { setInitialising(false); return; }

    (async () => {
      try {
        const result = await apiRequest<{ user?: BackendUser }>(
          '/api/auth/me', { method: 'GET' }, token,
        );
        if (result.ok && result.data?.user) {
          const user = toUser(result.data.user);
          setAuthUser(user);
          store.login(user.email, '');
        } else {
          localStorage.removeItem('haf_auth_token');
        }
      } catch {
        // Network error — keep token, user stays logged out until they retry
      } finally {
        setInitialising(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    if (!email || !password) return { ok: false, error: 'Email and password are required.' };
    try {
      const result = await apiRequest<{ token?: string; user?: BackendUser; message?: string }>(
        '/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) },
      );
      if (!result.ok) return { ok: false, error: result.data?.message ?? 'Invalid credentials or inactive account.' };

      const user = toUser(result.data?.user ?? {}, { email });
      localStorage.setItem('haf_auth_token', result.data?.token ?? '');
      setAuthUser(user);
      store.login(email, password);
      return { ok: true, user };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unable to reach the authentication service. Is the backend running?' };
    }
  }, [store]);

  const requestOtp = useCallback((email: string, fullName: string, role: Role, phone: string, password: string) => {
    const code = genOtp();
    setCurrentOtp(code);
    setOtpPending(email);
    setPendingSignup({ email, fullName, role, phone, password });
    return code;
  }, []);

  const verifyOtp = useCallback(async (code: string): Promise<LoginResult> => {
    if (!otpPending || !pendingSignup) return { ok: false, error: 'No pending verification.' };
    if (code !== currentOtp)          return { ok: false, error: 'Invalid OTP code. Please check and try again.' };
    try {
      const result = await apiRequest<{ token?: string; user?: BackendUser; message?: string }>(
        '/api/auth/signup', {
          method: 'POST',
          body: JSON.stringify({
            email:    pendingSignup.email,
            fullName: pendingSignup.fullName,
            role:     pendingSignup.role,
            phone:    pendingSignup.phone,
            password: pendingSignup.password,
          }),
        },
      );
      if (!result.ok) return { ok: false, error: result.data?.message ?? 'Signup failed.' };

      const user = toUser(result.data?.user ?? {}, pendingSignup);
      localStorage.setItem('haf_auth_token', result.data?.token ?? '');
      setAuthUser(user);
      store.signup(pendingSignup.email, pendingSignup.fullName, pendingSignup.role, pendingSignup.phone, pendingSignup.password);
      setOtpPending(null);
      setPendingSignup(null);
      setCurrentOtp('');
      return { ok: true, user };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : 'Unable to reach the authentication service.' };
    }
  }, [otpPending, pendingSignup, currentOtp, store]);

  const resendOtp = useCallback(() => {
    if (!otpPending) return '';
    const code = genOtp();
    setCurrentOtp(code);
    return code;
  }, [otpPending]);

  const clearOtp = useCallback(() => {
    setOtpPending(null);
    setPendingSignup(null);
    setCurrentOtp('');
  }, []);

  return (
    <AuthContext.Provider value={{
      user: authUser, initialising, otpPending, pendingSignup, sessionWarning,
      login, requestOtp, verifyOtp, resendOtp, logout, clearOtp, extendSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
