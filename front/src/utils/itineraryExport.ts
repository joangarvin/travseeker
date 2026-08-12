import type { CollectionDetail, ItineraryDay } from '../types';

type ExportableCollection = Pick<
  CollectionDetail,
  'nombre' | 'descripcion' | 'startDate' | 'items' | 'itinerary'
>;

function compactDate(value: string): string {
  return value.replaceAll('-', '');
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function resolveItineraryDate(
  day: ItineraryDay,
  collection: Pick<CollectionDetail, 'startDate'>,
): string | undefined {
  if (day.date) return day.date;
  if (!collection.startDate) return undefined;
  return addDays(collection.startDate.slice(0, 10), day.dayNumber - 1);
}

function destinationName(day: ItineraryDay, collection: ExportableCollection): string {
  return (
    collection.items.find((item) => item.destino.id === day.destinationId)?.destino.nombre ||
    'Destino'
  );
}

function dayDetails(day: ItineraryDay, collection: ExportableCollection): string {
  const lines = [collection.descripcion, day.notes];
  if (day.plannedActivities?.length) {
    const destination = collection.items.find(
      (item) => item.destino.id === day.destinationId,
    )?.destino;
    const activities = day.plannedActivities.map(
      (value) => destination?.activities?.find((activity) => activity.id === value)?.name || value,
    );
    lines.push(`Actividades: ${activities.join(', ')}`);
  }
  return lines.filter(Boolean).join('\n');
}

export function generateGoogleCalendarUrl(
  day: ItineraryDay,
  collection: ExportableCollection,
): string {
  const date = resolveItineraryDate(day, collection);
  const parameters = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${collection.nombre} · Día ${day.dayNumber}: ${destinationName(day, collection)}`,
    details: dayDetails(day, collection),
  });
  if (date) parameters.set('dates', `${compactDate(date)}/${compactDate(addDays(date, 1))}`);
  return `https://calendar.google.com/calendar/render?${parameters.toString()}`;
}

function escapeICal(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll('\n', '\\n')
    .replaceAll(',', '\\,')
    .replaceAll(';', '\\;');
}

export function generateICalContent(collection: ExportableCollection): string {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const events = collection.itinerary.flatMap((day) => {
    const date = resolveItineraryDate(day, collection);
    if (!date) return [];
    const title = `${collection.nombre} · Día ${day.dayNumber}: ${destinationName(day, collection)}`;
    return [
      'BEGIN:VEVENT',
      `UID:${day.dayNumber}-${compactDate(date)}@travseeker`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compactDate(date)}`,
      `DTEND;VALUE=DATE:${compactDate(addDays(date, 1))}`,
      `SUMMARY:${escapeICal(title)}`,
      `DESCRIPTION:${escapeICal(dayDetails(day, collection))}`,
      'END:VEVENT',
    ].join('\r\n');
  });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TravSeeker//Itinerary//ES',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}

export function downloadICalFile(collection: ExportableCollection): boolean {
  if (!collection.itinerary.some((day) => resolveItineraryDate(day, collection))) return false;
  const blob = new Blob([generateICalContent(collection)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${collection.nombre.toLocaleLowerCase('es').replace(/[^a-z0-9]+/gi, '-') || 'viaje'}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}
