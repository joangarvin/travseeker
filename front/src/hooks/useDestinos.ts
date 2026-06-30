import { useState, useEffect, useCallback, useRef } from 'react';
import type { Destino } from '../types';
import type { SearchFilters } from '../api/destinos';
import { destinosApi } from '../api/destinos';

function countActiveFilters(filters: SearchFilters): number {
  return Object.entries(filters).filter(([k, v]) => v && k !== 'q').length + (filters.q ? 1 : 0);
}

function hasActiveFilters(filters: SearchFilters): boolean {
  return Object.values(filters).some(Boolean);
}

export function useDestinos() {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [connectionError, setConnectionError] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const loadFeatured = useCallback(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setConnectionError(false);

    destinosApi.getDestacados(controller.signal)
      .then(data => {
        if (controller.signal.aborted) return;
        setDestinos(data);
        setIsSearching(false);
        setActiveFilterCount(0);
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        console.error('Error fetching data:', err);
        setConnectionError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadFeatured();
    return () => abortRef.current?.abort();
  }, [loadFeatured]);

  const searchDestinos = useCallback((filters: SearchFilters) => {
    if (!hasActiveFilters(filters)) {
      loadFeatured();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setIsSearching(true);
    setActiveFilterCount(countActiveFilters(filters));

    destinosApi.search(filters, controller.signal)
      .then(data => {
        if (controller.signal.aborted) return;
        setDestinos(data);
        requestAnimationFrame(() => {
          document.getElementById('destinos')?.scrollIntoView({ behavior: 'smooth' });
        });
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        console.error('Error fetching search results:', err);
        setConnectionError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
  }, [loadFeatured]);

  return { destinos, loading, isSearching, activeFilterCount, connectionError, searchDestinos, loadFeatured };
}
