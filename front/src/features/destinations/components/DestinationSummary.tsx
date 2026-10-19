import { lazy, Suspense, useId, useState } from 'react';
import { ArrowUpRight, ChevronDown, Navigation } from 'lucide-react';
import { t } from '../../../i18n';
import { useActivities } from '../../../contexts/ActivityContext';
import { ExternalMapGate } from '../../privacy/CookieConsent';
import type { Destino } from '../../../types';
import { excerptAtWord, plain, safeHtml, validCoordinates } from '../../../utils';
import { activityDefinition, activityValues } from '../../activities/activities';

const DestinationLocationMap = lazy(() => import('./DestinationLocationMap'));

type DestinationSummaryProps = {
  destination: Destino;
  mapUrl?: string | null;
};

export function DestinationSummary({ destination, mapUrl }: DestinationSummaryProps) {
  const { activities } = useActivities();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const descriptionId = useId();
  const description = plain(destination.descripcion).replace(/\s+/g, ' ').trim();
  const introduction =
    description.match(/^.+?[.!?](?=\s|$)/)?.[0] || excerptAtWord(description, 300);
  const hasMore = introduction !== description;
  const coordinates = validCoordinates(destination.latitud, destination.longitud);
  const activityTypes = [...new Set(activityValues(destination.tipoTurismoSecundario))].map(
    (value) => activityDefinition(value, activities),
  );

  return (
    <section id="resumen" className="dest-summary" aria-labelledby="summary-title" data-reveal>
      <div className="dest-summary__layout">
        <div>
          <header className="dest-summary__description">
            <h2 id="summary-title">{t('Sobre {0}', { 0: destination.nombre.trim() })}</h2>
            <div id={descriptionId} className="dest-summary__text prose">
              {descriptionExpanded ? (
                <div dangerouslySetInnerHTML={{ __html: safeHtml(destination.descripcion) }} />
              ) : (
                <p>{introduction || t('La descripción editorial todavía no está disponible.')}</p>
              )}
            </div>
            {hasMore && (
              <button
                type="button"
                className="dest-summary__more"
                aria-expanded={descriptionExpanded}
                aria-controls={descriptionId}
                onClick={() => setDescriptionExpanded((expanded) => !expanded)}
              >
                {t(descriptionExpanded ? 'Leer menos' : 'Leer la descripción completa')}
                <ChevronDown aria-hidden="true" />
              </button>
            )}
          </header>
          {activityTypes.length > 0 && (
            <section
              className="dest-summary__activities"
              aria-labelledby="summary-activities-title"
            >
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
          <p>
            {destination.nombre.trim()} · {destination.ubicacion}
          </p>
          {coordinates ? (
            <div className="dest-summary__map">
              <ExternalMapGate>
                <Suspense fallback={<p role="status">{t('Cargando mapa')}</p>}>
                  <DestinationLocationMap
                    key={`${coordinates.latitude},${coordinates.longitude}`}
                    latitude={coordinates.latitude}
                    longitude={coordinates.longitude}
                    name={destination.nombre.trim()}
                  />
                </Suspense>
              </ExternalMapGate>
            </div>
          ) : (
            <p className="dest-summary__no-map">
              {t('La ubicación en el mapa todavía no está disponible.')}
            </p>
          )}
          {coordinates && (
            <div className="dest-summary__map-actions">
              {mapUrl && (
                <a
                  className="dest-summary__open-map"
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t('Abrir mapa')} <ArrowUpRight aria-hidden="true" />
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
