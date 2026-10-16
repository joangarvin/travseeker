import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Route, Share2 } from 'lucide-react';
import { t } from '../../../i18n';
import { Button, MediaImage } from '../../../components/ui';
import type { CollectionDetail } from '../../../types';
import { imageUrl } from '../../../utils';
import { getTripDuration } from '../../../utils/tripDuration';
import { ParticipantAvatars } from './ParticipantAvatars';

export function TripOverview({
  collection,
  canEdit,
  isOwner,
  onOpenSettings,
  onChangeView,
  onOpenDay,
  onShare,
  budget,
}: {
  collection: CollectionDetail;
  canEdit: boolean;
  isOwner: boolean;
  onOpenSettings: () => void;
  onChangeView: (view: 'overview' | 'destinations' | 'itinerary') => void;
  onOpenDay: (day: number) => void;
  onShare: () => void;
  budget: ReactNode;
}) {
  const activities = collection.itinerary.reduce(
    (sum, day) => sum + (day.plannedActivities?.length || 0),
    0,
  );
  const emptyDays = collection.itinerary
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => !day.plannedActivities?.length);
  const duration = getTripDuration({
    startDate: collection.startDate,
    endDate: collection.endDate,
    itineraryLength: collection.itinerary.length,
    destinationCount: collection.items.length,
  });
  const cover = collection.items[0]?.destino;
  return (
    <div className="trip-summary">
      <section className="trip-summary__hero">
        {cover && <MediaImage src={imageUrl(cover.imagen)} alt="" loading="lazy" />}
        <div>
          <p className="kicker">{t('Tu viaje, de un vistazo')}</p>
          <h2>
            {collection.items.length
              ? collection.items.map((item) => item.destino.nombre).join(' → ')
              : t('Tu próxima aventura empieza aquí')}
          </h2>
          <p>
            {collection.descripcion || t('Dale forma a la ruta y deja espacio para descubrir.')}
          </p>
          <Button onClick={() => onChangeView('itinerary')}>
            <Route />
            {t('Continuar en la agenda')}
          </Button>
        </div>
      </section>
      <div className="trip-summary__facts">
        {[
          {
            label: t('Duración'),
            value: `${duration.days} ${t('días')} · ${duration.nights} ${t('noches')}`,
          },
          { label: t('Destinos'), value: collection.items.length },
          { label: t('Actividades'), value: activities },
          { label: t('Viajeros'), value: collection.travelerCount || 2 },
        ].map((fact) => (
          <article key={fact.label}>
            <small>{fact.label}</small>
            <strong>{fact.value}</strong>
          </article>
        ))}
      </div>
      <div className="trip-summary__grid">
        <section className="trip-summary__card">
          <p className="kicker">{t('Lo que queda por preparar')}</p>
          <h3>
            {emptyDays.length || !collection.startDate || !collection.itinerary.length
              ? t('El siguiente paso')
              : t('Tu plan está listo')}
          </h3>
          {!collection.startDate && (
            <div className="trip-summary__task">
              <span>{t('Elegir las fechas del viaje')}</span>
              {isOwner && (
                <Button variant="secondary" onClick={onOpenSettings}>
                  {t('Elegir fechas')}
                </Button>
              )}
            </div>
          )}
          {!collection.items.length && (
            <Link className="button button--primary" to="/">
              {t('Descubrir destinos')}
            </Link>
          )}
          {!collection.itinerary.length && collection.items.length > 0 && (
            <Button onClick={() => onChangeView('itinerary')}>{t('Preparar itinerario')}</Button>
          )}
          {emptyDays.map(({ day, index }) => (
            <div className="trip-summary__task" key={index}>
              <span>
                {t('Día')} {day.dayNumber} ·{' '}
                {
                  collection.items.find((item) => item.destino.id === day.destinationId)?.destino
                    .nombre
                }
                <small>{t('Sin actividades todavía')}</small>
              </span>
              <Button variant="secondary" onClick={() => onOpenDay(index)}>
                {canEdit ? t('Planificar día') : t('Ver día')}
              </Button>
            </div>
          ))}
          {!emptyDays.length && collection.startDate && collection.itinerary.length > 0 && (
            <p>
              {t(
                'Las fechas y las actividades están preparadas. Puedes seguir ajustando la agenda.',
              )}
            </p>
          )}
        </section>
        <section className="trip-summary__card">
          <p className="kicker">{t('Tu ruta')}</p>
          <h3>{t('Parada a parada')}</h3>
          <ol className="trip-summary__route">
            {collection.itinerary.map((day, index) => (
              <li key={index}>
                <button type="button" onClick={() => onOpenDay(index)}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <strong>
                      {collection.items.find((item) => item.destino.id === day.destinationId)
                        ?.destino.nombre || t('Destino')}
                    </strong>
                    <small>
                      {day.plannedActivities?.length || 0} {t('actividades')}
                    </small>
                  </div>
                </button>
              </li>
            ))}
          </ol>
          {!collection.itinerary.length && <p>{t('Todavía sin paradas')}</p>}
        </section>
        <section className="trip-summary__card">
          <p className="kicker">{t('El grupo')}</p>
          <h3>
            {collection.travelerCount || 2} {t('viajeros')}
          </h3>
          <ParticipantAvatars collection={collection} />
          <p>
            {collection.members?.length || 0} {t('colaboradores')}
          </p>
          {isOwner && (
            <div className="trip-destination__actions">
              <Button variant="secondary" onClick={onOpenSettings}>
                {t('Editar viajeros')}
              </Button>
              <Button onClick={onShare}>
                <Share2 />
                {t('Gestionar acceso')}
              </Button>
            </div>
          )}
          <p className="muted">{t('Compartir es opcional. Puedes mantener tu viaje privado.')}</p>
        </section>
      </div>
      {budget}
    </div>
  );
}
