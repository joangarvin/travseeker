import type { LucideIcon } from 'lucide-react';
import { Castle, Compass, Landmark, Leaf, Mountain, Waves, Wheat } from 'lucide-react';
import { parseTagValues, serializeTagValues, tagQueryValue } from '../../utils/tags';

export type TourismKind =
  'cultural' | 'naturaleza' | 'playa' | 'rural' | 'montana' | 'patrimonial' | 'otro';

export type TourismDefinition = {
  key: TourismKind;
  label: string;
  description: string;
  Icon: LucideIcon;
};

export const tourismTypes: TourismDefinition[] = [
  { key: 'cultural', label: 'Cultural', description: 'Ideas, arte y vida local', Icon: Landmark },
  {
    key: 'naturaleza',
    label: 'Naturaleza',
    description: 'Paisajes con espacio para respirar',
    Icon: Leaf,
  },
  {
    key: 'playa',
    label: 'Sol y playa',
    description: 'Costa, luz y tiempo junto al mar',
    Icon: Waves,
  },
  { key: 'rural', label: 'Rural', description: 'Pueblos, caminos y ritmo pausado', Icon: Wheat },
  {
    key: 'montana',
    label: 'Montaña',
    description: 'Altura, senderos y aire abierto',
    Icon: Mountain,
  },
  {
    key: 'patrimonial',
    label: 'Patrimonial',
    description: 'Historia que todavía se recorre',
    Icon: Castle,
  },
];

function normalizedTourismKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

export function isTourismValue(value: string) {
  const key = normalizedTourismKey(value);
  return tourismTypes.some((tourismType) => normalizedTourismKey(tourismType.label) === key);
}

export function tourismValues(value?: string | string[] | null): string[] {
  return parseTagValues(value);
}

export function serializeTourismValues(values: string[]) {
  return serializeTagValues(values);
}

export function tourismQueryValue(values: string[]) {
  return tagQueryValue(values);
}

export function tourismDefinition(value?: string | null): TourismDefinition {
  const firstValue = tourismValues(value)[0] || '';
  const normalized = normalizedTourismKey(firstValue);
  return (
    tourismTypes.find((item) => normalized.includes(normalizedTourismKey(item.label))) || {
      key: 'otro',
      label: firstValue || 'Otros viajes',
      description: 'Una forma distinta de descubrir',
      Icon: Compass,
    }
  );
}

export function TourismMark({
  value,
  compact = false,
}: {
  value?: string | null;
  compact?: boolean;
}) {
  const type = tourismDefinition(value);
  const extraCount = Math.max(0, tourismValues(value).length - 1);
  return (
    <span className={`tourism-mark tourism--${type.key} ${compact ? 'tourism-mark--compact' : ''}`}>
      <span className="tourism-mark__symbol" aria-hidden>
        <type.Icon />
      </span>
      <span className="tourism-mark__label">{type.label}</span>
      {extraCount > 0 && <span className="tourism-mark__more">+{extraCount}</span>}
    </span>
  );
}

export function TourismMarks({
  value,
  compact = false,
}: {
  value?: string | null;
  compact?: boolean;
}) {
  const values = tourismValues(value);
  if (!values.length) return <span>—</span>;
  return (
    <span className="tourism-marks">
      {values.map((item) => (
        <TourismMark key={item} value={item} compact={compact} />
      ))}
    </span>
  );
}
