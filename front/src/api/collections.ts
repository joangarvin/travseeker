import { apiFetch } from './client';
import type {
  CollectionSummary,
  CollectionDetail,
  CollectionForDestino,
  CollectionInput,
  PublicCollection,
  CollectionMember,
} from '../types/collection';

export function getCollections(token: string, signal?: AbortSignal) {
  return apiFetch<CollectionSummary[]>('/api/colecciones', { token, signal });
}

export function shareCollection(id: string, token: string) {
  return apiFetch<{ id: string; shareToken: string; visibility: 'shared' }>(`/api/colecciones/${id}/share`, { method: 'POST', token });
}

export function stopSharingCollection(id: string, token: string) {
  return apiFetch<{ id: string; visibility: 'private' }>(`/api/colecciones/${id}/share`, { method: 'DELETE', token });
}

export function getPublicCollection(shareToken: string, signal?: AbortSignal) {
  return apiFetch<PublicCollection>(`/api/colecciones/public/${shareToken}`, { signal });
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

export function updateCollectionItem(collectionId: string, destinoId: string, data: { notas?: string; dayIndex?: number | null; status?: 'idea' | 'confirmed' | 'booked'; sortOrder?: number }, token: string) {
  return apiFetch<{ id: string; destinoId: string; notas: string | null; dayIndex: number | null; status: 'idea' | 'confirmed' | 'booked'; sortOrder: number }>(`/api/colecciones/${collectionId}/items/${destinoId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export function reorderCollectionItems(collectionId: string, orderedDestinoIds: string[], token: string) {
  return apiFetch<{ order: string[] }>(`/api/colecciones/${collectionId}/items/reorder`, {
    method: 'PATCH', body: JSON.stringify({ orderedDestinoIds }), token,
  });
}

export function removeFromCollection(collectionId: string, destinoId: string, token: string) {
  return apiFetch<{ removed: boolean }>(`/api/colecciones/${collectionId}/items/${destinoId}`, {
    method: 'DELETE',
    token,
  });
}

export function addCollectionMember(collectionId: string, email: string, role: 'editor' | 'viewer', token: string) {
  return apiFetch<CollectionMember>(`/api/colecciones/${collectionId}/members`, { method: 'POST', body: JSON.stringify({ email, role }), token });
}

export function updateCollectionMember(collectionId: string, memberId: string, role: 'editor' | 'viewer', token: string) {
  return apiFetch<CollectionMember>(`/api/colecciones/${collectionId}/members/${memberId}`, { method: 'PATCH', body: JSON.stringify({ role }), token });
}

export function removeCollectionMember(collectionId: string, memberId: string, token: string) {
  return apiFetch<{ removed: boolean }>(`/api/colecciones/${collectionId}/members/${memberId}`, { method: 'DELETE', token });
}
