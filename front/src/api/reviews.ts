import { apiFetch } from './client';
import type { Review, ReviewInput, ReviewsResponse } from '../types/review';

export function getReviews(destinoId: string, signal?: AbortSignal) {
  return apiFetch<ReviewsResponse>(`/api/destinos/${destinoId}/reviews`, { signal });
}

export function upsertReview(destinoId: string, payload: ReviewInput, token: string) {
  return apiFetch<Review>(`/api/destinos/${destinoId}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteReview(destinoId: string, token: string) {
  return apiFetch<{ removed: boolean }>(`/api/destinos/${destinoId}/reviews`, {
    method: 'DELETE',
    token,
  });
}
