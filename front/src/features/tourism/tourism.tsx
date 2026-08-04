import type { CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Building2,
  Castle,
  Compass,
  Landmark,
  Leaf,
  Mountain,
  Route,
  ShipWheel,
  TreePine,
  Umbrella,
  Waves,
  Wheat,
} from 'lucide-react';
import { useTourismTypes } from '../../contexts';
import type { TourismType } from '../../types';
import { parseTagValues, serializeTagValues, tagQueryValue } from '../../utils/tags';

export type TourismKind = string;

export type TourismDefinition = {
  key: TourismKind;
  label: string;
  description: string;
  icon: string;
  colorValue: string;
  Icon: LucideIcon;
};

export const tourismIconRegistry: Record<string, LucideIcon> = {
  Compass,
  Landmark,
  Leaf,
  Waves,
  Wheat,
  Mountain,
  Castle,
  TreePine,
  Building2,
  Umbrella,
  ShipWheel,
  Route,
};

export const tourismIconChoices = [
  ['Compass', 'Exploración'],
  ['Landmark', 'Cultura'],
  ['Leaf', 'Naturaleza'],
  ['Waves', 'Costa'],
  ['Wheat', 'Entorno rural'],
  ['Mountain', 'Montaña'],
  ['Castle', 'Patrimonio'],
  ['TreePine', 'Bosque'],
  ['Building2', 'Ciudad'],
  ['Umbrella', 'Playa'],
  ['ShipWheel', 'Marítimo'],
  ['Route', 'Itinerario'],
] as const;

export const tourismColorChoices = [
  ['cultural', 'Azul cartográfico', '#3047f2'],
  ['naturaleza', 'Verde territorio', '#256628'],
  ['playa', 'Turquesa costa', '#006b63'],
  ['rural', 'Tierra', '#6d4c41'],
  ['montana', 'Violeta sierra', '#4b4db0'],
  ['patrimonial', 'Carmín patrimonio', '#8c1046'],
  ['otro', 'Tinta neutra', '#5f6470'],
] as const;

export const tourismTypes: TourismDefinition[] = [
  {
    key: 'cultural',
    label: 'Cultural',
    description: 'Ideas, arte y vida local',
    icon: 'Landmark',
    colorValue: '#3047f2',
    Icon: Landmark,
  },
  {
    key: 'naturaleza',
    label: 'Naturaleza',
    description: 'Paisajes con espacio para respirar',
    icon: 'Leaf',
    colorValue: '#256628',
    Icon: Leaf,
  },
  {
    key: 'playa',
    label: 'Sol y playa',
    description: 'Costa, luz y tiempo junto al mar',
    icon: 'Waves',
    colorValue: '#006b63',
    Icon: Waves,
  },
  {
    key: 'rural',
    label: 'Rural',
    description: 'Pueblos, caminos y ritmo pausado',
    icon: 'Wheat',
    colorValue: '#6d4c41',
    Icon: Wheat,
  },
  {
    key: 'montana',
    label: 'Montaña',
    description: 'Altura, senderos y aire abierto',
    icon: 'Mountain',
    colorValue: '#4b4db0',
    Icon: Mountain,
  },
  {
    key: 'patrimonial',
    label: 'Patrimonial',
    description: 'Historia que todavía se recorre',
    icon: 'Castle',
    colorValue: '#8c1046',
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

export function tourismDefinition(
  value?: string | null,
  catalog: TourismType[] = [],
): TourismDefinition {
  const firstValue = tourismValues(value)[0] || '';
  const normalized = normalizedTourismKey(firstValue);
  const catalogType = catalog.find(
    (type) => normalizedTourismKey(type.name) === normalizedTourismKey(firstValue),
  );
  if (catalogType) {
    return {
      key: catalogType.colorKey,
      label: catalogType.name,
      description: catalogType.description,
      icon: catalogType.icon,
      colorValue: catalogType.colorValue,
      Icon: tourismIconRegistry[catalogType.icon] || Compass,
    };
  }
  return (
    tourismTypes.find((item) => normalized.includes(normalizedTourismKey(item.label))) || {
      key: 'otro',
      label: firstValue || 'Otros viajes',
      description: 'Una forma distinta de descubrir',
      icon: 'Compass',
      colorValue: '#5f6470',
      Icon: Compass,
    }
  );
}

export function tourismColorStyle(colorValue: string): CSSProperties {
  const normalized = /^#[0-9a-f]{6}$/i.test(colorValue) ? colorValue : '#5f6470';
  const red = Number.parseInt(normalized.slice(1, 3), 16) / 255;
  const green = Number.parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = Number.parseInt(normalized.slice(5, 7), 16) / 255;
  const channel = (value: number) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  const luminance = 0.2126 * channel(red) + 0.7152 * channel(green) + 0.0722 * channel(blue);
  const ink = luminance > 0.179 ? '#111217' : '#ffffff';
  return {
    '--tourism-custom': normalized,
    '--tourism-custom-ink': ink,
  } as CSSProperties;
}

export function TourismMark({
  value,
  compact = false,
}: {
  value?: string | null;
  compact?: boolean;
}) {
  const { tourismTypes: catalog } = useTourismTypes();
  const type = tourismDefinition(value, catalog);
  const extraCount = Math.max(0, tourismValues(value).length - 1);
  return (
    <span
      className={`tourism-mark tourism--${type.key} ${compact ? 'tourism-mark--compact' : ''}`}
      style={tourismColorStyle(type.colorValue)}
    >
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
