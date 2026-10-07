import { useConsent } from '../features/privacy/CookieConsent';
import { t, intlLocale, catalogName } from '../i18n';
import { useEffect, useMemo, useRef, useState, type ReactNode, type DragEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  plannedActivityLabel,
  tripActivityCatalog,
  plannedActivityHref,
  movePlannedActivity,
} from '../utils/plannedActivities';
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
import { Button, Dialog, Empty, Field, MediaImage, Notice } from './ui';
import { imageUrl } from '../utils';
import { addTripDays, getTripDuration } from '../utils/tripDuration';
import { planItinerary, optimizeItinerary, itineraryDistance } from '../utils/itineraryPlanner';

type ItineraryBuilderProps = {
  collection: CollectionDetail;
  canEdit?: boolean;
  onSave?: (itinerary: ItineraryDay[], endDate?: string) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onDraftChange?: (days: ItineraryDay[]) => void;
  budget?: ReactNode;
  focusDay?: { index: number };
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
  return normalizeDays(
    planItinerary(
      collection.items.map((item) => item.destino),
      count,
    ),
    collection.startDate,
  );
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
  return plannedActivityLabel(value, tripActivityCatalog(destination), (item) => catalogName(item));
}

function SegmentBar({ segment, loading }: { segment?: RouteSegment; loading: boolean }) {
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

export function ItineraryBuilder({
  collection,
  canEdit = false,
  onSave,
  onDirtyChange,
  onDraftChange,
  budget,
  focusDay,
}: ItineraryBuilderProps) {
  const { maps } = useConsent();
  const savedItinerary = collection.itinerary ?? EMPTY_ITINERARY;
  const initialDays = savedItinerary.length
    ? normalizeDays(savedItinerary, collection.startDate)
    : canEdit
      ? generateItinerary(collection)
      : [];
  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const [searchParams] = useSearchParams();
  const requestedDay = Number(searchParams.get('day'));
  const [selectedDay, setSelectedDay] = useState(
    Number.isInteger(requestedDay) && requestedDay > 0 ? requestedDay - 1 : 0,
  );
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [addingActivity, setAddingActivity] = useState<number | null>(null);
  const [activityDraft, setActivityDraft] = useState('');
  useEffect(() => {
    if (focusDay !== undefined) {
      setSelectedDay(focusDay.index);
      setEditingDay(null);
    }
  }, [focusDay]);
  const activeDay = Math.min(selectedDay, Math.max(0, days.length - 1));
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [generationOpen, setGenerationOpen] = useState(false);
  const [previousRoute, setPreviousRoute] = useState<ItineraryDay[] | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'info' | 'error' | 'success'>('info');
  const draggedIndex = useRef<number | null>(null);

  useEffect(() => {
    onDraftChange?.(days);
  }, [days, onDraftChange]);
  const destinationSignature = collection.items.map((item) => item.destino.id).join('|');
  useEffect(() => {
    setPreviousRoute(null);
    setDays(
      savedItinerary.length
        ? normalizeDays(savedItinerary, collection.startDate)
        : canEdit
          ? generateItinerary(collection)
          : [],
    );
  }, [savedItinerary, destinationSignature, collection.startDate, collection.endDate, canEdit]);

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
  useEffect(() => {
    onDirtyChange?.(dirty);
  }, [dirty, onDirtyChange]);
  const extendsDates = Boolean(
    collection.startDate &&
    collection.endDate &&
    days.length >
      getTripDuration({ startDate: collection.startDate, endDate: collection.endDate }).days,
  );
  const suggestedDraft = canEdit && !savedItinerary.length && days.length > 0;
  const hasDates = days.some((day) => resolveItineraryDate(day, collection));

  useEffect(() => {
    if (!dirty) return;
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    const guardNavigation = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.('a');
      if (
        !anchor ||
        anchor.target === '_blank' ||
        anchor.hasAttribute('download') ||
        anchor.getAttribute('href')?.startsWith('#')
      )
        return;
      if (!confirm(t('Hay cambios sin guardar. ¿Salir del viaje y descartarlos?'))) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener('click', guardNavigation, true);
    window.addEventListener('beforeunload', warnBeforeLeaving);
    return () => {
      window.removeEventListener('beforeunload', warnBeforeLeaving);
      document.removeEventListener('click', guardNavigation, true);
    };
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
    setSelectedDay(to);
    setEditingDay(to);
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
    setSelectedDay(days.length);
    setEditingDay(days.length);
    setFeedback('');
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

  const applyRoute = (next: ItineraryDay[]) => {
    setPreviousRoute(days);
    setDays(normalizeDays(next, collection.startDate));
    setSelectedDay(0);
    setEditingDay(null);
    setAddingActivity(null);
    setFeedbackTone('info');
  };

  const autoGenerate = () => {
    setGenerationOpen(false);
    const next = generateItinerary(collection);
    applyRoute(next);
    const duration = getTripDuration({
      startDate: collection.startDate,
      endDate: collection.endDate,
      destinationCount: collection.items.length,
    });
    setFeedback(
      next.length > duration.days
        ? t(
            'Hemos añadido días para incluir todos los destinos. Al guardar se actualizará la fecha final del viaje.',
          )
        : t(
            'Estancias consecutivas y paradas ordenadas por proximidad. Revisa la propuesta antes de guardar.',
          ),
    );
  };

  const improveRoute = () => {
    const destinations = collection.items.map((item) => item.destino);
    const before = itineraryDistance(days, destinations);
    if (before === undefined) {
      setFeedbackTone('info');
      setFeedback(
        t(
          'Faltan coordenadas en algunas paradas. Selecciona una base con ubicación para poder mejorar la ruta.',
        ),
      );
      return;
    }
    const next = optimizeItinerary(days, destinations);
    const after = itineraryDistance(next, destinations)!;
    if (before - after < 0.001) {
      setFeedbackTone('info');
      setFeedback(
        t(
          'No hemos encontrado una ruta más corta manteniendo el punto de partida y las estancias.',
        ),
      );
      return;
    }
    applyRoute(
      collection.startDate ? next : next.map((day, index) => ({ ...day, date: days[index]?.date })),
    );
    setFeedback(
      `${t('Ruta mejorada:')} ≈${Math.round(before)} → ≈${Math.round(after)} km. ${t('Estimación en línea recta. Conservamos actividades, notas y bases; las fechas siguen el nuevo orden.')}`,
    );
  };

  const undoRoute = () => {
    if (!previousRoute) return;
    setDays(previousRoute);
    setPreviousRoute(null);
    setSelectedDay(0);
    setEditingDay(null);
    setAddingActivity(null);
    setFeedbackTone('info');
    setFeedback(t('Se ha recuperado el itinerario anterior.'));
  };

  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    setFeedback('');
    try {
      const start = isoDate(collection.startDate);
      const alignedEndDate = start && days.length ? addTripDays(start, days.length - 1) : undefined;
      await onSave(days, alignedEndDate);
      setPreviousRoute(null);
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
    <section className="itinerary-builder trip-agenda" aria-labelledby="itinerary-builder-title">
      {generationOpen && (
        <Dialog
          title={t('Crear nueva propuesta')}
          description={t(
            'Se reemplazarán las actividades y notas del itinerario. Para conservarlas, utiliza Mejorar ruta. Puedes deshacer antes de guardar.',
          )}
          onClose={() => setGenerationOpen(false)}
        >
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setGenerationOpen(false)}>
              {t('Cancelar')}
            </Button>
            <Button onClick={autoGenerate}>{t('Crear propuesta')}</Button>
          </div>
        </Dialog>
      )}
      <div className="itinerary-builder__print-title print-only">
        <p>{t('TravSeeker · Itinerario')}</p>
        <h1>{collection.nombre}</h1>
        {collection.descripcion && <p>{collection.descripcion}</p>}
      </div>
      <header className="itinerary-builder__header">
        <div>
          <p className="kicker">{t('Tu plan de viaje')}</p>
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
            ? t('{0}/{1} tramos por carretera', {
                0: exactRouteCount,
                1: segments.filter((segment) => segment.source !== 'stay').length,
              })
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
            'Agrupamos las noches en cada destino y ordenamos las paradas por proximidad, manteniendo el primer destino como salida. Revísalo antes de guardar.',
          )}
        </Notice>
      )}

      {canEdit && extendsDates && (
        <Notice tone="info">
          {t(
            'La propuesta necesita más días que las fechas actuales. Al guardar se actualizará la fecha final del viaje.',
          )}
        </Notice>
      )}
      {canEdit && (
        <div className="itinerary-builder__toolbar no-print">
          <Button
            variant="secondary"
            onClick={() => (days.length ? setGenerationOpen(true) : autoGenerate())}
          >
            <Route /> {t('Autogenerar')}
          </Button>
          <Button variant="secondary" disabled={days.length < 3} onClick={improveRoute}>
            <Route /> {t('Mejorar ruta')}
          </Button>
          {previousRoute && (
            <Button variant="secondary" onClick={undoRoute}>
              {t('Deshacer ruta')}
            </Button>
          )}
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

      <div className="trip-agenda__layout">
        <div className="trip-agenda__main">
          <div className="trip-agenda__days no-print" aria-label={t('Seleccionar día')}>
            {days.map((day, index) => (
              <button
                type="button"
                key={index}
                aria-pressed={activeDay === index}
                onClick={() => {
                  setSelectedDay(index);
                  setEditingDay(null);
                  setAddingActivity(null);
                }}
              >
                <strong>
                  {t('Día')} {index + 1} ·{' '}
                  {destinationFor(collection, day.destinationId)?.nombre || t('Destino')}
                </strong>
                <small>{formatDayDate(day.date)}</small>
                <small>
                  {day.plannedActivities?.length || 0} {t('actividades')}
                </small>
              </button>
            ))}
          </div>
          <ol className="itinerary-timeline">
            {days.map((day, index) => {
              const destination =
                destinationFor(collection, day.destinationId) || collection.items[0].destino;
              const municipios = destination.municipios || [];
              const activities = tripActivityCatalog(destination);
              return (
                <li
                  className={
                    index === activeDay ? 'trip-agenda__day is-active' : 'trip-agenda__day'
                  }
                  key={`${day.dayNumber}-${day.destinationId}-${index}`}
                >
                  <article
                    className="itinerary-day"
                    draggable={canEdit && editingDay === index}
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
                            {t('Día')} {day.dayNumber} · {formatDayDate(day.date)}
                          </small>
                          <h3>
                            <Link to={`/destino/${destination.id}`}>{destination.nombre}</Link>
                          </h3>
                        </div>
                        {canEdit && editingDay === index && (
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
                              onClick={() => {
                                if (
                                  (day.plannedActivities?.length || day.notes) &&
                                  !confirm(t('¿Eliminar este día y sus actividades?'))
                                )
                                  return;
                                setDays((current) =>
                                  normalizeDays(
                                    current.filter((_, dayIndex) => dayIndex !== index),
                                    collection.startDate,
                                  ),
                                );
                              }}
                              aria-label={t('Eliminar día {0}', { 0: day.dayNumber })}
                            >
                              <Trash2 />
                            </button>
                          </div>
                        )}
                      </header>

                      <div className={`trip-agenda__activities ${canEdit ? 'no-print' : ''}`}>
                        <h4>{t('Actividades del día')}</h4>
                        {day.plannedActivities?.length ? (
                          day.plannedActivities.map((value) => (
                            <div className="trip-agenda__activity" key={value}>
                              <MapPin aria-hidden="true" />
                              <div>
                                <Link
                                  className="trip-agenda__activity-link"
                                  to={plannedActivityHref(destination, value)}
                                >
                                  {activityName(destination, value)}{' '}
                                  <span aria-hidden="true">↗</span>
                                </Link>
                                <small>
                                  {t('Día')} {day.dayNumber} · {destination.nombre}
                                </small>
                              </div>
                              {canEdit && (
                                <div className="trip-agenda__activity-actions no-print">
                                  <select
                                    aria-label={t('Mover {0} a otro día', {
                                      0: activityName(destination, value),
                                    })}
                                    value=""
                                    onChange={(event) => {
                                      const to = Number(event.target.value);
                                      setDays((current) =>
                                        movePlannedActivity(current, index, to, value),
                                      );
                                      setSelectedDay(to);
                                      setFeedback('');
                                    }}
                                  >
                                    <option value="" disabled>
                                      {t('Mover a…')}
                                    </option>
                                    {days.map((target, targetIndex) =>
                                      targetIndex !== index &&
                                      target.destinationId === day.destinationId ? (
                                        <option key={targetIndex} value={targetIndex}>
                                          {t('Día')} {targetIndex + 1}
                                        </option>
                                      ) : null,
                                    )}
                                  </select>
                                  <button
                                    type="button"
                                    aria-label={t('Quitar {0}', {
                                      0: activityName(destination, value),
                                    })}
                                    onClick={() =>
                                      updateDay(index, {
                                        plannedActivities: day.plannedActivities?.filter(
                                          (item) => item !== value,
                                        ),
                                      })
                                    }
                                  >
                                    <Trash2 />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="trip-agenda__empty">
                            {t(
                              'Todavía no hay actividades. Añade una idea o deja espacio para improvisar.',
                            )}
                          </p>
                        )}
                        {canEdit && (
                          <div className="trip-agenda__day-actions no-print">
                            <Button
                              onClick={() => {
                                setAddingActivity(addingActivity === index ? null : index);
                                setActivityDraft('');
                              }}
                            >
                              <Plus /> {t('Añadir actividad')}
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setEditingDay(editingDay === index ? null : index)}
                            >
                              {editingDay === index ? t('Cerrar edición') : t('Editar día')}
                            </Button>
                          </div>
                        )}
                        {canEdit && addingActivity === index && (
                          <form
                            className="trip-agenda__add no-print"
                            onSubmit={(event) => {
                              event.preventDefault();
                              const value = activityDraft.trim();
                              if (!value) return;
                              updateDay(index, {
                                plannedActivities: [
                                  ...new Set([...(day.plannedActivities || []), value]),
                                ],
                              });
                              setActivityDraft('');
                              setAddingActivity(null);
                            }}
                          >
                            <Field label={t('Actividad')} htmlFor={`activity-${index}`}>
                              <input
                                id={`activity-${index}`}
                                autoFocus
                                maxLength={100}
                                required
                                value={activityDraft}
                                onChange={(event) => setActivityDraft(event.target.value)}
                                placeholder={t('Una experiencia que quieres vivir…')}
                              />
                            </Field>
                            {!!activities.length && (
                              <Field label={t('Elegir del catálogo')} htmlFor={`catalog-${index}`}>
                                <select
                                  id={`catalog-${index}`}
                                  value={
                                    activities.some((item) => item.id === activityDraft)
                                      ? activityDraft
                                      : ''
                                  }
                                  onChange={(event) => setActivityDraft(event.target.value)}
                                >
                                  <option value="">{t('Seleccionar actividad')}</option>
                                  {activities.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {catalogName(item)}
                                    </option>
                                  ))}
                                </select>
                              </Field>
                            )}
                            <Button type="submit">{t('Añadir al día')}</Button>
                          </form>
                        )}
                      </div>
                      {canEdit && editingDay === index ? (
                        <div className="itinerary-day__fields no-print">
                          <Field label={t('Destino')} htmlFor={`itinerary-destination-${index}`}>
                            <select
                              id={`itinerary-destination-${index}`}
                              value={day.destinationId}
                              onChange={(event) => {
                                if (
                                  (day.plannedActivities?.length || day.notes) &&
                                  !confirm(
                                    t(
                                      'Cambiar de destino quitará las actividades de este día. ¿Continuar?',
                                    ),
                                  )
                                )
                                  return;
                                const nextDestination = destinationFor(
                                  collection,
                                  event.target.value,
                                );
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
                                updateDay(index, {
                                  baseMunicipioId: event.target.value || undefined,
                                })
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
                                    day.plannedActivities?.includes(activity.id) ||
                                    day.plannedActivities?.includes(activity.name) ||
                                    false;
                                  return (
                                    <label key={activity.id}>
                                      <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() =>
                                          updateDay(index, {
                                            plannedActivities: selected
                                              ? day.plannedActivities?.filter(
                                                  (id) =>
                                                    id !== activity.id && id !== activity.name,
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
                        <div className={`itinerary-day__readonly ${canEdit ? 'no-print' : ''}`}>
                          {day.baseMunicipioId && (
                            <p>
                              <MapPin /> {t('Base:')}{' '}
                              {municipios.find((item) => item.id === day.baseMunicipioId)?.nombre}
                            </p>
                          )}
                          {canEdit ? (
                            <Field label={t('Notas del día')} htmlFor={`agenda-notes-${index}`}>
                              <textarea
                                id={`agenda-notes-${index}`}
                                maxLength={1200}
                                value={day.notes || ''}
                                placeholder={t('Reservas, horarios, ideas…')}
                                onChange={(event) =>
                                  updateDay(index, { notes: event.target.value })
                                }
                              />
                            </Field>
                          ) : (
                            day.notes && <p>{day.notes}</p>
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
                  {index === activeDay && index < days.length - 1 && (
                    <SegmentBar segment={segments[index]} loading={routesLoading} />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
        <aside className="trip-agenda__aside no-print">
          <article className="trip-agenda__route">
            <p className="kicker">{t('Tu ruta')}</p>
            <h3>{collection.nombre}</h3>
            {days
              .filter(
                (day, index) => index === 0 || days[index - 1].destinationId !== day.destinationId,
              )
              .map((day, index) => (
                <Link key={`${day.destinationId}-${index}`} to={`/destino/${day.destinationId}`}>
                  {destinationFor(collection, day.destinationId)?.nombre || day.destinationId}
                </Link>
              ))}
          </article>
          {budget}
          <article className="trip-agenda__route">
            <p className="kicker">{t('El grupo')}</p>
            <h3>
              {collection.travelerCount || 2} {t('viajeros')}
            </h3>
            <p>
              {t('{0} colaboradores con acceso al plan.', { 0: collection.members?.length || 0 })}
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
}

export default ItineraryBuilder;
