import { useState, useCallback } from 'react';
import { EMPTY_FILTERS } from '../constants/filters';
import type { SearchFilters } from '../api/destinos';

export function useSearchFilters(initial?: SearchFilters) {
  const [q, setQ] = useState(initial?.q ?? '');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>(() => ({
    ...EMPTY_FILTERS,
    presupuesto: initial?.presupuesto ?? '',
    masificacion: initial?.masificacion ?? '',
    ubicacion: initial?.ubicacion ?? '',
    tipoTurismo: initial?.tipoTurismo ?? '',
    actividades: initial?.actividades ?? '',
  }));

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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

  const localActiveCount = Object.values(filters).filter(Boolean).length + (q.trim() ? 1 : 0);

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

export function filtersFromParams(params: URLSearchParams): SearchFilters {
  const keys = ['q', 'presupuesto', 'masificacion', 'ubicacion', 'tipoTurismo', 'actividades'] as const;
  const out: SearchFilters = {};
  for (const key of keys) {
    const value = params.get(key);
    if (value) out[key] = value;
  }
  return out;
}

export function filtersToParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params;
}

export function hasFilterValues(filters: SearchFilters): boolean {
  return Object.values(filters).some(Boolean);
}
