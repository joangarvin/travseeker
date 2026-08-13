import { api } from './api';
import type { ClimateResponse } from '../types';

export function getDestinationClimate(destinationId: string, signal?: AbortSignal) {
  return api<ClimateResponse>(`/destinos/${encodeURIComponent(destinationId)}/climate`, { signal });
}
