import type { Destino } from '../../types';

export const COUNTRY_ZOOM_MAX = 4;
export function mapCountryCode(destination: Pick<Destino, 'countryCode' | 'country'>) {
  return (destination.countryCode?.trim() || destination.country?.code?.trim() || '').toUpperCase();
}
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
      zoom <= COUNTRY_ZOOM_MAX ? mapCountryCode(destination) || 'unknown' : destination.id;
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

// Screen-space proximity keeps neighbouring photo pins usable without merging countries.
export function clusterMapDestinations(
  destinations: Destino[],
  project: (lat: number, lng: number) => { x: number; y: number },
  radius: number,
  selectedId: string | null,
) {
  const groups: {
    key: string;
    items: Destino[];
    lat: number;
    lng: number;
    x: number;
    y: number;
  }[] = [];
  for (const single of groupMapDestinations(destinations, COUNTRY_ZOOM_MAX + 1)) {
    const d = single.items[0],
      position = project(single.lat, single.lng);
    const group =
      radius > 0 && d.id !== selectedId
        ? groups.find(
            (g) =>
              g.items[0].id !== selectedId &&
              mapCountryCode(g.items[0]) === mapCountryCode(d) &&
              Math.hypot(g.x - position.x, g.y - position.y) < radius,
          )
        : undefined;
    if (group) {
      group.items.push(d);
      group.lat = group.items.reduce((n, item) => n + item.latitud!, 0) / group.items.length;
      group.lng = group.items.reduce((n, item) => n + item.longitud!, 0) / group.items.length;
    } else groups.push({ ...single, ...position });
  }
  return groups;
}
