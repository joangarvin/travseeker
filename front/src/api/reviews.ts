import { apiFetch } from './client';
import type { Review, ReviewsResponse } from '../types/review';

export function getReviews(destinoId: string, signal?: AbortSignal) {
  return apiFetch<ReviewsResponse>(`/api/destinos/${destinoId}/reviews`, { signal });
}

export function upsertReview(destinoId: string, rating: number, comment: string, token: string) {
  return apiFetch<Review>(`/api/destinos/${destinoId}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating, comment }),
    token,
  });
}

export function deleteReview(destinoId: string, token: string) {
  return apiFetch<{ removed: boolean }>(`/api/destinos/${destinoId}/reviews`, {
    method: 'DELETE',
    token,
  });
}
