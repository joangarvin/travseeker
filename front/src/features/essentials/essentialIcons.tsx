import { t } from '../../i18n';
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
  ['Compass', t('Exploración')],
  ['Landmark', t('Patrimonio')],
  ['Trees', 'Naturaleza'],
  ['Waves', t('Costa y agua')],
  ['Footprints', t('Paseos y senderos')],
  ['Utensils', 'Gastronomía'],
  ['Mountain', t('Montaña y miradores')],
  ['Palette', t('Arte y museos')],
  ['Building2', t('Ciudad')],
  ['Camera', t('Fotografía')],
  ['Castle', t('Castillos')],
  ['MapPin', t('Lugar destacado')],
  ['Binoculars', t('Observación')],
  ['Bike', t('Ciclismo')],
  ['Sailboat', t('Navegación')],
  ['Music', t('Música')],
  ['Wine', t('Vino')],
  ['Sun', t('Aire libre')],
  ['TreePine', t('Bosque')],
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
