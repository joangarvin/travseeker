import { apiFetch } from './client';
import type { Recommendation } from '../types';

export function getRecommendations(token: string, signal?: AbortSignal, limit = 8) {
  return apiFetch<Recommendation[]>(`/api/recomendaciones?limit=${limit}`, { token, signal });
}
