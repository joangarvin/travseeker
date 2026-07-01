import { parseJsonSafe } from '../parseJson';

/** Lee un valor guardado (a veces JSON) y lo muestra como texto simple. */
export function readStoredText(value?: string | null): string {
  return parseJsonSafe(value ?? '').trim();
}

/** Guarda un texto simple; mantiene compatibilidad con datos antiguos en JSON. */
export function writeStoredText(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    JSON.parse(trimmed);
    return trimmed;
  } catch {
    return JSON.stringify([trimmed]);
  }
}
