/**
 * API base URL.
 * - Development: empty string → Vite proxy forwards /api to localhost:3001
 * - Production: set VITE_API_URL to your deployed backend (e.g. https://api.tudominio.com)
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '' : '');
