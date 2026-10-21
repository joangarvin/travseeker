import type { ItineraryDay } from '../../types';

/** Keep separate visits to the same destination separate, retaining real day indices. */
export function groupOverviewStays(days: ItineraryDay[]) {
  const stays: {
    destinationId: string;
    startIndex: number;
    endIndex: number;
    days: ItineraryDay[];
  }[] = [];
  days.forEach((day, index) => {
    const previous = stays.at(-1);
    if (previous?.destinationId === day.destinationId) {
      previous.endIndex = index;
      previous.days.push(day);
    } else {
      stays.push({
        destinationId: day.destinationId,
        startIndex: index,
        endIndex: index,
        days: [day],
      });
    }
  });
  return stays;
}
