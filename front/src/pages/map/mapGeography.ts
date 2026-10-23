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
  const cells = new Map<string, number[]>();
  for (const single of groupMapDestinations(destinations, COUNTRY_ZOOM_MAX + 1)) {
    const d = single.items[0],
      position = project(single.lat, single.lng),
      country = mapCountryCode(d);
    const cellX = radius > 0 ? Math.floor(position.x / radius) : 0,
      cellY = radius > 0 ? Math.floor(position.y / radius) : 0;
    let target = -1;
    if (radius > 0 && d.id !== selectedId) {
      for (let dx = -1; dx <= 1; dx++)
        for (let dy = -1; dy <= 1; dy++) {
          for (const index of cells.get(`${country}:${cellX + dx}:${cellY + dy}`) || []) {
            const g = groups[index];
            if (
              (target < 0 || index < target) &&
              Math.hypot(g.x - position.x, g.y - position.y) < radius
            )
              target = index;
          }
        }
    }
    if (target >= 0) {
      const group = groups[target],
        count = group.items.length;
      group.lat = (group.lat * count + single.lat) / (count + 1);
      group.lng = (group.lng * count + single.lng) / (count + 1);
      group.items.push(d);
    } else {
      const index = groups.push({ ...single, ...position }) - 1;
      if (radius > 0 && d.id !== selectedId) {
        const key = `${country}:${cellX}:${cellY}`;
        const bucket = cells.get(key) || [];
        bucket.push(index);
        cells.set(key, bucket);
      }
    }
  }
  return groups;
}
