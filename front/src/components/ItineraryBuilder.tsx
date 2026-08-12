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

type ItineraryBuilderProps = {
  collection: CollectionDetail;
  canEdit?: boolean;
  onSave?: (itinerary: ItineraryDay[]) => Promise<void>;
};

const EMPTY_ITINERARY: ItineraryDay[] = [];

function isoDate(value: string | null | undefined): string | undefined {
  return value?.slice(0, 10) || undefined;
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function dayCount(startDate?: string | null, endDate?: string | null): number | undefined {
  const start = isoDate(startDate);
  const end = isoDate(endDate);
  if (!start || !end) return undefined;
  const difference =
    (new Date(`${end}T00:00:00.000Z`).getTime() - new Date(`${start}T00:00:00.000Z`).getTime()) /
    86_400_000;
  return Math.min(366, Math.max(1, Math.round(difference) + 1));
}

function normalizeDays(days: ItineraryDay[], startDate?: string | null): ItineraryDay[] {
  const start = isoDate(startDate);
  return days.map((day, index) => ({
    ...day,
    dayNumber: index + 1,
    date: start ? addDays(start, index) : day.date,
  }));
}

export function generateItinerary(collection: CollectionDetail): ItineraryDay[] {
  if (!collection.items.length) return [];
  const count = dayCount(collection.startDate, collection.endDate) ?? collection.items.length;
  const start = isoDate(collection.startDate);
  return Array.from({ length: count }, (_, index) => {
    const destination = collection.items[index % collection.items.length].destino;
    return {
      dayNumber: index + 1,
      date: start ? addDays(start, index) : undefined,
      destinationId: destination.id,
      baseMunicipioId: destination.municipios?.[0]?.id,
      plannedActivities: [],
    };
  });
}

function formatDayDate(value?: string): string {
  if (!value) return 'Fecha abierta';
  return new Intl.DateTimeFormat('es-ES', {
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
  return destination?.activities?.find((activity) => activity.id === value)?.name || value;
}

function SegmentBar({ segment, loading }: { segment?: RouteSegment; loading: boolean }) {
  if (loading) {
    return (
      <div className="route-segment route-segment--loading" role="status">
        Calculando siguiente trayecto…
      </div>
    );
  }
  if (!segment || segment.source === 'unavailable') {
    return (
      <div className="route-segment route-segment--unavailable">
        <CarFront /> Trayecto sin calcular · faltan coordenadas
      </div>
    );
  }
  return (
    <div className="route-segment">
      <CarFront />
      <span>
        {segment.source === 'osrm' ? 'En coche' : 'Distancia aproximada'} ·{' '}
        <b>{Math.round(segment.distanceKm || 0)} km</b> · {formatDuration(segment.durationMinutes)}
      </span>
    </div>
  );
}

export function ItineraryBuilder({ collection, canEdit = false, onSave }: ItineraryBuilderProps) {
  const savedItinerary = collection.itinerary ?? EMPTY_ITINERARY;
  const initialDays = savedItinerary.length
    ? normalizeDays(savedItinerary, collection.startDate)
    : generateItinerary(collection);
  const [days, setDays] = useState<ItineraryDay[]>(initialDays);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const draggedIndex = useRef<number | null>(null);

  useEffect(() => {
    setDays(
      savedItinerary.length
        ? normalizeDays(savedItinerary, collection.startDate)
        : generateItinerary(collection),
    );
  }, [savedItinerary, collection.items, collection.startDate, collection.endDate]);

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
  }, [collection, routeSignature]);

  const totalDistance = useMemo(
    () => segments.reduce((total, segment) => total + (segment.distanceKm || 0), 0),
    [segments],
  );
  const totalDuration = useMemo(
    () => segments.reduce((total, segment) => total + (segment.durationMinutes || 0), 0),
    [segments],
  );
  const savedDays = savedItinerary.length
    ? normalizeDays(savedItinerary, collection.startDate)
    : generateItinerary(collection);
  const dirty = JSON.stringify(days) !== JSON.stringify(savedDays);
  const hasDates = days.some((day) => resolveItineraryDate(day, collection));

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
    if (dirty && !confirm('¿Regenerar el itinerario? Se reemplazarán los cambios sin guardar.'))
      return;
    setFeedback('');
    setDays(generateItinerary(collection));
  };

  const save = async () => {
    if (!onSave) return;
    setSaving(true);
    setFeedback('');
    try {
      await onSave(days);
      setFeedback('Itinerario guardado');
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'No se pudo guardar el itinerario');
    } finally {
      setSaving(false);
    }
  };

  const exportICal = () => {
    if (!downloadICalFile({ ...collection, itinerary: days })) {
      setFeedback('Añade una fecha de inicio para exportar el calendario');
    }
  };

  if (!collection.items.length) {
    return (
      <Empty icon={<Route />} title="La ruta necesita al menos un destino">
        Añade destinos al viaje y vuelve aquí para organizarlos por días.
      </Empty>
    );
  }

  return (
    <section className="itinerary-builder" aria-labelledby="itinerary-builder-title">
      <div className="itinerary-builder__print-title print-only">
        <p>TravSeeker · Itinerario</p>
        <h1>{collection.nombre}</h1>
        {collection.descripcion && <p>{collection.descripcion}</p>}
      </div>
      <header className="itinerary-builder__header">
        <div>
          <p className="kicker">La ruta completa</p>
          <h2 id="itinerary-builder-title">Día a día</h2>
          <p>
            {canEdit
              ? 'Ordena las paradas, elige dónde hacer base y anota el plan.'
              : 'La secuencia compartida del viaje, parada a parada.'}
          </p>
        </div>
        <div className="itinerary-builder__exports no-print">
          <Button variant="secondary" disabled={!hasDates} onClick={exportICal}>
            <Download /> iCal
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer /> Imprimir / PDF
          </Button>
        </div>
      </header>

      <div className="itinerary-summary" aria-live="polite">
        <span>
          <b>{days.length}</b> {days.length === 1 ? 'día' : 'días'}
        </span>
        <span>
          <b>{routesLoading ? '…' : `${Math.round(totalDistance)} km`}</b> distancia estimada
        </span>
        <span>
          <b>{routesLoading ? '…' : formatDuration(totalDuration)}</b> en carretera
        </span>
      </div>

      {canEdit && (
        <div className="itinerary-builder__toolbar no-print">
          <Button variant="secondary" onClick={autoGenerate}>
            <Route /> Autogenerar
          </Button>
          <Button variant="secondary" onClick={addDay}>
            <Plus /> Añadir día
          </Button>
          <Button loading={saving} disabled={!dirty} onClick={() => void save()}>
            <Save /> Guardar cambios
          </Button>
          <span>{dirty ? 'Cambios sin guardar' : 'Todo guardado'}</span>
        </div>
      )}
      {feedback && (
        <Notice tone={feedback === 'Itinerario guardado' ? 'success' : 'info'}>{feedback}</Notice>
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
                      <small>Día {day.dayNumber}</small>
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
                          aria-label={`Subir día ${day.dayNumber}`}
                        >
                          <ArrowUp />
                        </button>
                        <button
                          type="button"
                          disabled={index === days.length - 1}
                          onClick={() => moveDay(index, index + 1)}
                          aria-label={`Bajar día ${day.dayNumber}`}
                        >
                          <ArrowDown />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDays((current) =>
                              normalizeDays(
                                current.filter((_, dayIndex) => dayIndex !== index),
                                collection.startDate,
                              ),
                            )
                          }
                          aria-label={`Eliminar día ${day.dayNumber}`}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    )}
                  </header>

                  {canEdit ? (
                    <div className="itinerary-day__fields no-print">
                      <Field label="Destino" htmlFor={`itinerary-destination-${index}`}>
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
                      <Field label="Municipio base" htmlFor={`itinerary-base-${index}`}>
                        <select
                          id={`itinerary-base-${index}`}
                          value={day.baseMunicipioId || ''}
                          onChange={(event) =>
                            updateDay(index, { baseMunicipioId: event.target.value || undefined })
                          }
                        >
                          <option value="">Sin base concreta</option>
                          {municipios.map((municipio) => (
                            <option key={municipio.id} value={municipio.id}>
                              {municipio.nombre}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Notas del día" htmlFor={`itinerary-notes-${index}`}>
                        <textarea
                          id={`itinerary-notes-${index}`}
                          maxLength={1200}
                          value={day.notes || ''}
                          placeholder="Reservas, horarios, ideas…"
                          onChange={(event) => updateDay(index, { notes: event.target.value })}
                        />
                      </Field>
                      {!!activities.length && (
                        <fieldset className="itinerary-activities">
                          <legend>Actividades</legend>
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
                                  <span>{activity.name}</span>
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
                          <MapPin /> Base:{' '}
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
                          <MapPin /> Base:{' '}
                          {municipios.find((item) => item.id === day.baseMunicipioId)?.nombre}
                        </p>
                      )}
                      {day.notes && <p>{day.notes}</p>}
                      {!!day.plannedActivities?.length && (
                        <p>
                          Actividades:{' '}
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
                    <CalendarPlus /> Añadir a Google Calendar
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
