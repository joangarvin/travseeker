import type { CollectionDetail, ItineraryDay } from '../../types';

/** Keep the original indices, including a later return to the same destination. */
export function destinationDays(days: ItineraryDay[], destinationId: string) {
  return days
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => day.destinationId === destinationId);
}

/** Mirror the DELETE endpoint: remove only this stop and renumber remaining days. */
export function withoutDestination(
  collection: CollectionDetail,
  destinationId: string,
): CollectionDetail {
  const items = collection.items.filter((item) => item.destino.id !== destinationId);
  const itinerary = collection.itinerary
    .filter((day) => day.destinationId !== destinationId)
    .map((day, index) => ({ ...day, dayNumber: index + 1 }));
  return {
    ...collection,
    items,
    itinerary,
    count: items.length,
    itineraryDays: itinerary.length,
    covers: items.map((item) => item.destino.imagen).filter(Boolean),
  };
}
