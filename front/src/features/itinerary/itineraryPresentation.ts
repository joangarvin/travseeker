import { t, intlLocale, catalogName } from '../../i18n';
import type { Destino } from '../../types';
import { plannedActivityLabel, tripActivityCatalog } from '../../utils/plannedActivities';

export function formatDayDate(value?: string): string {
  if (!value) return t('Fecha abierta');
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

export function formatDuration(minutes?: number): string {
  if (minutes === undefined) return '';
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) return `~${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `~${hours} h${remainder ? ` ${remainder} min` : ''}`;
}

export function activityName(destination: Destino | undefined, value: string): string {
  return plannedActivityLabel(value, tripActivityCatalog(destination), (item) => catalogName(item));
}
