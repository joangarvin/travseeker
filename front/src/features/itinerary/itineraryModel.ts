import type { CollectionDetail, Destino, ItineraryDay } from '../../types';
import { addTripDays, getTripDuration } from '../../utils/tripDuration';
import { planItinerary } from '../../utils/itineraryPlanner';

export function isoDate(value: string | null | undefined): string | undefined {
  return value?.slice(0, 10) || undefined;
}

export function normalizeDays(days: ItineraryDay[], startDate?: string | null): ItineraryDay[] {
  const start = isoDate(startDate);
  return days.map((day, index) => ({
    ...day,
    dayNumber: index + 1,
    date: start ? addTripDays(start, index) : day.date,
  }));
}

export function generateItinerary(collection: CollectionDetail): ItineraryDay[] {
  if (!collection.items.length) return [];
  const count = getTripDuration({
    startDate: collection.startDate,
    endDate: collection.endDate,
    destinationCount: collection.items.length,
  }).days;
  return normalizeDays(
    planItinerary(
      collection.items.map((item) => item.destino),
      count,
    ),
    collection.startDate,
  );
}

export function destinationFor(collection: CollectionDetail, id: string): Destino | undefined {
  return collection.items.find((item) => item.destino.id === id)?.destino;
}
