import { apiFetch } from './client';
import type {
  AdminDestinoPayload,
  AdminDestinoRow,
  AdminMunicipio,
  AdminMunicipioPayload,
} from '../types/admin';
import type { Review } from '../types/review';
import type { Place } from '../types';

export type {
  AdminDestinoPayload,
  AdminDestinoRow,
  AdminMunicipio,
  AdminMunicipioPayload,
};

export const adminApi = {
  listDestinos: (token: string) => apiFetch<AdminDestinoRow[]>('/api/admin/destinos', { token }),

  createDestino: (payload: AdminDestinoPayload, token: string) =>
    apiFetch<{ id: string }>('/api/admin/destinos', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),

  updateDestino: (id: string, payload: AdminDestinoPayload, token: string) =>
    apiFetch(`/api/admin/destinos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    }),

  deleteDestino: (id: string, token: string) =>
    apiFetch(`/api/admin/destinos/${id}`, { method: 'DELETE', token }),

  listMunicipios: (token: string) =>
    apiFetch<AdminMunicipio[]>('/api/admin/municipios', { token }),

  createMunicipio: (payload: AdminMunicipioPayload, token: string) =>
    apiFetch<AdminMunicipio>('/api/admin/municipios', {
      method: 'POST',
      body: JSON.stringify(payload),
      token,
    }),

  updateMunicipio: (municipioId: string, payload: AdminMunicipioPayload, token: string) =>
    apiFetch<AdminMunicipio>(`/api/admin/municipios/${municipioId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
      token,
    }),

  deleteMunicipio: (municipioId: string, token: string) =>
    apiFetch(`/api/admin/municipios/${municipioId}`, { method: 'DELETE', token }),

  linkMunicipio: (destinoId: string, municipioId: string, token: string) =>
    apiFetch<AdminMunicipio>(`/api/admin/destinos/${destinoId}/municipios`, {
      method: 'POST',
      body: JSON.stringify({ municipioId }),
      token,
    }),

  unlinkMunicipio: (destinoId: string, municipioId: string, token: string) =>
    apiFetch(`/api/admin/destinos/${destinoId}/municipios/${municipioId}`, {
      method: 'DELETE',
      token,
    }),

  listReviews: (token: string) => apiFetch<Review[]>('/api/admin/reviews', { token }),
  moderateReview: (id: string, data: { status: 'published' | 'hidden'; adminResponse?: string }, token: string) =>
    apiFetch<Review>(`/api/admin/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data), token }),
  listPlaces: (destinoId: string, token: string) => apiFetch<Place[]>(`/api/admin/destinos/${destinoId}/places`, { token }),
  createPlace: (destinoId: string, data: Omit<Place, 'id'>, token: string) => apiFetch<Place>(`/api/admin/destinos/${destinoId}/places`, { method: 'POST', body: JSON.stringify(data), token }),
  deletePlace: (id: string, token: string) => apiFetch(`/api/admin/places/${id}`, { method: 'DELETE', token }),
};
