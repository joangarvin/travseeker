import { normalizeCompareIds } from '../utils/compareSelection';
import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

type CompareContextValue = {
  ids: string[];
  toggle: (id: string) => boolean;
  clear: () => void;
  replace: (ids: string[]) => void;
};

const COMPARE_STORAGE_KEY = 'trav_compare';
const MAX_COMPARE_ITEMS = 4;
const CompareContext = createContext<CompareContextValue | null>(null);

function getStoredIds(): string[] {
  try {
    const storedValue = JSON.parse(localStorage.getItem(COMPARE_STORAGE_KEY) || '[]');
    return normalizeCompareIds(storedValue);
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(getStoredIds);

  const latest = useRef(ids);
  const update = (next: string[]) => {
    latest.current = next;
    setIds(next);
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* selection remains in memory */
    }
  };

  const value = useMemo<CompareContextValue>(
    () => ({
      ids,
      toggle: (id) => {
        const ids = latest.current;
        if (ids.includes(id)) {
          update(ids.filter((currentId) => currentId !== id));
          return true;
        }
        if (ids.length >= MAX_COMPARE_ITEMS) return false;
        update([...ids, id]);
        return true;
      },
      clear: () => update([]),
      replace: (next) => update(normalizeCompareIds(next)),
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
