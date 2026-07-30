const API = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

export async function api<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || 'No se pudo completar la operación', response.status);
  return data as T;
}

export function queryString(values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
  const result = params.toString();
  return result ? `?${result}` : '';
}

export function imageUrl(value?: string | null) {
  if (!value) return '';
  if (/^https?:\/\//.test(value) || value.startsWith('data:')) return value;
  return value.startsWith('/') ? value : `/${value}`;
}

export function plain(value?: string | null) {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.join(', ');
    if (typeof parsed === 'string') return parsed;
  } catch { /* stored as plain text */ }
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

const ALLOWED = new Set(['A', 'B', 'BLOCKQUOTE', 'BR', 'EM', 'H2', 'H3', 'H4', 'LI', 'OL', 'P', 'STRONG', 'UL']);
export function safeHtml(value?: string | null) {
  if (!value || typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(value, 'text/html');
  [...doc.body.querySelectorAll('*')].forEach((node) => {
    if (!ALLOWED.has(node.tagName)) { node.replaceWith(...node.childNodes); return; }
    [...node.attributes].forEach((attribute) => {
      if (node.tagName !== 'A' || !['href', 'target', 'rel'].includes(attribute.name)) node.removeAttribute(attribute.name);
    });
    if (node.tagName === 'A') {
      const href = node.getAttribute('href') || '';
      if (!/^(https?:|mailto:|\/)/.test(href)) node.removeAttribute('href');
      if (node.getAttribute('target') === '_blank') node.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return doc.body.innerHTML;
}
