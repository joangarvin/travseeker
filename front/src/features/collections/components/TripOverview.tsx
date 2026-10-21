import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Check, Lock, Link2, MapPin, Route, Users } from 'lucide-react';
import { intlLocale, t } from '../../../i18n';
import { Button, Dialog } from '../../../components/ui';
import type { CollectionDetail } from '../../../types';
import { getTripDuration } from '../../../utils/tripDuration';
import { resolveItineraryDate } from '../../../utils/itineraryExport';
import { groupOverviewStays } from '../overviewModel';

type Props = {
  collection: CollectionDetail;
  canEdit: boolean;
  isOwner: boolean;
  onOpenSettings: () => void;
  onChangeView: (view: 'overview' | 'destinations' | 'itinerary') => void;
  onOpenDay: (day: number) => void;
  onShare: () => void;
  budget: ReactNode;
};
export function TripOverview({
  collection,
  canEdit,
  isOwner,
  onOpenSettings,
  onChangeView,
  onOpenDay,
  onShare,
  budget,
}: Props) {
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const days = collection.itinerary || [];
  const activities = days.reduce((sum, day) => sum + (day.plannedActivities?.length || 0), 0);
  const firstFree = days.findIndex((day) => !day.plannedActivities?.length);
  const freeDays = days.filter((day) => !day.plannedActivities?.length).length;
  const duration = getTripDuration({
    startDate: collection.startDate,
    endDate: collection.endDate,
    itineraryLength: days.length,
    destinationCount: collection.items.length,
  });
  const stays = groupOverviewStays(days);
  const scheduledIds = new Set(stays.map((stay) => stay.destinationId));
  const cards = [
    ...stays.map((stay) => ({
      ...stay,
      destination: collection.items.find((item) => item.destino.id === stay.destinationId)?.destino,
    })),
    ...collection.items
      .filter((item) => !scheduledIds.has(item.destino.id))
      .map((item) => ({
        destinationId: item.destino.id,
        destination: item.destino,
        startIndex: null,
        endIndex: null,
        days: [],
      })),
  ];
  const formatter = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
  const shortDate = (value: string) =>
    formatter.format(new Date(`${value.slice(0, 10)}T00:00:00Z`));
  const range = (start?: string | null, end?: string | null) =>
    !start
      ? t('Fechas por decidir')
      : end && start.slice(0, 10) !== end.slice(0, 10)
        ? `${shortDate(start)}–${shortDate(end)}`
        : shortDate(start);
  const people = [
    ...(collection.owner ? [{ user: collection.owner, role: 'owner' }] : []),
    ...(collection.members || []),
  ];
  const peopleTitle =
    people.length > 2
      ? t('{0} personas con acceso', { 0: people.length })
      : people.map(({ user }) => user.nombre || t('Viajero')).join(' · ');
  const viewAgenda = () => onChangeView('itinerary');
  return (
    <section
      className="trip-overview"
      aria-labelledby="trip-overview-title"
      data-keyboard={keyboard || undefined}
      onPointerDownCapture={() => setKeyboard(false)}
      onKeyDownCapture={() => setKeyboard(true)}
    >
      <header className="trip-overview-heading">
        <div>
          <p className="kicker">{t('Tu viaje, de un vistazo')}</p>
          <h2 id="trip-overview-title">
            {collection.items.length
              ? t('Todo encaja en una ruta.')
              : t('Tu próxima aventura empieza aquí')}
          </h2>
          <p>{t('La visión general del viaje y los accesos para seguir dándole forma.')}</p>
        </div>
        {collection.items.length > 0 && (
          <Button onClick={viewAgenda}>
            <Route aria-hidden="true" />
            {canEdit ? t('Continuar en la agenda') : t('Consultar la agenda')}
          </Button>
        )}
      </header>
      <div className="trip-overview-basics">
        <span>
          <CalendarDays aria-hidden="true" />
          {range(collection.startDate, collection.endDate)}
          {(duration.source === 'dates' || duration.source === 'itinerary') && (
            <>
              {' '}
              · {duration.days} {t(duration.days === 1 ? 'día' : 'días')}
            </>
          )}
        </span>
        <span>
          <Users aria-hidden="true" />
          {collection.travelerCount || 2}{' '}
          {t(collection.travelerCount === 1 ? 'viajero' : 'viajeros')}
        </span>
        {canEdit && <button onClick={onOpenSettings}>{t('Ajustar datos')}</button>}
      </div>
      <div className="trip-overview-grid">
        <div>
          <section className="trip-overview-route">
            <div className="trip-overview-card-heading">
              <h3>{t('Las paradas de tu viaje')}</h3>
              {cards.length > 0 && <span>{range(collection.startDate, collection.endDate)}</span>}
            </div>
            {cards.length ? (
              <div className="trip-overview-stops">
                {cards.map((card, i) => {
                  const first = card.days[0],
                    last = card.days.at(-1);
                  const firstDate = first ? resolveItineraryDate(first, collection) : undefined;
                  const lastDate = last ? resolveItineraryDate(last, collection) : undefined;
                  const bases = [
                    ...new Set(card.days.map((day) => day.baseMunicipioId).filter(Boolean)),
                  ];
                  const base =
                    bases.length > 1
                      ? t('Varias bases')
                      : bases.length === 1
                        ? card.destination?.municipios?.find((m) => m.id === bases[0])?.nombre
                        : undefined;
                  const assigned = card.startIndex !== null;
                  return (
                    <button
                      type="button"
                      key={`${card.destinationId}-${card.startIndex}`}
                      onClick={() =>
                        card.startIndex !== null
                          ? onOpenDay(card.startIndex)
                          : onChangeView('destinations')
                      }
                    >
                      <span className="trip-overview-stop-number">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <strong>{card.destination?.nombre || t('Destino')}</strong>
                      <small>
                        {assigned
                          ? firstDate
                            ? range(firstDate, lastDate)
                            : card.startIndex === card.endIndex
                              ? t('Día {0}', { 0: card.startIndex! + 1 })
                              : t('Días {0}–{1}', {
                                  0: card.startIndex! + 1,
                                  1: card.endIndex! + 1,
                                })
                          : t('Aún sin días asignados')}
                      </small>
                      <span>
                        {assigned && (
                          <>
                            {card.days.length} {t(card.days.length === 1 ? 'día' : 'días')} ·{' '}
                          </>
                        )}
                        {base
                          ? bases.length > 1
                            ? base
                            : t('Base en {0}', { 0: base })
                          : t('Sin base concreta')}
                      </span>
                      <ArrowUpRight aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="trip-overview-empty">
                <MapPin aria-hidden="true" />
                <h4>{t('Elige por dónde empezar')}</h4>
                <p>{t('Añade destinos al viaje y vuelve aquí para ver cómo encaja la ruta.')}</p>
                {canEdit && (
                  <Link className="button button--primary" to="/">
                    {t('Descubrir destinos')}
                  </Link>
                )}
              </div>
            )}
            <div className="trip-overview-stats">
              <span>
                <MapPin aria-hidden="true" />
                <strong>{collection.items.length}</strong>
                {t(collection.items.length === 1 ? 'destino' : 'destinos')}
              </span>
              <span>
                <Check aria-hidden="true" />
                <strong>{activities}</strong>
                {t(activities === 1 ? 'actividad' : 'actividades')}
              </span>
              <span>
                <CalendarDays aria-hidden="true" />
                <strong>{days.length - freeDays}</strong>
                {t(days.length - freeDays === 1 ? 'día con planes' : 'días con planes')}
              </span>
            </div>
          </section>
          {days.length > 0 ? (
            <section className="trip-overview-flexible">
              <span className="trip-overview-small-icon">
                <Route aria-hidden="true" />
              </span>
              <div>
                <h3>
                  {freeDays
                    ? t(
                        freeDays === 1
                          ? '1 día con espacio para improvisar'
                          : '{0} días con espacio para improvisar',
                        { 0: freeDays },
                      )
                    : t('Todos los días tienen algún plan')}
                </h3>
                <p>
                  {freeDays
                    ? t('Los días libres forman parte del viaje. Añade ideas cuando te apetezca.')
                    : t('Puedes seguir ajustando la agenda y dejar huecos para descubrir.')}
                </p>
                <button
                  className="trip-overview-text-button"
                  onClick={() => onOpenDay(firstFree < 0 ? 0 : firstFree)}
                >
                  {canEdit && freeDays ? t('Explorar un día libre') : t('Ver la agenda')}
                  <ArrowUpRight aria-hidden="true" />
                </button>
              </div>
            </section>
          ) : (
            collection.items.length > 0 && (
              <section className="trip-overview-flexible">
                <span className="trip-overview-small-icon">
                  <Route aria-hidden="true" />
                </span>
                <div>
                  <h3>{t('Todavía sin paradas')}</h3>
                  <p>{t('Distribuye los destinos por días para dar forma a la ruta.')}</p>
                  <button className="trip-overview-text-button" onClick={viewAgenda}>
                    {canEdit ? t('Preparar itinerario') : t('Ver la agenda')}
                    <ArrowUpRight aria-hidden="true" />
                  </button>
                </div>
              </section>
            )
          )}
        </div>
        <aside className="trip-overview-aside">
          {budget}
          <section className="trip-overview-access">
            <span className="trip-overview-access-icon">
              <Users aria-hidden="true" />
            </span>
            <div>
              <h3>{peopleTitle || t('Personas con acceso')}</h3>
              <p>
                {t('Personas con acceso')} · {people.length}
              </p>
              <span className="trip-overview-private">
                {collection.visibility === 'shared' ? (
                  <Link2 aria-hidden="true" />
                ) : (
                  <Lock aria-hidden="true" />
                )}
                {collection.visibility === 'shared' ? t('Enlace activo') : t('Viaje privado')}
              </span>
            </div>
            <button
              className="trip-overview-text-button"
              onClick={isOwner ? onShare : () => setPeopleOpen(true)}
            >
              {isOwner ? t('Gestionar acceso') : t('Ver personas')}
              <ArrowUpRight aria-hidden="true" />
            </button>
          </section>
        </aside>
      </div>
      {peopleOpen && (
        <Dialog
          className="trip-overview-people-dialog"
          title={t('Personas con acceso')}
          onClose={() => setPeopleOpen(false)}
        >
          <ul>
            {people.map(({ user, role }) => (
              <li key={user.id}>
                <span aria-hidden="true">{(user.nombre || '?').slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{user.nombre || t('Viajero')}</strong>
                  <small>
                    {t(role === 'owner' ? 'Propietario' : role === 'editor' ? 'Editor' : 'Lector')}
                  </small>
                </div>
              </li>
            ))}
          </ul>
          <p>{t('Compartir es opcional. Puedes mantener tu viaje privado.')}</p>
          <Button onClick={() => setPeopleOpen(false)}>{t('Cerrar')}</Button>
        </Dialog>
      )}
    </section>
  );
}
