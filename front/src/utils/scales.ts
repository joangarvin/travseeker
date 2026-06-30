import { parseJsonSafe } from './parseJson';

export const PRESUPUESTO_ORDER = ['Bajo', 'Medio-Bajo', 'Medio', 'Medio-Alto', 'Alto'];
export const MASIFICACION_ORDER = ['Nulo', 'Leve', 'Medio', 'Alto', 'Muy Alto'];

/** Parses fields stored as JSON arrays (e.g. '["Cultural","Rural"]') into a string[]. */
export function parseTags(value?: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
    if (typeof parsed === 'string') return [parsed];
  } catch {
    return [value];
  }
  return [];
}

export function presupuestoIndex(value?: string | null): number {
  return PRESUPUESTO_ORDER.indexOf(parseJsonSafe(value ?? ''));
}

export function masificacionIndex(value?: string | null): number {
  return MASIFICACION_ORDER.indexOf(parseJsonSafe(value ?? ''));
}

export interface SeasonalData {
  mesesJulioAgosto: number;
  mesesMayJunSeptOct: number;
  mesesNovAbril: number;
}

export interface SeasonInfo {
  key: string;
  label: string;
  months: string;
  value: number;
}

export function getSeasons(d: SeasonalData): SeasonInfo[] {
  return [
    { key: 'verano', label: 'Verano', months: 'Julio y Agosto', value: d.mesesJulioAgosto },
    { key: 'media', label: 'Primavera y otoño', months: 'May, Jun, Sep y Oct', value: d.mesesMayJunSeptOct },
    { key: 'invierno', label: 'Temporada baja', months: 'Noviembre a Abril', value: d.mesesNovAbril },
  ];
}

export function getBestSeason(d: SeasonalData): SeasonInfo {
  return getSeasons(d).reduce((best, s) => (s.value < best.value ? s : best));
}

export function getWorstSeason(d: SeasonalData): SeasonInfo {
  return getSeasons(d).reduce((worst, s) => (s.value > worst.value ? s : worst));
}
