import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type CompareContextValue = {
  ids: string[];
  toggle: (id: string) => boolean;
  clear: () => void;
};

const COMPARE_STORAGE_KEY = 'trav_compare';
const MAX_COMPARE_ITEMS = 4;
const CompareContext = createContext<CompareContextValue | null>(null);

function getStoredIds(): string[] {
  try {
    const storedValue = JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY) || '[]');
    return Array.isArray(storedValue) ? storedValue : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(getStoredIds);

  useEffect(() => {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(ids));
  }, [ids]);

  const value = useMemo<CompareContextValue>(
    () => ({
      ids,
      toggle: (id) => {
        if (ids.includes(id)) {
          setIds(ids.filter((currentId) => currentId !== id));
          return true;
        }
        if (ids.length >= MAX_COMPARE_ITEMS) return false;
        setIds([...ids, id]);
        return true;
      },
      clear: () => setIds([]),
    }),
    [ids],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const context = useContext(CompareContext);

  if (!context) {
    throw new Error('useCompare debe usarse dentro de CompareProvider');
  }

  return context;
}
