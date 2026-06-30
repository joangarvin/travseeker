import { useState, useCallback } from 'react';
import { EMPTY_FILTERS } from '../constants/filters';
import type { SearchFilters } from '../api/destinos';

export function useSearchFilters() {
  const [q, setQ] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({ ...EMPTY_FILTERS });

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setQ('');
    setFilters({ ...EMPTY_FILTERS });
    setFiltersOpen(false);
  }, []);

  const buildPayload = useCallback((): SearchFilters => ({
    q,
    ...filters,
  }), [q, filters]);

  const localActiveCount = Object.values(filters).filter(Boolean).length;

  return {
    q,
    setQ,
    filters,
    filtersOpen,
    setFiltersOpen,
    updateFilter,
    resetFilters,
    buildPayload,
    localActiveCount,
  };
}
