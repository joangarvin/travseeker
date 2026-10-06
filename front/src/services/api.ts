import { createRequestCache, isPublicDataPath, withAbort } from './publicRequestCache';
import { t } from '../i18n';
import { locale, serverMessage } from '../i18n';
// Production uses the Vercel proxy so session cookies belong to the website.
// Calling Render directly makes them third-party cookies, which Safari blocks.
export const API_BASE_URL = import.meta.env.PROD ? '/api' : import.meta.env.VITE_API_URL || '/api';
export const COOKIE_SESSION_MARKER = '__trav_cookie_session__';

const publicRequests = createRequestCache();
let bypassBrowserCacheUntil = 0;

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

  if (options.body != null && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && token !== COOKIE_SESSION_MARKER) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.signal?.aborted)
    throw options.signal.reason || new DOMException('Aborted', 'AbortError');
  const method = (options.method || 'GET').toUpperCase();
  const cacheable =
    method === 'GET' && isPublicDataPath(path) && !options.cache && !options.headers;
  const request = async () => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      signal: cacheable ? undefined : options.signal,
      cache: cacheable && Date.now() < bypassBrowserCacheUntil ? 'no-store' : options.cache,
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new ApiError(
        serverMessage(data.error || t('No se pudo completar la operación')),
        response.status,
      );
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      publicRequests.clear();
      // Invalidate the browser's short HTTP cache too after an edit.
      bypassBrowserCacheUntil = Date.now() + 60_000;
    }
    return data as T;
  };
  if (!cacheable) return request();
  const [pathname, query = ''] = path.split('?');
  const params = new URLSearchParams(query);
  params.sort();
  return withAbort(
    publicRequests.read(`${API_BASE_URL}|${locale}|${pathname}?${params}`, request),
    options.signal,
  );
}
