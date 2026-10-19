import { ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n';
import { TourismMarks } from '../../features/tourism/tourism';
import { plain } from '../../utils';
import type { Destino } from '../../types';

export function MapDestinationDetails({
  destination,
  onClose,
  motionSource,
}: {
  destination: Destino;
  onClose: () => void;
  motionSource: 'pointer' | 'keyboard';
}) {
  return (
    <section
      id={`map-detail-${destination.id}`}
      className="map-detail"
      aria-label={t('Destino seleccionado: {0}', { 0: destination.nombre.trim() })}
      data-motion-trigger={motionSource}
    >
      <header>
        <TourismMarks value={destination.tipoTurismoPrincipal} compact />
        <button type="button" onClick={onClose} aria-label={t('Cerrar ficha')}>
          <X aria-hidden="true" />
        </button>
      </header>
      <h2 className="map-detail__title">{destination.nombre.trim()}</h2>
      <dl>
        <div>
          <dt>{t('Presupuesto')}</dt>
          <dd>{t(plain(destination.presupuesto)) || '—'}</dd>
        </div>
        <div>
          <dt>{t('Afluencia')}</dt>
          <dd>{t(plain(destination.masificacion)) || '—'}</dd>
        </div>
      </dl>
      <Link className="map-detail__open" to={`/destino/${destination.id}`}>
        <span className="map-detail__open-base">
          {t('Ver destino')}
          <ArrowRight aria-hidden="true" />
        </span>
        <span className="map-detail__open-fill" aria-hidden="true">
          {t('Ver destino')}
          <ArrowRight />
        </span>
      </Link>
    </section>
  );
}
