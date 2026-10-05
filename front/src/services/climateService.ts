import { t } from '../i18n';
import { api } from './api';
import type { ClimateResponse } from '../types';

export function getDestinationClimate(destinationId: string, signal?: AbortSignal) {
  return api<ClimateResponse>(`/destinos/${encodeURIComponent(destinationId)}/climate`, {
    signal,
  }).then((data) => ({
    ...data,
    months: data.months.map((month) => ({ ...month, name: t(month.name) })),
    recommendedMonths: data.recommendedMonths.map((month) => ({ ...month, name: t(month.name) })),
  }));
}
