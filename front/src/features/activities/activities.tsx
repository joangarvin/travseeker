import type { LucideIcon } from 'lucide-react';
import {
  Bike,
  Binoculars,
  Bird,
  Camera,
  Compass,
  Dumbbell,
  Fish,
  Footprints,
  HeartPulse,
  Landmark,
  MountainSnow,
  Music,
  PartyPopper,
  Route,
  Sailboat,
  ShipWheel,
  Snowflake,
  Sun,
  Telescope,
  TentTree,
  Trees,
  Utensils,
  Waves,
  Wine,
} from 'lucide-react';
import { useActivities } from '../../contexts';
import type { Activity } from '../../types';
import { parseTagValues, serializeTagValues, tagQueryValue } from '../../utils/tags';
import { isTourismValue } from '../tourism/tourism';

export type ActivityDefinition = {
  key: string;
  label: string;
  icon: string;
  Icon: LucideIcon;
};

export const activityIconRegistry: Record<string, LucideIcon> = {
  Compass,
  Binoculars,
  Telescope,
  Waves,
  Utensils,
  Footprints,
  PartyPopper,
  HeartPulse,
  Bike,
  Camera,
  Sailboat,
  MountainSnow,
  Trees,
  Bird,
  Fish,
  Dumbbell,
  Music,
  Landmark,
  TentTree,
  Snowflake,
  Sun,
  Wine,
  ShipWheel,
  Route,
};

export const activityIconChoices = [
  ['Compass', 'Aventura'],
  ['Binoculars', 'Observación'],
  ['Telescope', 'Astronomía'],
  ['Waves', 'Agua'],
  ['Utensils', 'Gastronomía'],
  ['Footprints', 'Senderismo'],
  ['PartyPopper', 'Ocio'],
  ['HeartPulse', 'Bienestar'],
  ['Bike', 'Ciclismo'],
  ['Camera', 'Fotografía'],
  ['Sailboat', 'Navegación'],
  ['MountainSnow', 'Montaña'],
  ['Trees', 'Bosque'],
  ['Bird', 'Aves'],
  ['Fish', 'Pesca'],
  ['Dumbbell', 'Deporte'],
  ['Music', 'Música'],
  ['Landmark', 'Patrimonio'],
  ['TentTree', 'Acampada'],
  ['Snowflake', 'Nieve'],
  ['Sun', 'Sol'],
  ['Wine', 'Enoturismo'],
  ['ShipWheel', 'Mar'],
  ['Route', 'Rutas'],
] as const;

export const activityTypes: ActivityDefinition[] = [
  { key: 'aventura', label: 'Aventura', icon: 'Compass', Icon: Compass },
  { key: 'fauna', label: 'Observación de fauna', icon: 'Binoculars', Icon: Binoculars },
  { key: 'astronomia', label: 'Observación astronómica', icon: 'Telescope', Icon: Telescope },
  { key: 'acuaticos', label: 'Deportes acuáticos', icon: 'Waves', Icon: Waves },
  { key: 'gastronomia', label: 'Gastronomía', icon: 'Utensils', Icon: Utensils },
  { key: 'senderismo', label: 'Senderismo', icon: 'Footprints', Icon: Footprints },
  { key: 'ocio', label: 'Ocio', icon: 'PartyPopper', Icon: PartyPopper },
  { key: 'bienestar', label: 'Relax y bienestar', icon: 'HeartPulse', Icon: HeartPulse },
];

const activityAliases: Record<string, string> = {
  animales: 'Observación de fauna',
  astronomico: 'Observación astronómica',
  astronomia: 'Observación astronómica',
  'deportes aquaticos': 'Deportes acuáticos',
  gastronomico: 'Gastronomía',
  relax: 'Relax y bienestar',
};

function normalizedKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

export function normalizeActivity(value: string) {
  const trimmedValue = value.trim();
  const key = normalizedKey(trimmedValue);
  return (
    activityAliases[key] ||
    activityTypes.find((activity) => normalizedKey(activity.label) === key)?.label ||
    trimmedValue
  );
}

export function activityValues(value?: string | string[] | null) {
  return [
    ...new Set(
      parseTagValues(value)
        .filter((item) => !isTourismValue(item))
        .map(normalizeActivity)
        .filter(Boolean),
    ),
  ];
}

export function serializeActivityValues(values: string[]) {
  return serializeTagValues(activityValues(values));
}

export function activityQueryValue(values: string[]) {
  return tagQueryValue(activityValues(values));
}

export function activityDefinition(value: string, catalog: Activity[] = []): ActivityDefinition {
  const normalizedValue = normalizeActivity(value);
  const catalogActivity = catalog.find(
    (activity) => normalizedKey(activity.name) === normalizedKey(normalizedValue),
  );
  if (catalogActivity) {
    return {
      key: catalogActivity.slug,
      label: catalogActivity.name,
      icon: catalogActivity.icon,
      Icon: activityIconRegistry[catalogActivity.icon] || Compass,
    };
  }
  return (
    activityTypes.find((activity) => activity.label === normalizedValue) || {
      key: 'otra',
      label: normalizedValue,
      icon: 'Compass',
      Icon: Compass,
    }
  );
}

export function ActivityMarks({ value }: { value?: string | null }) {
  const { activities } = useActivities();
  const values = activityValues(value);
  if (!values.length) return <span>—</span>;

  return (
    <span className="activity-marks">
      {values.map((value) => {
        const activity = activityDefinition(value, activities);
        return (
          <span className="activity-mark" key={value}>
            <activity.Icon aria-hidden />
            <span>{activity.label}</span>
          </span>
        );
      })}
    </span>
  );
}
