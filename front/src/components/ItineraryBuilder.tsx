import { useConsent } from '../features/privacy/CookieConsent';
import { t, intlLocale, catalogName } from '../i18n';
import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  CarFront,
  Download,
  GripVertical,
  MapPin,
  Plus,
  Printer,
  Route,
  Save,
  Trash2,
} from 'lucide-react';
import type { CollectionDetail, Destino, ItineraryDay } from '../types';
import {
  calculateRouteSegment,
  resolveRouteCoordinates,
  type RouteSegment,
} from '../services/routingService';
import {
  downloadICalFile,
  generateGoogleCalendarUrl,
  resolveItineraryDate,
} from '../utils/itineraryExport';
import { Button, Empty, Field, MediaImage, Notice } from './ui';
import { imageUrl } from '../utils';
import { addTripDays, getTripDuration } from '../utils/tripDuration';

type ItineraryBuilderProps = {
  collection: CollectionDetail;
  canEdit?: boolean;
  onSave?: (itinerary: ItineraryDay[], endDate?: string) => Promise<void>;
};

const EMPTY_ITINERARY: ItineraryDay[] = [];

function isoDate(value: string | null | undefined): string | undefined {
  return value?.slice(0, 10) || undefined;
}

function normalizeDays(days: ItineraryDay[], startDate?: string | null): ItineraryDay[] {
  const start = isoDate(startDate);
  return days.map((day, index) => ({
    ...day,
    dayNumber: index + 1,
    date: start ? addTripDays(start, index) : day.date,
  }));
}

export function generateItinerary(collection: CollectionDetail): ItineraryDay[] {
  if (!collection.items.length) return [];
  const count = getTripDuration({
    startDate: collection.startDate,
    endDate: collection.endDate,
    destinationCount: collection.items.length,
  }).days;
  const start = isoDate(collection.startDate);
  return Array.from({ length: count }, (_, index) => {
    const destination = collection.items[index % collection.items.length].destino;
    return {
      dayNumber: index + 1,
      date: start ? addTripDays(start, index) : undefined,
      destinationId: destination.id,
      baseMunicipioId: destination.municipios?.[0]?.id,
      plannedActivities: [],
    };
  });
}

