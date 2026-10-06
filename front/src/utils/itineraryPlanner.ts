import type { Destino, ItineraryDay } from '../types';

type Point = { latitud: number; longitud: number };
function point(value?: { latitud?: number | null; longitud?: number | null }): Point | undefined {
  const { latitud, longitud } = value || {};
  return typeof latitud === 'number' &&
    Number.isFinite(latitud) &&
    Math.abs(latitud) <= 90 &&
    typeof longitud === 'number' &&
    Number.isFinite(longitud) &&
    Math.abs(longitud) <= 180
    ? { latitud, longitud }
    : undefined;
}
function coordinates(day: ItineraryDay, destinations: Destino[]): Point | undefined {
  const destination = destinations.find((item) => item.id === day.destinationId);
  return (
    point(destination?.municipios?.find((item) => item.id === day.baseMunicipioId)) ||
    point(destination)
  );
}
function distance(a: Point, b: Point): number {
  const radians = Math.PI / 180;
  const h =
    Math.sin(((b.latitud - a.latitud) * radians) / 2) ** 2 +
    Math.cos(a.latitud * radians) *
      Math.cos(b.latitud * radians) *
      Math.sin(((b.longitud - a.longitud) * radians) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, h)));
}
export function itineraryDistance(
  days: ItineraryDay[],
  destinations: Destino[],
): number | undefined {
  const points = days.map((day) => coordinates(day, destinations));
  if (points.some((item) => !item)) return undefined;
  return points.slice(1).reduce((total, item, index) => total + distance(points[index]!, item!), 0);
}

/** Keep each consecutive stay intact, the departure fixed, and all day content attached. */
export function optimizeItinerary(days: ItineraryDay[], destinations: Destino[]): ItineraryDay[] {
  if (days.length < 3 || itineraryDistance(days, destinations) === undefined) return [...days];
  const blocks: ItineraryDay[][] = [];
  for (const day of days) {
    const previous = blocks.at(-1)?.at(-1);
    if (
      previous?.destinationId === day.destinationId &&
      previous.baseMunicipioId === day.baseMunicipioId
    )
      blocks.at(-1)!.push(day);
    else blocks.push([day]);
  }
  if (blocks.length < 3) return [...days];
  const points = new Map(blocks.map((block) => [block, coordinates(block[0], destinations)!]));
  const remaining = blocks.slice(1);
  const ordered = [blocks[0]];
  while (remaining.length) {
    const from = points.get(ordered.at(-1)!)!;
    let nearest = 0;
    remaining.forEach((block, index) => {
      if (distance(from, points.get(block)!) < distance(from, points.get(remaining[nearest])!))
        nearest = index;
    });
    ordered.push(remaining.splice(nearest, 1)[0]);
  }
  const cost = (route: ItineraryDay[][]) =>
    route
      .slice(1)
      .reduce(
        (total, block, index) => total + distance(points.get(route[index])!, points.get(block)!),
        0,
      );
  // A greedy route can miss a better arrangement; improve it without moving the departure.
  let route = cost(ordered) < cost(blocks) ? ordered : blocks;
  let best = cost(route);
  for (let pass = 0; pass < (blocks.length <= 60 ? 20 : 0); pass++) {
    let improved = false;
    for (let from = 1; from < route.length - 1; from++) {
      for (let to = from + 1; to < route.length; to++) {
        const candidate = [
          ...route.slice(0, from),
          ...route.slice(from, to + 1).reverse(),
          ...route.slice(to + 1),
        ];
        const next = cost(candidate);
        if (next < best - 0.001) {
          route = candidate;
          best = next;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return route.flat();
}

/** Every destination gets a consecutive stay; short trips grow instead of dropping stops. */
export function planItinerary(destinations: Destino[], requestedDays: number): ItineraryDay[] {
  const unique = destinations.filter(
    (item, index) => destinations.findIndex((other) => other.id === item.id) === index,
  );
  if (!unique.length) return [];
  const count = Math.min(366, Math.max(unique.length, Math.floor(requestedDays) || unique.length));
  const stops = optimizeItinerary(
    unique.map((destination, index) => ({
      dayNumber: index + 1,
      destinationId: destination.id,
      baseMunicipioId: destination.municipios?.[0]?.id,
      plannedActivities: [],
    })),
    unique,
  );
  return stops
    .flatMap((stop, index) =>
      Array.from(
        {
          length: Math.floor(count / stops.length) + (index < count % stops.length ? 1 : 0),
        },
        () => ({ ...stop, plannedActivities: [] }),
      ),
    )
    .map((day, index) => ({ ...day, dayNumber: index + 1 }));
}
