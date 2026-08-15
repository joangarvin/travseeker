import type { Destino, SearchFilters } from '../types';
import { parseTagValues, tagQueryValue } from './tags';

export type SearchFilterKey = keyof SearchFilters;

export type ActiveFilterChip = {
  id: string;
  key: SearchFilterKey;
  value: string;
  label: string;
};

export type FilterRelaxationCandidate = {
  relaxedFilterKey: SearchFilterKey;
  relaxedFilterLabel: string;
  filters: SearchFilters;
};

export type FallbackResult<T = Destino> = FilterRelaxationCandidate & {
  suggestedDestinations: T[];
  total: number;
};

const FILTER_LABELS: Partial<Record<SearchFilterKey, string>> = {
  q: 'Búsqueda',
  month: 'Mes',
  presupuesto: 'Presupuesto',
  masificacion: 'Afluencia',
  ubicacion: 'Ubicación',
  tipoTurismo: 'Tipo de viaje',
  actividades: 'Actividad',
  avoidCrowds: 'Evitar aglomeraciones',
};

// Mes y evitar aglomeraciones ordenan, pero no excluyen destinos en la API actual.
const RELAX_PRIORITY: SearchFilterKey[] = [
  'masificacion',
  'presupuesto',
  'actividades',
  'tipoTurismo',
  'ubicacion',
  'q',
];

function cleanFilters(filters: SearchFilters): SearchFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => Boolean(String(value || '').trim())),
  ) as SearchFilters;
}

function monthLabel(value: string) {
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) return value;
  const label = new Intl.DateTimeFormat('es', { month: 'long' }).format(
    new Date(2026, month - 1, 1),
  );
  return label.charAt(0).toLocaleUpperCase('es') + label.slice(1);
}

function valueLabel(key: SearchFilterKey, value: string) {
  if (key === 'month') return monthLabel(value);
  if (key === 'avoidCrowds') return FILTER_LABELS.avoidCrowds || 'Evitar aglomeraciones';
  return `${FILTER_LABELS[key] || key}: ${value}`;
}

function groupValues(key: SearchFilterKey, value?: string) {
  return key === 'tipoTurismo' || key === 'actividades'
    ? parseTagValues(value)
    : value
      ? [value]
      : [];
}

export function getActiveFilterChips(filters: SearchFilters): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  (Object.keys(FILTER_LABELS) as SearchFilterKey[]).forEach((key) => {
    const value = filters[key];
    if (!value) return;
    groupValues(key, value).forEach((item) => {
      chips.push({
        id: `${key}:${item}`,
        key,
        value: item,
        label: valueLabel(key, item),
      });
    });
  });

  return chips;
}

export function removeActiveFilter(
  filters: SearchFilters,
  key: SearchFilterKey,
  value?: string,
): SearchFilters {
  const next = { ...filters };

  if ((key === 'tipoTurismo' || key === 'actividades') && value) {
    const remaining = groupValues(key, filters[key]).filter((item) => item !== value);
    if (remaining.length) next[key] = tagQueryValue(remaining);
    else delete next[key];
  } else {
    delete next[key];
  }

  return cleanFilters(next);
}

export function buildRelaxationCandidates(
  filters: SearchFilters,
): FilterRelaxationCandidate[] {
  const active = cleanFilters(filters);

  return RELAX_PRIORITY.flatMap((key) => {
    const value = active[key];
    if (!value) return [];
    const displayValue = groupValues(key, value).join(', ');
    return [
      {
        relaxedFilterKey: key,
        relaxedFilterLabel: valueLabel(key, displayValue),
        filters: removeActiveFilter(active, key),
      },
    ];
  });
}
