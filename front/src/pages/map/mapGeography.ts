import type { Destino } from '../../types';

export const COUNTRY_ZOOM_MAX = 4;
export function groupMapDestinations(destinations: Destino[], zoom: number) {
  const buckets = new Map<string, Destino[]>();
  for (const destination of destinations) {
    const { latitud, longitud } = destination;
    if (
      latitud == null ||
      longitud == null ||
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud) ||
      Math.abs(latitud) > 90 ||
      Math.abs(longitud) > 180
    )
      continue;
    const key =
      zoom <= COUNTRY_ZOOM_MAX
        ? destination.countryCode || `unknown-${destination.id}`
        : destination.id;
    const items = buckets.get(key) || [];
    items.push(destination);
    buckets.set(key, items);
  }
  return [...buckets].map(([key, items]) => ({
    key,
    items,
    lat: items.reduce((sum, d) => sum + d.latitud!, 0) / items.length,
    lng: items.reduce((sum, d) => sum + d.longitud!, 0) / items.length,
  }));
}
