import { apiFetch } from './client';
import type { Favorito } from '../types/user';

export function getFavoritos(token: string, signal?: AbortSignal) {
  return apiFetch<Favorito[]>('/api/favoritos', { token, signal });
}

export function getFavoriteIds(token: string) {
  return apiFetch<{ ids: string[] }>('/api/favoritos/ids', { token });
}

export function addFavorito(destinoId: string, token: string) {
  return apiFetch<{ favorito: { id: string }; created: boolean }>(`/api/favoritos/${destinoId}`, {
    method: 'POST',
    token,
  });
}

export function removeFavorito(destinoId: string, token: string) {
  return apiFetch<{ removed: boolean }>(`/api/favoritos/${destinoId}`, {
    method: 'DELETE',
    token,
  });
}
