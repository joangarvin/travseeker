import type { LucideIcon } from 'lucide-react';
import { Castle, Compass, Landmark, Leaf, Mountain, Waves, Wheat } from 'lucide-react';

export type TourismKind = 'cultural' | 'naturaleza' | 'playa' | 'rural' | 'montana' | 'patrimonial' | 'otro';

export type TourismDefinition = {
  key: TourismKind;
  label: string;
  description: string;
  Icon: LucideIcon;
};

export const tourismTypes: TourismDefinition[] = [
  { key: 'cultural', label: 'Cultural', description: 'Ideas, arte y vida local', Icon: Landmark },
  { key: 'naturaleza', label: 'Naturaleza', description: 'Paisajes con espacio para respirar', Icon: Leaf },
  { key: 'playa', label: 'Sol y playa', description: 'Costa, luz y tiempo junto al mar', Icon: Waves },
  { key: 'rural', label: 'Rural', description: 'Pueblos, caminos y ritmo pausado', Icon: Wheat },
  { key: 'montana', label: 'Montaña', description: 'Altura, senderos y aire abierto', Icon: Mountain },
  { key: 'patrimonial', label: 'Patrimonial', description: 'Historia que todavía se recorre', Icon: Castle },
];

function clean(value?: string | null) {
  if (!value) return '';
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return String(parsed[0] || '');
    if (typeof parsed === 'string') return parsed;
  } catch { /* plain value */ }
  return value;
}

export function tourismDefinition(value?: string | null): TourismDefinition {
  const normalized = clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return tourismTypes.find((item) => normalized.includes(item.label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase())) ||
    { key: 'otro', label: clean(value) || 'Otros viajes', description: 'Una forma distinta de descubrir', Icon: Compass };
}

export function TourismMark({ value, compact = false }: { value?: string | null; compact?: boolean }) {
  const type = tourismDefinition(value);
  return <span className={`tourism-mark tourism--${type.key} ${compact ? 'tourism-mark--compact' : ''}`}>
    <span className="tourism-mark__symbol" aria-hidden><type.Icon /></span>
    <span className="tourism-mark__label">{type.label}</span>
  </span>;
}
