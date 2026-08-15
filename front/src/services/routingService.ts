import type { Destino } from '../types';

export type Coordinates = {
  latitud: number;
  longitud: number;
};

export type RouteSegment = {
  distanceKm?: number;
  durationMinutes?: number;
  source: 'osrm' | 'haversine' | 'unavailable';
};

const memoryCache = new Map<string, RouteSegment>();
const CACHE_PREFIX = 'travseeker:route:';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedRouteSegment = {
  value: RouteSegment;
  cachedAt: number;
};

type CoordinateCandidate = {
  latitud?: number | null;
  longitud?: number | null;
};

function validCoordinates(value?: CoordinateCandidate | null): value is Coordinates {
  return (
    typeof value?.latitud === 'number' &&
    Number.isFinite(value.latitud) &&
    Math.abs(value.latitud) <= 90 &&
    typeof value.longitud === 'number' &&
    Number.isFinite(value.longitud) &&
    Math.abs(value.longitud) <= 180
  );
}

export function resolveRouteCoordinates(
  destination?: Destino,
  baseMunicipioId?: string,
): Coordinates | undefined {
  const municipio = destination?.municipios?.find((item) => item.id === baseMunicipioId);
  if (validCoordinates(municipio)) {
    return { latitud: municipio.latitud, longitud: municipio.longitud };
  }
  if (validCoordinates(destination)) {
    return { latitud: destination.latitud, longitud: destination.longitud };
  }
  return undefined;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistance(from: Coordinates, to: Coordinates): number {
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(to.latitud - from.latitud);
  const longitudeDelta = toRadians(to.longitud - from.longitud);
  const fromLatitude = toRadians(from.latitud);
  const toLatitude = toRadians(to.latitud);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fallbackSegment(from: Coordinates, to: Coordinates): RouteSegment {
  return {
    distanceKm: haversineDistance(from, to),
    source: 'haversine',
  };
}

function cacheKey(from: Coordinates, to: Coordinates): string {
  return [from.longitud, from.latitud, to.longitud, to.latitud]
    .map((value) => value.toFixed(5))
    .join(':');
}

function readCache(key: string): RouteSegment | undefined {
  const inMemory = memoryCache.get(key);
  if (inMemory) return inMemory;
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return undefined;
    const parsed = JSON.parse(cached) as CachedRouteSegment | RouteSegment;
    if ('cachedAt' in parsed && 'value' in parsed) {
      if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`);
        return undefined;
      }
      memoryCache.set(key, parsed.value);
      return parsed.value;
    }
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
    return undefined;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, value: RouteSegment): void {
  memoryCache.set(key, value);
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify({ value, cachedAt: Date.now() } satisfies CachedRouteSegment));
  } catch {
    // The in-memory cache still prevents duplicate requests for this session.
  }
}

export async function calculateRouteSegment(
  from?: Coordinates,
  to?: Coordinates,
): Promise<RouteSegment> {
  if (!from || !to) return { source: 'unavailable' };
  const key = cacheKey(from, to);
  const cached = readCache(key);
  if (cached) return cached;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6500);
  try {
    const coordinates = `${from.longitud},${from.latitud};${to.longitud},${to.latitud}`;
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`,
      { signal: controller.signal },
    );
    if (!response.ok) throw new Error('OSRM unavailable');
    const data = (await response.json()) as {
      code?: string;
      routes?: Array<{ distance?: number; duration?: number }>;
    };
    const route = data.routes?.[0];
    if (data.code !== 'Ok' || !route?.distance || !route.duration)
      throw new Error('Route unavailable');
    const segment: RouteSegment = {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      source: 'osrm',
    };
    writeCache(key, segment);
    return segment;
  } catch {
    const segment = fallbackSegment(from, to);
    writeCache(key, segment);
    return segment;
  } finally {
    window.clearTimeout(timeout);
  }
}
