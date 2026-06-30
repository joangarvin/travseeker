import { apiFetch } from './client';
import type { Destino, DestinoDetail, ComparableDestino } from '../types';

export interface SearchFilters {
  q?: string;
  presupuesto?: string;
  masificacion?: string;
  ubicacion?: string;
  tipoTurismo?: string;
  actividades?: string;
}

function toQueryString(filters: SearchFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.append(key, value);
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const destinosApi = {
  getDestacados: (signal?: AbortSignal) =>
    apiFetch<Destino[]>('/api/destacados', { signal }),

  search: (filters: SearchFilters, signal?: AbortSignal) =>
    apiFetch<Destino[]>(`/api/destinos${toQueryString(filters)}`, { signal }),

  getById: (id: string, signal?: AbortSignal) =>
    apiFetch<DestinoDetail>(`/api/destinos/${id}`, { signal }),

  getRelacionados: (id: string, signal?: AbortSignal) =>
    apiFetch<Destino[]>(`/api/destinos/${id}/relacionados`, { signal }),

  getStats: (signal?: AbortSignal) =>
    apiFetch<{ total: number; totalReviews: number; avgRating: number | null }>('/api/stats', { signal }),

  getMapa: (filters: SearchFilters, signal?: AbortSignal) =>
    apiFetch<MapDestino[]>(`/api/mapa${toQueryString(filters)}`, { signal }),

  compare: (ids: string[], signal?: AbortSignal) =>
    apiFetch<ComparableDestino[]>(`/api/destinos/compare?ids=${ids.join(',')}`, { signal }),
};

export interface MapDestino {
  id: string;
  nombre: string;
  latitud: number;
  longitud: number;
  imagen: string;
  presupuesto: string;
  masificacion: string;
  ubicacion: string;
  tipoTurismoPrincipal: string;
}
