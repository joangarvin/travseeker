import { useEffect, useMemo, useState } from 'react';
import { useConsent } from '../../privacy/CookieConsent';
import {
  calculateRouteSegment,
  resolveRouteCoordinates,
  type RouteSegment,
} from '../../../services/routingService';
import type { CollectionDetail, ItineraryDay } from '../../../types';
import { destinationFor } from '../itineraryModel';

export function useItineraryRoutes(collection: CollectionDetail, days: ItineraryDay[]) {
  const { maps } = useConsent();
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const routeSignature = days
    .map((day) => `${day.destinationId}:${day.baseMunicipioId || ''}`)
    .join('|');

  useEffect(() => {
    let active = true;
    if (days.length < 2) {
      setSegments([]);
      setRoutesLoading(false);
      return;
    }
    setRoutesLoading(true);
    const coordinates = days.map((day) =>
      resolveRouteCoordinates(destinationFor(collection, day.destinationId), day.baseMunicipioId),
    );
    void Promise.all(
      coordinates
        .slice(0, -1)
        .map((coordinatesFrom, index) =>
          calculateRouteSegment(coordinatesFrom, coordinates[index + 1]),
        ),
    ).then((result) => {
      if (!active) return;
      setSegments(result);
      setRoutesLoading(false);
    });
    return () => {
      active = false;
    };
  }, [collection, routeSignature, maps]);

  const totalDistance = useMemo(
    () => segments.reduce((total, segment) => total + (segment.distanceKm || 0), 0),
    [segments],
  );
  const totalDuration = useMemo(
    () => segments.reduce((total, segment) => total + (segment.durationMinutes || 0), 0),
    [segments],
  );
  const exactRouteCount = segments.filter((segment) => segment.source === 'osrm').length;
  const fallbackRouteCount = segments.filter((segment) => segment.source === 'haversine').length;
  const unavailableRouteCount = segments.filter(
    (segment) => segment.source === 'unavailable',
  ).length;
  const hasPartialRoute = fallbackRouteCount > 0 || unavailableRouteCount > 0;
  return {
    segments,
    routesLoading,
    totalDistance,
    totalDuration,
    exactRouteCount,
    fallbackRouteCount,
    unavailableRouteCount,
    hasPartialRoute,
  };
}
