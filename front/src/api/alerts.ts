import { apiFetch } from './client';

export interface DecisionAlert {
  id: string;
  month: number | null;
  tipos: string[] | null;
  presupuesto: string | null;
  avoidCrowds: boolean;
  isActive: boolean;
  createdAt: string;
}

export function getAlerts(token: string) { return apiFetch<DecisionAlert[]>('/api/alertas', { token }); }
export function createAlert(data: Omit<DecisionAlert, 'id' | 'isActive' | 'createdAt'>, token: string) { return apiFetch<DecisionAlert>('/api/alertas', { method: 'POST', body: JSON.stringify(data), token }); }
export function deleteAlert(id: string, token: string) { return apiFetch<{ removed: boolean }>(`/api/alertas/${id}`, { method: 'DELETE', token }); }
