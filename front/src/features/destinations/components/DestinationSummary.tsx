import { useState } from 'react';
import { ArrowRight, ChevronDown, Map, Navigation } from 'lucide-react';
import { t } from '../../../i18n';
import { useActivities } from '../../../contexts/ActivityContext';
import { ExternalMapGate } from '../../privacy/CookieConsent';
import type { Destino } from '../../../types';
import { excerptAtWord, plain, safeHtml, validCoordinates } from '../../../utils';
import { activityDefinition, activityValues } from '../../activities/activities';

type DestinationSummaryProps = {
  destination: Destino;
  mapUrl?: string | null;
};

export function DestinationSummary({ destination, mapUrl }: DestinationSummaryProps) {
  const { activities } = useActivities();
  const [mapActive, setMapActive] = useState(false);
  const description = plain(destination.descripcion).replace(/\s+/g, ' ').trim();
  const introduction = description.match(/^.+?[.!?](?=\s|$)/)?.[0] || excerptAtWord(description, 300);
  const hasMore = introduction !== description;
  const coordinates = validCoordinates(destination.latitud, destination.longitud);
  const activityTypes = [...new Set(activityValues(destination.tipoTurismoSecundario))].map(
    (value) => activityDefinition(value, activities),
  );
  const mapSource = coordinates
    ? `https://www.openstreetmap.org/export/embed.html?${new URLSearchParams({
        bbox: [
          Math.max(-180, coordinates.longitude - 0.28),
          Math.max(-90, coordinates.latitude - 0.17),
          Math.min(180, coordinates.longitude + 0.28),
          Math.min(90, coordinates.latitude + 0.17),
        ].join(','),
        layer: 'mapnik',
        marker: `${coordinates.latitude},${coordinates.longitude}`,
      })}`
    : null;

  return (
    <section id="resumen" className="dest-summary" aria-labelledby="summary-title" data-reveal>
      <div className="dest-summary__layout">
        <div>
          <header className="dest-summary__description">
            <h2 id="summary-title">{t('Sobre {0}', { 0: destination.nombre.trim() })}</h2>
            <p>
              {introduction || t('La descripción editorial todavía no está disponible.')}
            </p>
            {hasMore && (
              <details className="dest-summary__more">
                <summary>
                  {t('Leer la descripción completa')} <ChevronDown aria-hidden="true" />
                </summary>
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: safeHtml(destination.descripcion) }}
                />
              </details>
            )}
          </header>
          {activityTypes.length > 0 && (
            <section className="dest-summary__activities" aria-labelledby="summary-activities-title">
              <h3 id="summary-activities-title">{t('Qué tipo de planes encontrarás')}</h3>
              <ul>
                {activityTypes.map((activity) => (
                  <li key={activity.label}>
                    <activity.Icon aria-hidden="true" />
                    {activity.displayLabel || t(activity.label)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <section className="dest-summary__location" aria-labelledby="summary-map-title">
          <h3 id="summary-map-title">{t('Dónde está')}</h3>
          <p>{destination.nombre.trim()} · {destination.ubicacion}</p>
          {mapSource ? (
            <div className="dest-summary__map">
              <ExternalMapGate>
                <iframe
                  key={mapSource}
                  src={mapSource}
                  title={t('Mapa de {0}', { 0: destination.nombre.trim() })}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  tabIndex={mapActive ? 0 : -1}
                  className={mapActive ? 'is-active' : undefined}
                />
                <button
                  className="dest-summary__map-toggle"
                  type="button"
                  aria-pressed={mapActive}
                  onClick={() => setMapActive((active) => !active)}
                >
                  <Map aria-hidden="true" />
                  {mapActive ? t('Bloquear mapa') : t('Explorar mapa')}
                </button>
              </ExternalMapGate>
            </div>
          ) : (
            <p className="dest-summary__no-map">{t('La ubicación en el mapa todavía no está disponible.')}</p>
          )}
          {coordinates && (
            <div className="dest-summary__map-actions">
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noreferrer">
                  {t('Abrir mapa')} <ArrowRight aria-hidden="true" />
                </a>
              )}
              <a
                className="button dest-summary__directions"
                href={`https://www.google.com/maps/dir/?api=1&destination=${coordinates.latitude},${coordinates.longitude}`}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation aria-hidden="true" /> {t('Cómo llegar')}
              </a>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
