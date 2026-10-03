import { t } from '../i18n';
import { locale, serverMessage } from '../i18n';
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const COOKIE_SESSION_MARKER = '__trav_cookie_session__';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept-Language', locale);

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && token !== COOKIE_SESSION_MARKER) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(
      serverMessage(data.error || t('No se pudo completar la operación')),
      response.status,
    );
  }

  return data as T;
}
