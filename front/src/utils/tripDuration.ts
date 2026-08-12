import type { ItineraryDay } from '../types';

const DAY_MS = 86_400_000;

function isoDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const candidate = value.slice(0, 10);
  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? undefined : candidate;
}

export function addTripDays(date: string, amount: number): string {
  const parsed = new Date(`${date.slice(0, 10)}T00:00:00.000Z`);
  parsed.setUTCDate(parsed.getUTCDate() + amount);
  return parsed.toISOString().slice(0, 10);
}

export type TripDuration = {
  days: number;
  nights: number;
  source: 'dates' | 'itinerary' | 'destinations' | 'fallback';
};

export function getTripDuration({
  startDate,
  endDate,
  itineraryLength = 0,
  destinationCount = 0,
}: {
  startDate?: string | null;
  endDate?: string | null;
  itineraryLength?: number;
  destinationCount?: number;
}): TripDuration {
  const start = isoDate(startDate);
  const end = isoDate(endDate);
  if (start && end) {
    const days = Math.max(1, Math.floor((Date.parse(`${end}T00:00:00.000Z`) - Date.parse(`${start}T00:00:00.000Z`)) / DAY_MS) + 1);
    return { days, nights: Math.max(0, days - 1), source: 'dates' };
  }
  if (itineraryLength > 0) return { days: itineraryLength, nights: Math.max(0, itineraryLength - 1), source: 'itinerary' };
  if (destinationCount > 0) return { days: destinationCount, nights: Math.max(0, destinationCount - 1), source: 'destinations' };
  return { days: 1, nights: 0, source: 'fallback' };
}

export function alignItineraryToDates(
  itinerary: ItineraryDay[],
  startDate?: string | null,
  endDate?: string | null,
): ItineraryDay[] {
  const start = isoDate(startDate);
  const duration = getTripDuration({ startDate, endDate, itineraryLength: itinerary.length });
  if (!itinerary.length) return itinerary;

  const aligned = itinerary.slice(0, duration.days);
  while (aligned.length < duration.days) {
    const previous = aligned[aligned.length - 1];
    aligned.push({
      dayNumber: aligned.length + 1,
      destinationId: previous.destinationId,
      baseMunicipioId: previous.baseMunicipioId,
      plannedActivities: [],
    });
  }

  return aligned.map((day, index) => ({
    ...day,
    dayNumber: index + 1,
    ...(start ? { date: addTripDays(start, index) } : {}),
  }));
}
