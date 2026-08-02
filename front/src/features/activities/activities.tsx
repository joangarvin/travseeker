import type { LucideIcon } from 'lucide-react';
import {
  Binoculars,
  Compass,
  Footprints,
  HeartPulse,
  PartyPopper,
  Telescope,
  Utensils,
  Waves,
} from 'lucide-react';
import { parseTagValues, serializeTagValues, tagQueryValue } from '../../utils/tags';
import { isTourismValue } from '../tourism/tourism';

export type ActivityDefinition = {
  key: string;
  label: string;
  Icon: LucideIcon;
};

export const activityTypes: ActivityDefinition[] = [
  { key: 'aventura', label: 'Aventura', Icon: Compass },
  { key: 'fauna', label: 'Observación de fauna', Icon: Binoculars },
  { key: 'astronomia', label: 'Observación astronómica', Icon: Telescope },
  { key: 'acuaticos', label: 'Deportes acuáticos', Icon: Waves },
  { key: 'gastronomia', label: 'Gastronomía', Icon: Utensils },
  { key: 'senderismo', label: 'Senderismo', Icon: Footprints },
  { key: 'ocio', label: 'Ocio', Icon: PartyPopper },
  { key: 'bienestar', label: 'Relax y bienestar', Icon: HeartPulse },
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

export function activityDefinition(value: string): ActivityDefinition {
  const normalizedValue = normalizeActivity(value);
  return (
    activityTypes.find((activity) => activity.label === normalizedValue) || {
      key: 'otra',
      label: normalizedValue,
      Icon: Compass,
    }
  );
}

export function ActivityMarks({ value }: { value?: string | null }) {
  const values = activityValues(value);
  if (!values.length) return <span>—</span>;

  return (
    <span className="activity-marks">
      {values.map((value) => {
        const activity = activityDefinition(value);
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
