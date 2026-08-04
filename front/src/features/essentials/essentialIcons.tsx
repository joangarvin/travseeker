import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';
import {
  Bike,
  Binoculars,
  Building2,
  Camera,
  Castle,
  Compass,
  Footprints,
  Landmark,
  MapPin,
  Mountain,
  Music,
  Palette,
  Sailboat,
  Sun,
  TreePine,
  Trees,
  Utensils,
  Waves,
  Wine,
} from 'lucide-react';

export const essentialIconChoices = [
  ['Compass', 'Exploración'],
  ['Landmark', 'Patrimonio'],
  ['Trees', 'Naturaleza'],
  ['Waves', 'Costa y agua'],
  ['Footprints', 'Paseos y senderos'],
  ['Utensils', 'Gastronomía'],
  ['Mountain', 'Montaña y miradores'],
  ['Palette', 'Arte y museos'],
  ['Building2', 'Ciudad'],
  ['Camera', 'Fotografía'],
  ['Castle', 'Castillos'],
  ['MapPin', 'Lugar destacado'],
  ['Binoculars', 'Observación'],
  ['Bike', 'Ciclismo'],
  ['Sailboat', 'Navegación'],
  ['Music', 'Música'],
  ['Wine', 'Vino'],
  ['Sun', 'Aire libre'],
  ['TreePine', 'Bosque'],
] as const;

export type EssentialIconName = (typeof essentialIconChoices)[number][0];

export const essentialIconRegistry: Record<EssentialIconName, LucideIcon> = {
  Compass,
  Landmark,
  Trees,
  Waves,
  Footprints,
  Utensils,
  Mountain,
  Palette,
  Building2,
  Camera,
  Castle,
  MapPin,
  Binoculars,
  Bike,
  Sailboat,
  Music,
  Wine,
  Sun,
  TreePine,
};

function normalizedKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

export function inferEssentialIcon(value: string): EssentialIconName {
  const title = normalizedKey(value);
  if (/(cultur|histor|patrimon)/.test(title)) return 'Landmark';
  if (/(natur|parque|bosque)/.test(title)) return 'Trees';
  if (/(mar|playa|costa)/.test(title)) return 'Waves';
  if (/(sender|ruta|camino)/.test(title)) return 'Footprints';
  if (/(gastronom|comer|sabor)/.test(title)) return 'Utensils';
  if (/(montan|mirador|cumbre)/.test(title)) return 'Mountain';
  if (/(arte|museo)/.test(title)) return 'Palette';
  return 'Compass';
}

export function essentialIcon(icon?: string | null): LucideIcon {
  return essentialIconRegistry[icon as EssentialIconName] || Compass;
}

export function EssentialIconGlyph({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  return createElement(essentialIcon(name), { className, 'aria-hidden': true });
}
