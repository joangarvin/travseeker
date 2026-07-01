import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import * as favoritosApi from '../api/favoritos';
import type { ProfileUpdate, User } from '../types/user';

const TOKEN_KEY = 'travseeker-token';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  favoriteIds: Set<string>;
  isFavorite: (destinoId: string) => boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nombre?: string) => Promise<void>;
  logout: () => void;
  toggleFavorite: (destinoId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const refreshFavorites = useCallback(async () => {
    if (!token) {
      setFavoriteIds(new Set());
      return;
    }
    try {
      const { ids } = await favoritosApi.getFavoriteIds(token);
      setFavoriteIds(new Set(ids));
    } catch {
      setFavoriteIds(new Set());
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const me = await authApi.getMe(token);
        if (cancelled) return;
        setUser(me);
        const { ids } = await favoritosApi.getFavoriteIds(token);
        if (cancelled) return;
        setFavoriteIds(new Set(ids));
      } catch {
        if (cancelled) return;
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
        setUser(null);
        setFavoriteIds(new Set());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const me = await authApi.getMe(token);
      setUser(me);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const syncUser = () => {
      if (document.visibilityState === 'visible') {
        void refreshUser();
      }
    };

    document.addEventListener('visibilitychange', syncUser);
    window.addEventListener('focus', syncUser);

    return () => {
      document.removeEventListener('visibilitychange', syncUser);
      window.removeEventListener('focus', syncUser);
    };
  }, [token, refreshUser]);

  const persistSession = useCallback((nextUser: User, nextToken: string) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token: nextToken } = await authApi.login(email, password);
    localStorage.setItem(TOKEN_KEY, nextToken);
    setToken(nextToken);
    const me = await authApi.getMe(nextToken);
    setUser(me);
    const { ids } = await favoritosApi.getFavoriteIds(nextToken);
    setFavoriteIds(new Set(ids));
  }, []);

  const register = useCallback(async (email: string, password: string, nombre?: string) => {
    const { user: nextUser, token: nextToken } = await authApi.register(email, password, nombre);
    persistSession(nextUser, nextToken);
    setFavoriteIds(new Set());
  }, [persistSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setFavoriteIds(new Set());
  }, []);

  const toggleFavorite = useCallback(async (destinoId: string) => {
    if (!token) return false;

    const wasFavorite = favoriteIds.has(destinoId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (wasFavorite) next.delete(destinoId);
      else next.add(destinoId);
      return next;
    });

    try {
      if (wasFavorite) {
        await favoritosApi.removeFavorito(destinoId, token);
        return false;
      }
      await favoritosApi.addFavorito(destinoId, token);
      return true;
    } catch {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (wasFavorite) next.add(destinoId);
        else next.delete(destinoId);
        return next;
      });
      throw new Error('No se pudo actualizar el favorito');
    }
  }, [token, favoriteIds]);

  const isFavorite = useCallback(
    (destinoId: string) => favoriteIds.has(destinoId),
    [favoriteIds],
  );

  const updateProfile = useCallback(async (data: ProfileUpdate) => {
    if (!token) throw new Error('Debes iniciar sesión');
    const updated = await authApi.updateProfile(data, token);
    setUser(updated);
    return updated;
  }, [token]);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!token) throw new Error('Debes iniciar sesión');
    await authApi.changePassword(currentPassword, newPassword, token);
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      favoriteIds,
      isFavorite,
      login,
      register,
      logout,
      toggleFavorite,
      refreshFavorites,
      updateProfile,
      changePassword,
      refreshUser,
    }),
    [user, token, loading, favoriteIds, isFavorite, login, register, logout, toggleFavorite, refreshFavorites, updateProfile, changePassword, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
