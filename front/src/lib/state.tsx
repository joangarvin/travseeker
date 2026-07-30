import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from './api';
import type { User } from '../types';

type AuthValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('trav_token'));
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const refresh = useCallback(async () => {
    if (!token) { setUser(null); setLoading(false); return; }
    try { setUser(await api<User>('/auth/me', {}, token)); }
    catch { localStorage.removeItem('trav_token'); setToken(null); setUser(null); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void refresh(); }, [refresh]);
  const authenticate = async (path: string, payload: Record<string, string>) => {
    const result = await api<{ user: User; token: string }>(path, { method: 'POST', body: JSON.stringify(payload) });
    localStorage.setItem('trav_token', result.token); setToken(result.token); setUser(result.user);
  };
  const value = useMemo<AuthValue>(() => ({
    user, token, loading,
    login: (email, password) => authenticate('/auth/login', { email, password }),
    register: (email, password, nombre) => authenticate('/auth/register', { email, password, nombre }),
    logout: () => { localStorage.removeItem('trav_token'); setToken(null); setUser(null); },
    refresh,
  }), [user, token, loading, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider missing');
  return value;
}

type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('trav_theme') as Theme) || 'light');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('trav_theme', theme); }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggle: () => setTheme((t) => t === 'light' ? 'dark' : 'light') }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error('ThemeProvider missing'); return value; }

const CompareContext = createContext<{ ids: string[]; toggle: (id: string) => void; clear: () => void } | null>(null);
export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => JSON.parse(localStorage.getItem('trav_compare') || '[]'));
  useEffect(() => { localStorage.setItem('trav_compare', JSON.stringify(ids)); }, [ids]);
  const value = useMemo(() => ({
    ids,
    toggle: (id: string) => setIds((current) => current.includes(id) ? current.filter((x) => x !== id) : current.length < 4 ? [...current, id] : current),
    clear: () => setIds([]),
  }), [ids]);
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}
export function useCompare() { const value = useContext(CompareContext); if (!value) throw new Error('CompareProvider missing'); return value; }
