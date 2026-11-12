import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { hasApi, http, tokens } from '../api/http';

const AuthContext = createContext(null);
const KEY = 'rk_user';
const USERS_KEY = 'rk_users';
export const DEMO_CODE = '123456'; // demo mode only (no API): any email code is this

const read = (k, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? fallback;
  } catch {
    return fallback;
  }
};
const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));
let demoPending = null; // demo-mode sign-up waiting for its code

/**
 * With VITE_API_URL set → real Django auth (JWT, email OTP, Google).
 * Without it → local demo accounts (browser only) so the UI can be previewed.
 * Every sign-in function resolves to { user, created } — `created` is true for brand-new accounts
 * (the UI shows the welcome popup for those).
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (hasApi && !tokens.get() ? null : read(KEY, null)));

  const persist = (session) => {
    localStorage.setItem(KEY, JSON.stringify(session));
    setUser(session);
    return session;
  };

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    tokens.clear();
    setUser(null);
  }, []);

  // Keep the saved profile fresh (e.g. picks up a newly granted admin role). Fails quietly.
  useEffect(() => {
    if (!hasApi || !tokens.get()?.access) return;
    http('/auth/me/')
      .then((me) => me && persist({ ...read(KEY, {}), ...me }))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // API rejected our tokens for good → sign out
  useEffect(() => {
    window.addEventListener('rk-logout', logout);
    return () => window.removeEventListener('rk-logout', logout);
  }, [logout]);

  const fromApi = (data) => {
    tokens.set({ access: data.access, refresh: data.refresh });
    return { user: persist(data.user), created: Boolean(data.created) };
  };

  // Step 1 of sign-up: emails a 6-digit code. Nothing is created until it is confirmed.
  const signup = useCallback(async ({ name, email, password }) => {
    if (hasApi) return http('/auth/register/', { method: 'POST', body: { name, email, password } });
    await wait();
    if (read(USERS_KEY, []).some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists. Please log in.');
    }
    demoPending = { name, email, password };
    return { pending: true, email };
  }, []);

  // Step 2 of sign-up: the code from the email.
  const verifySignup = useCallback(async ({ email, code }) => {
    if (hasApi) return fromApi(await http('/auth/verify/', { method: 'POST', body: { email, code } }));
    await wait();
    if (!demoPending || code !== DEMO_CODE) throw new Error('That code is not correct.');
    const { name, password } = demoPending;
    demoPending = null;
    localStorage.setItem(USERS_KEY, JSON.stringify([...read(USERS_KEY, []), { name, email, password }]));
    return { user: persist({ name, email }), created: true };
  }, []);

  const login = useCallback(async ({ email, password }) => {
    if (hasApi) return fromApi(await http('/auth/login/', { method: 'POST', body: { email, password } }));
    await wait(700);
    const found = read(USERS_KEY, []).find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!found) throw new Error('Incorrect email or password.');
    return { user: persist({ name: found.name, email: found.email }), created: false };
  }, []);

  // Passwordless login: emailed code
  const requestLoginCode = useCallback(async (email) => {
    if (hasApi) return http('/auth/otp/request/', { method: 'POST', body: { email } });
    await wait();
    return { detail: 'sent' };
  }, []);

  const loginWithCode = useCallback(async ({ email, code }) => {
    if (hasApi) return fromApi(await http('/auth/otp/login/', { method: 'POST', body: { email, code } }));
    await wait();
    const found = read(USERS_KEY, []).find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found || code !== DEMO_CODE) throw new Error('That code is not correct.');
    return { user: persist({ name: found.name, email: found.email }), created: false };
  }, []);

  const googleLogin = useCallback(async (credential) => {
    if (!hasApi) throw new Error('Google sign-in needs the live server. Set VITE_API_URL first.');
    return fromApi(await http('/auth/google/', { method: 'POST', body: { credential } }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, signup, verifySignup, login, requestLoginCode, loginWithCode, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
