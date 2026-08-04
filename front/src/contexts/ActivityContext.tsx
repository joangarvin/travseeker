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
import type { Activity } from '../types';

type ActivityContextValue = {
  activities: Activity[];
  isLoading: boolean;
  refreshActivities: () => Promise<void>;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshActivities = useCallback(async () => {
    try {
      setActivities(await api<Activity[]>('/activities'));
    } catch {
      // The static definitions remain available while an API is temporarily unavailable.
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshActivities();
  }, [refreshActivities]);

  const value = useMemo(
    () => ({ activities, isLoading, refreshActivities }),
    [activities, isLoading, refreshActivities],
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivities() {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('useActivities debe usarse dentro de ActivityProvider');
  return context;
}
