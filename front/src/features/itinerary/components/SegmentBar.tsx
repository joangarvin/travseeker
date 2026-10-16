import { CarFront, MapPin } from 'lucide-react';
import { t } from '../../../i18n';
import type { RouteSegment } from '../../../services/routingService';
import { formatDuration } from '../itineraryPresentation';

export function SegmentBar({ segment, loading }: { segment?: RouteSegment; loading: boolean }) {
  if (loading) {
    return (
      <div className="route-segment route-segment--loading" role="status">
        {t('Calculando siguiente trayecto…')}
      </div>
    );
  }
  if (segment?.source === 'stay')
    return (
      <div className="route-segment">
        <MapPin /> {t('Misma base · sin traslado entre días')}
      </div>
    );
  if (!segment || segment.source === 'unavailable') {
    return (
      <div className="route-segment route-segment--unavailable">
        <CarFront /> {t('Trayecto sin calcular · faltan coordenadas')}
      </div>
    );
  }
  return (
    <div className={`route-segment route-segment--${segment.source}`}>
      <CarFront />
      <span>
        {segment.source === 'osrm' ? (
          <>
            {t('En coche ·')} <b>{Math.round(segment.distanceKm || 0)} km</b> ·{' '}
            {formatDuration(segment.durationMinutes)}
          </>
        ) : (
          <>
            {t('En línea recta ·')} <b>≈{Math.round(segment.distanceKm || 0)} km</b>{' '}
            {t('· tiempo no disponible')}
          </>
        )}
      </span>
    </div>
  );
}
