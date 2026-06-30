import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'travseeker-compare';
export const COMPARE_MAX = 4;

export interface CompareItem {
  id: string;
  nombre: string;
}

interface CompareContextValue {
  items: CompareItem[];
  isInCompare: (id: string) => boolean;
  toggleCompare: (item: CompareItem) => boolean;
  addCompare: (item: CompareItem) => boolean;
  removeCompare: (id: string) => void;
  setItems: (items: CompareItem[]) => void;
  clearCompare: () => void;
  canAdd: boolean;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function loadStored(): CompareItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CompareItem[];
    return Array.isArray(parsed) ? parsed.filter((x) => x?.id && x?.nombre).slice(0, COMPARE_MAX) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItemsState] = useState<CompareItem[]>(() => loadStored());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const isInCompare = useCallback((id: string) => items.some((x) => x.id === id), [items]);

  const addCompare = useCallback((item: CompareItem) => {
    if (items.some((x) => x.id === item.id)) return true;
    if (items.length >= COMPARE_MAX) return false;
    setItemsState((prev) => [...prev, item]);
    return true;
  }, [items]);

  const removeCompare = useCallback((id: string) => {
    setItemsState((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toggleCompare = useCallback((item: CompareItem) => {
    if (items.some((x) => x.id === item.id)) {
      removeCompare(item.id);
      return false;
    }
    if (items.length >= COMPARE_MAX) return false;
    setItemsState((prev) => [...prev, item]);
    return true;
  }, [items, removeCompare]);

  const setItems = useCallback((next: CompareItem[]) => {
    setItemsState(next.slice(0, COMPARE_MAX));
  }, []);

  const clearCompare = useCallback(() => setItemsState([]), []);

  const value = useMemo(
    () => ({
      items,
      isInCompare,
      toggleCompare,
      addCompare,
      removeCompare,
      setItems,
      clearCompare,
      canAdd: items.length < COMPARE_MAX,
    }),
    [items, isInCompare, toggleCompare, addCompare, removeCompare, setItems, clearCompare],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within CompareProvider');
  return ctx;
}
