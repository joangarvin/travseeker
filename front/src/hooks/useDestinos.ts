import { useState, useEffect, useCallback, useRef } from 'react';
import type { Destino } from '../types';
import type { SearchFilters } from '../api/destinos';
import { destinosApi } from '../api/destinos';
import { hasFilterValues } from './useSearchFilters';

function countActiveFilters(filters: SearchFilters): number {
  return Object.entries(filters).filter(([k, v]) => v && k !== 'q').length + (filters.q ? 1 : 0);
}

export function useDestinos(initialFilters?: SearchFilters) {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(() => hasFilterValues(initialFilters ?? {}));
  const [activeFilterCount, setActiveFilterCount] = useState(() =>
    countActiveFilters(initialFilters ?? {}),
  );
  const [connectionError, setConnectionError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const initialRef = useRef(initialFilters);

  const loadFeatured = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setConnectionError(false);

    destinosApi.getDestacados(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setDestinos(data);
        setIsSearching(false);
        setActiveFilterCount(0);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Error fetching data:', err);
        setConnectionError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, []);

  const searchDestinos = useCallback((filters: SearchFilters) => {
    if (!hasFilterValues(filters)) {
      loadFeatured();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setIsSearching(true);
    setActiveFilterCount(countActiveFilters(filters));
    setConnectionError(false);

    destinosApi.search(filters, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setDestinos(data);
        requestAnimationFrame(() => {
          document.getElementById('destinos')?.scrollIntoView({ behavior: 'smooth' });
        });
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        console.error('Error fetching search results:', err);
        setConnectionError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [loadFeatured]);

  useEffect(() => {
    const filters = initialRef.current ?? {};
    if (hasFilterValues(filters)) {
      searchDestinos(filters);
    } else {
      loadFeatured();
    }
    return () => abortRef.current?.abort();
  }, [loadFeatured, searchDestinos]);

  return { destinos, loading, isSearching, activeFilterCount, connectionError, searchDestinos, loadFeatured };
}
