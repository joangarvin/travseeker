import { DayActivities } from '../features/itinerary/components/DayActivities';
import { ItineraryDayEditor } from '../features/itinerary/components/ItineraryDayEditor';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n';
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  Download,
  GripVertical,
  MapPin,
  Plus,
  Printer,
  Route,
  Save,
  Trash2,
} from 'lucide-react';
import type { CollectionDetail, ItineraryDay } from '../types';
import { downloadICalFile, generateGoogleCalendarUrl } from '../utils/itineraryExport';
import { Button, Dialog, Empty, Field, MediaImage, Notice } from './ui';
import { imageUrl } from '../utils';
import { destinationFor, normalizeDays } from '../features/itinerary/itineraryModel';
import {
  activityName,
  formatDayDate,
  formatDuration,
} from '../features/itinerary/itineraryPresentation';
import { SegmentBar } from '../features/itinerary/components/SegmentBar';
import { useItineraryEditor } from '../features/itinerary/hooks/useItineraryEditor';
import { useItineraryRoutes } from '../features/itinerary/hooks/useItineraryRoutes';

type ItineraryBuilderProps = {
  collection: CollectionDetail;
  canEdit?: boolean;
  onSave?: (itinerary: ItineraryDay[], endDate?: string) => Promise<void>;
  onDirtyChange?: (dirty: boolean) => void;
  onDraftChange?: (days: ItineraryDay[]) => void;
  budget?: ReactNode;
  focusDay?: { index: number };
};

export function ItineraryBuilder({
  collection,
  canEdit = false,
  onSave,
  onDirtyChange,
  onDraftChange,
  budget,
  focusDay,
}: ItineraryBuilderProps) {
  const editor = useItineraryEditor({
    collection,
    canEdit,
    onSave,
    onDirtyChange,
    onDraftChange,
    focusDay,
  });
  const {
    days,
    setDays,
    savedItinerary,
    activeDay,
    setSelectedDay,
    editingDay,
    setEditingDay,
    setAddingActivity,
    draggedIndex,
    saving,
    feedback,
    setFeedback,
    feedbackTone,
    setFeedbackTone,
    generationOpen,
    setGenerationOpen,
    previousRoute,
    dirty,
    extendsDates,
    suggestedDraft,
    hasDates,
    updateDay,
    moveDay,
    dropDay,
    addDay,
    autoGenerate,
    improveRoute,
    undoRoute,
    save,
  } = editor;
  const {
    segments,
    routesLoading,
    totalDistance,
    totalDuration,
    exactRouteCount,
    fallbackRouteCount,
    unavailableRouteCount,
    hasPartialRoute,
  } = useItineraryRoutes(collection, days);

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

                      <DayActivities
                        day={day}
                        destination={destination}
                        index={index}
                        canEdit={canEdit}
                        editor={editor}
                      />
                      {canEdit && editingDay === index ? (
                        <ItineraryDayEditor
                          collection={collection}
                          destination={destination}
                          day={day}
                          index={index}
                          onChange={(patch) => updateDay(index, patch)}
                        />
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
