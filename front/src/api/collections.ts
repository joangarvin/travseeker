import { apiFetch } from './client';
import type {
  CollectionSummary,
  CollectionDetail,
  CollectionForDestino,
  CollectionInput,
} from '../types/collection';

export function getCollections(token: string, signal?: AbortSignal) {
  return apiFetch<CollectionSummary[]>('/api/colecciones', { token, signal });
}

export function getCollection(id: string, token: string, signal?: AbortSignal) {
  return apiFetch<CollectionDetail>(`/api/colecciones/${id}`, { token, signal });
}

export function createCollection(data: CollectionInput, token: string) {
  return apiFetch<CollectionSummary>('/api/colecciones', {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

export function updateCollection(id: string, data: CollectionInput, token: string) {
  return apiFetch<CollectionSummary>(`/api/colecciones/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export function deleteCollection(id: string, token: string) {
  return apiFetch<{ removed: boolean }>(`/api/colecciones/${id}`, {
    method: 'DELETE',
    token,
  });
}

export function getCollectionsForDestino(destinoId: string, token: string, signal?: AbortSignal) {
  return apiFetch<CollectionForDestino[]>(`/api/colecciones/destino/${destinoId}`, { token, signal });
}

export function addToCollection(collectionId: string, destinoId: string, token: string, notas?: string) {
  return apiFetch<{ id: string }>(`/api/colecciones/${collectionId}/items`, {
    method: 'POST',
    body: JSON.stringify({ destinoId, notas }),
    token,
  });
}

export function updateItemNotes(collectionId: string, destinoId: string, notas: string, token: string) {
  return apiFetch<{ notas: string | null }>(`/api/colecciones/${collectionId}/items/${destinoId}`, {
    method: 'PATCH',
    body: JSON.stringify({ notas }),
    token,
  });
}

export function removeFromCollection(collectionId: string, destinoId: string, token: string) {
  return apiFetch<{ removed: boolean }>(`/api/colecciones/${collectionId}/items/${destinoId}`, {
    method: 'DELETE',
    token,
  });
}
