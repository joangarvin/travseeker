import { apiFetch } from './client';
import type {
  AdminDestinoPayload,
  AdminDestinoRow,
  AdminMunicipio,
  AdminMunicipioPayload,
} from '../types/admin';

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
};
