import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '../services/api';
import type { TourismType } from '../types';

type TourismTypeContextValue = {
  tourismTypes: TourismType[];
  isLoading: boolean;
  refreshTourismTypes: () => Promise<void>;
};

const TourismTypeContext = createContext<TourismTypeContextValue | null>(null);

export function TourismTypeProvider({ children }: { children: ReactNode }) {
  const [tourismTypes, setTourismTypes] = useState<TourismType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTourismTypes = useCallback(async () => {
    try {
      setTourismTypes(await api<TourismType[]>('/tourism-types'));
    } catch {
      // Static defaults keep the public interface usable during a temporary API failure.
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    void refreshTourismTypes();
  }, [refreshTourismTypes]);
  const value = useMemo(
    () => ({ tourismTypes, isLoading, refreshTourismTypes }),
    [tourismTypes, isLoading, refreshTourismTypes],
  );
  return <TourismTypeContext.Provider value={value}>{children}</TourismTypeContext.Provider>;
}

export function useTourismTypes() {
  const context = useContext(TourismTypeContext);
  if (!context) throw new Error('useTourismTypes debe usarse dentro de TourismTypeProvider');
  return context;
}