function formatDayDate(value?: string): string {
  if (!value) return t('Fecha abierta');
  return new Intl.DateTimeFormat(intlLocale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDuration(minutes?: number): string {
  if (minutes === undefined) return '';
  const rounded = Math.max(1, Math.round(minutes));
  if (rounded < 60) return `~${rounded} min`;
  const hours = Math.floor(rounded / 60);
  const remainder = rounded % 60;
  return `~${hours} h${remainder ? ` ${remainder} min` : ''}`;
}

function destinationFor(collection: CollectionDetail, id: string): Destino | undefined {
  return collection.items.find((item) => item.destino.id === id)?.destino;
}

function activityName(destination: Destino | undefined, value: string): string {
  const activity = destination?.activities?.find((activity) => activity.id === value);
  return activity ? catalogName(activity) : t(value);
}

function SegmentBar({ segment, loading }: { segment?: RouteSegment; loading: boolean }) {
  if (loading) {
    return (
      <div className="route-segment route-segment--loading" role="status">
        {t('Calculando siguiente trayecto…')}
      </div>
    );
  }
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

export function ItineraryBuilder({ collection, canEdit = false, onSave }: ItineraryBuilderProps) {
  const { maps } = useConsent();
  const savedItinerary = collection.itinerary ?? EMPTY_ITINERARY;
  const initialDays = savedItinerary.length
    ? normalizeDays(savedItinerary, collection.startDate)
    : canEdit
      ? generateItinerary(collection)
      : [];
  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'info' | 'error' | 'success'>('info');
  const draggedIndex = useRef<number | null>(null);

  useEffect(() => {
    setDays(
      savedItinerary.length
        ? normalizeDays(savedItinerary, collection.startDate)
        : canEdit
          ? generateItinerary(collection)
          : [],
    );
  }, [savedItinerary, collection.items, collection.startDate, collection.endDate, canEdit]);

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
  const savedDays = savedItinerary.length
    ? normalizeDays(savedItinerary, collection.startDate)
    : [];
  const dirty = JSON.stringify(days) !== JSON.stringify(savedDays);
  const suggestedDraft = canEdit && !savedItinerary.length && days.length > 0;
  const hasDates = days.some((day) => resolveItineraryDate(day, collection));

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
  }, [dirty]);

  const updateDay = (index: number, patch: Partial<ItineraryDay>) => {
    setFeedback('');
    setDays((current) =>
      normalizeDays(
        current.map((day, dayIndex) => (dayIndex === index ? { ...day, ...patch } : day)),
        collection.startDate,
      ),
    );
  };

  const moveDay = (from: number, to: number) => {
    if (to < 0 || to >= days.length || from === to) return;
    setFeedback('');
    setDays((current) => {
      const reordered = [...current];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      return normalizeDays(reordered, collection.startDate);
    });
  };

  const dropDay = (event: DragEvent<HTMLElement>, to: number) => {
    event.preventDefault();
    if (draggedIndex.current !== null) moveDay(draggedIndex.current, to);
    draggedIndex.current = null;
  };

  const addDay = () => {
    const lastDestinationId = days.at(-1)?.destinationId;
    const destination =
      (lastDestinationId ? destinationFor(collection, lastDestinationId) : undefined) ||
      collection.items[0]?.destino;
    if (!destination) return;
    setDays((current) =>
      normalizeDays(
        [
          ...current,
          {
            dayNumber: current.length + 1,
            destinationId: destination.id,
            baseMunicipioId: destination.municipios?.[0]?.id,
            plannedActivities: [],
          },
        ],
        collection.startDate,
      ),
    );
  };

  const autoGenerate = () => {
    if (dirty && !confirm(t('¿Regenerar el itinerario? Se reemplazarán los cambios sin guardar.')))
      return;
    setFeedback('');
    setDays(generateItinerary(collection));
  };

  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    setFeedback('');
    try {
      const start = isoDate(collection.startDate);
      const alignedEndDate = start && days.length ? addTripDays(start, days.length - 1) : undefined;
      await onSave(days, alignedEndDate);
      setFeedback(t('Itinerario guardado'));
      setFeedbackTone('success');
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : t('No se pudo guardar el itinerario'));
      setFeedbackTone('error');
    } finally {
      setSaving(false);
    }
  };

  const exportICal = () => {
    if (!downloadICalFile({ ...collection, itinerary: days })) {
      setFeedback(t('Añade una fecha de inicio para exportar el calendario'));
      setFeedbackTone('info');
    }
  };

  if (!collection.items.length) {
    return (
      <Empty icon={<Route />} title={t('La ruta necesita al menos un destino')}>
        {t('Añade destinos al viaje y vuelve aquí para organizarlos por días.')}
      </Empty>
    );
  }

  if (!canEdit && !savedItinerary.length) {
    return (
      <Empty icon={<Route />} title={t('El itinerario aún no se ha publicado')}>
        {t(
          'El viaje tiene destinos guardados, pero su organizador todavía no ha confirmado el plan día a día.',
        )}
      </Empty>
    );
  }

  return (
    <section className="itinerary-builder" aria-labelledby="itinerary-builder-title">
      <div className="itinerary-builder__print-title print-only">
        <p>{t('TravSeeker · Itinerario')}</p>
        <h1>{collection.nombre}</h1>
        {collection.descripcion && <p>{collection.descripcion}</p>}
      </div>
      <header className="itinerary-builder__header">
        <div>
          <p className="kicker">{t('La ruta completa')}</p>
          <h2 id="itinerary-builder-title">{t('Día a día')}</h2>
          <p>
            {canEdit
              ? t('Ordena las paradas, elige dónde hacer base y anota el plan.')
              : t('La secuencia compartida del viaje, parada a parada.')}
          </p>
        </div>
        <div className="itinerary-builder__exports no-print">
          <Button variant="secondary" disabled={!hasDates} onClick={exportICal}>
            <Download /> iCal
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer /> {t('Imprimir / PDF')}
          </Button>
          {!hasDates && <small>{t('Añade fechas para exportar a iCal.')}</small>}
        </div>
      </header>

      <div className="itinerary-summary" aria-live="polite">
        <span>
          <b>{days.length}</b> {days.length === 1 ? t('día') : t('días')}
        </span>
        <span>
          <b>
            {routesLoading ? '…' : `${hasPartialRoute ? '≈' : ''}${Math.round(totalDistance)} km`}
          </b>{' '}
          {unavailableRouteCount ? t('distancia parcial') : t('distancia estimada')}
        </span>
        <span>
          <b>
            {routesLoading ? '…' : totalDuration ? formatDuration(totalDuration) : t('Sin dato')}
          </b>{' '}
          {hasPartialRoute
            ? t('{0}/{1} tramos por carretera', { 0: exactRouteCount, 1: segments.length })
            : t('en carretera')}
        </span>
      </div>
      {!routesLoading && hasPartialRoute && (
        <p className="route-confidence">
          <Route aria-hidden="true" />{' '}
          {fallbackRouteCount
            ? t('{0} {1} distancia en línea recta.', {
                0: fallbackRouteCount,
                1: fallbackRouteCount === 1 ? t('tramo usa') : t('tramos usan'),
              })
            : ''}{' '}
          {unavailableRouteCount ? t('{0} sin coordenadas.', { 0: unavailableRouteCount }) : ''}{' '}
          {t('Los tiempos solo incluyen rutas verificadas.')}
        </p>
      )}

      {suggestedDraft && (
        <Notice tone="info">
          <strong>{t('Propuesta sin guardar.')}</strong>{' '}
          {t(
            'Hemos repartido los destinos para darte un punto de partida. Revísalo y guarda cuando tenga sentido para tu viaje.',
          )}
        </Notice>
      )}

      {canEdit && (
        <div className="itinerary-builder__toolbar no-print">
          <Button variant="secondary" onClick={autoGenerate}>
            <Route /> {t('Autogenerar')}
          </Button>
          <Button variant="secondary" onClick={addDay}>
            <Plus /> {t('Añadir día')}
          </Button>
          <Button loading={saving} disabled={!dirty} onClick={() => void save()}>
            <Save /> {t('Guardar cambios')}
          </Button>
          <span>
            {suggestedDraft
              ? t('Propuesta sin guardar')
              : dirty
                ? t('Cambios sin guardar')
                : t('Todo guardado')}
          </span>
        </div>
      )}
      {feedback && (
        <Notice tone={feedbackTone}>
          {feedback}
          {feedbackTone === 'error' && <>{t('. Revisa tu conexión y vuelve a intentarlo.')}</>}
        </Notice>
      )}

      <ol className="itinerary-timeline">
        {days.map((day, index) => {
          const destination =
            destinationFor(collection, day.destinationId) || collection.items[0].destino;
          const municipios = destination.municipios || [];
          const activities = destination.activities || [];
          return (
            <li key={`${day.dayNumber}-${day.destinationId}-${index}`}>
              <article
                className="itinerary-day"
                draggable={canEdit}
                onDragStart={() => {
                  draggedIndex.current = index;
                }}
                onDragOver={(event) => canEdit && event.preventDefault()}
                onDrop={(event) => canEdit && dropDay(event, index)}
              >
                <div className="itinerary-day__marker" aria-hidden="true">
                  <span>{String(day.dayNumber).padStart(2, '0')}</span>
                </div>
                <div className="itinerary-day__media">
                  <MediaImage src={imageUrl(destination.imagen)} alt="" loading="lazy" />
                  <span>{formatDayDate(day.date)}</span>
                </div>
                <div className="itinerary-day__content">
                  <header>
                    <div>
                      <small>
                        {t('Día')} {day.dayNumber}
                      </small>
                      <h3>
                        <Link to={`/destino/${destination.id}`}>{destination.nombre}</Link>
                      </h3>
                    </div>
                    {canEdit && (
                      <div className="itinerary-day__order no-print">
                        <GripVertical aria-hidden="true" />
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveDay(index, index - 1)}
                          aria-label={t('Subir día {0}', { 0: day.dayNumber })}
                        >
                          <ArrowUp />
                        </button>
                        <button
                          type="button"
                          disabled={index === days.length - 1}
                          onClick={() => moveDay(index, index + 1)}
                          aria-label={t('Bajar día {0}', { 0: day.dayNumber })}
                        >
                          <ArrowDown />
                        </button>
                        <button
                          type="button"
                          disabled={days.length === 1}
                          onClick={() =>
                            setDays((current) =>
                              normalizeDays(
                                current.filter((_, dayIndex) => dayIndex !== index),
                                collection.startDate,
                              ),
                            )
                          }
                          aria-label={t('Eliminar día {0}', { 0: day.dayNumber })}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    )}
                  </header>

                  {canEdit ? (
                    <div className="itinerary-day__fields no-print">
                      <Field label={t('Destino')} htmlFor={`itinerary-destination-${index}`}>
                        <select
                          id={`itinerary-destination-${index}`}
                          value={day.destinationId}
                          onChange={(event) => {
                            const nextDestination = destinationFor(collection, event.target.value);
                            updateDay(index, {
                              destinationId: event.target.value,
                              baseMunicipioId: nextDestination?.municipios?.[0]?.id,
                              plannedActivities: [],
                            });
                          }}
                        >
                          {collection.items.map((item) => (
                            <option key={item.destino.id} value={item.destino.id}>
                              {item.destino.nombre}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={t('Municipio base')} htmlFor={`itinerary-base-${index}`}>
                        <select
                          id={`itinerary-base-${index}`}
                          value={day.baseMunicipioId || ''}
                          onChange={(event) =>
                            updateDay(index, { baseMunicipioId: event.target.value || undefined })
                          }
                        >
                          <option value="">{t('Sin base concreta')}</option>
                          {municipios.map((municipio) => (
                            <option key={municipio.id} value={municipio.id}>
                              {municipio.nombre}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label={t('Notas del día')} htmlFor={`itinerary-notes-${index}`}>
                        <textarea
                          id={`itinerary-notes-${index}`}
                          maxLength={1200}
                          value={day.notes || ''}
                          placeholder={t('Reservas, horarios, ideas…')}
                          onChange={(event) => updateDay(index, { notes: event.target.value })}
                        />
                      </Field>
                      {!!activities.length && (
                        <fieldset className="itinerary-activities">
                          <legend>{t('Actividades')}</legend>
                          <div>
                            {activities.map((activity) => {
                              const selected =
                                day.plannedActivities?.includes(activity.id) || false;
                              return (
                                <label key={activity.id}>
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() =>
                                      updateDay(index, {
                                        plannedActivities: selected
                                          ? day.plannedActivities?.filter(
                                              (id) => id !== activity.id,
                                            )
                                          : [...(day.plannedActivities || []), activity.id],
                                      })
                                    }
                                  />
                                  <span>{catalogName(activity)}</span>
                                </label>
                              );
                            })}
                          </div>
                        </fieldset>
                      )}
                    </div>
                  ) : (
                    <div className="itinerary-day__readonly">
                      {day.baseMunicipioId && (
                        <p>
                          <MapPin /> {t('Base:')}{' '}
                          {municipios.find((item) => item.id === day.baseMunicipioId)?.nombre}
                        </p>
                      )}
                      {day.notes && <p>{day.notes}</p>}
                      {!!day.plannedActivities?.length && (
                        <div>
                          {day.plannedActivities.map((activity) => (
                            <span key={activity}>{activityName(destination, activity)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {canEdit && (
                    <div className="itinerary-day__print print-only">
                      {day.baseMunicipioId && (
                        <p>
                          <MapPin /> {t('Base:')}{' '}
                          {municipios.find((item) => item.id === day.baseMunicipioId)?.nombre}
                        </p>
                      )}
                      {day.notes && <p>{day.notes}</p>}
                      {!!day.plannedActivities?.length && (
                        <p>
                          {t('Actividades:')}{' '}
                          {day.plannedActivities
                            .map((activity) => activityName(destination, activity))
                            .join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  <a
                    className="itinerary-day__calendar no-print"
                    href={generateGoogleCalendarUrl(day, { ...collection, itinerary: days })}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <CalendarPlus /> {t('Añadir a Google Calendar')}
                  </a>
                </div>
              </article>
              {index < days.length - 1 && (
                <SegmentBar segment={segments[index]} loading={routesLoading} />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default ItineraryBuilder;
