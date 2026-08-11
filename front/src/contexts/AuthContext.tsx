import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, COOKIE_SESSION_MARKER } from '../services/api';
import type { User } from '../types';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
};

const LEGACY_TOKEN_STORAGE_KEY = 'trav_token';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setUser(await api<User>('/auth/me', {}, token));
      setToken(COOKIE_SESSION_MARKER);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const authenticate = async (path: string, payload: Record<string, string>) => {
    const result = await api<{ user: User }>(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setToken(COOKIE_SESSION_MARKER);
    setUser(result.user);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login: (email, password) => authenticate('/auth/login', { email, password }),
      register: (email, password, nombre) =>
        authenticate('/auth/register', { email, password, nombre }),
      logout: () => {
        setUser(null);
        void api('/auth/logout', { method: 'POST' }).finally(() => setToken(null));
      },
      refresh,
    }),
    [loading, refresh, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }

  return context;
}
