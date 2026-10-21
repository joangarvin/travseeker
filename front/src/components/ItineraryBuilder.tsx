import { DayActivities } from '../features/itinerary/components/DayActivities';
import { ItineraryDayEditor } from '../features/itinerary/components/ItineraryDayEditor';
import { useRef, useState, type ReactNode } from 'react';
import {
  AgendaDateStrip,
  AgendaDayArrows,
  AgendaRouteSummary,
} from '../features/itinerary/components/AgendaNavigation';
import { Link } from 'react-router-dom';
import { t } from '../i18n';
import {
  ArrowDown,
  ArrowUp,
  CalendarPlus,
  CalendarDays,
  Check,
  Clock3,
  CircleDot,
  StickyNote,
  WandSparkles,
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
import { Button, Dialog, Empty, Field, MediaImage, Notice, Toast } from './ui';
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

  const [animateDay, setAnimateDay] = useState(false);
  const [notesIndex, setNotesIndex] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [baseIndex, setBaseIndex] = useState<number | null>(null);
  const [baseDraft, setBaseDraft] = useState('');
  const noteInput = useRef<HTMLTextAreaElement>(null);
  const selectDay = (index: number) => {
    setSelectedDay(index);
    setEditingDay(null);
    setAddingActivity(null);
    setNotesIndex(null);
    setBaseIndex(null);
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
    <section
      className="itinerary-builder trip-agenda trip-agenda--agenda"
      aria-labelledby="itinerary-builder-title"
      data-day-motion={animateDay ? 'on' : 'off'}
      onPointerDownCapture={() => setAnimateDay(true)}
      onKeyDownCapture={() => setAnimateDay(false)}
    >
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
      <div className="trip-agenda__intro">
        <header className="itinerary-builder__header">
          <div>
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

        <div className="itinerary-summary" aria-live="polite" aria-busy={routesLoading}>
          <span>
            <CalendarDays aria-hidden="true" />
            <b>{days.length}</b> {days.length === 1 ? t('día') : t('días')}
          </span>
          <span>
            <Route aria-hidden="true" />
            <b>
              {routesLoading ? '…' : `${hasPartialRoute ? '≈' : ''}${Math.round(totalDistance)} km`}
            </b>{' '}
            {unavailableRouteCount ? t('distancia parcial') : t('distancia estimada')}
          </span>
          <span>
            <Clock3 aria-hidden="true" />
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
      </div>

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
        <div
          className="itinerary-builder__toolbar no-print"
          aria-label={t('Herramientas del itinerario')}
        >
          <div className="trip-agenda__tools">
            <Button
              variant="secondary"
              disabled={saving}
              onClick={() => (days.length ? setGenerationOpen(true) : autoGenerate())}
            >
              <WandSparkles aria-hidden="true" /> {t('Autogenerar')}
            </Button>
            <Button variant="secondary" disabled={saving || days.length < 3} onClick={improveRoute}>
              <Route aria-hidden="true" /> {t('Mejorar ruta')}
            </Button>
            {previousRoute && (
              <Button variant="secondary" disabled={saving} onClick={undoRoute}>
                {t('Deshacer ruta')}
              </Button>
            )}
            <Button variant="secondary" disabled={saving} onClick={addDay}>
              <Plus aria-hidden="true" /> {t('Añadir día')}
            </Button>
          </div>
          <div className="trip-agenda__save">
            <span
              className="trip-agenda__save-status"
              data-state={saving ? 'saving' : dirty || suggestedDraft ? 'pending' : 'saved'}
              role="status"
              key={saving ? 'saving' : dirty || suggestedDraft ? 'pending' : 'saved'}
            >
              {dirty || suggestedDraft || saving ? (
                <CircleDot aria-hidden="true" />
              ) : (
                <Check aria-hidden="true" />
              )}
              {saving
                ? t('Guardando…')
                : suggestedDraft
                  ? t('Propuesta sin guardar')
                  : dirty
                    ? t('Cambios sin guardar')
                    : t('Todo guardado')}
            </span>
            <Button
              loading={saving}
              loadingLabel={t('Guardando…')}
              disabled={!dirty}
              onClick={() => void save()}
            >
              <Save aria-hidden="true" /> {t('Guardar cambios')}
            </Button>
          </div>
        </div>
      )}
      {feedback &&
        (feedbackTone === 'error' ? (
          <Notice tone="error">
            {feedback}
            {t('. Revisa tu conexión y vuelve a intentarlo.')}
          </Notice>
        ) : (
          <Toast duration={4000} onDismiss={() => setFeedback('')}>
            {feedback}
          </Toast>
        ))}

      <AgendaDateStrip
        days={days}
        selected={activeDay}
        onSelect={selectDay}
        collection={collection}
      />
      <div className="trip-agenda__layout">
        <div className="trip-agenda__main">
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
                        <span className="agenda-day-count">
                          {index + 1} / {days.length}
                        </span>
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

                      <div className={`agenda-base ${canEdit ? 'no-print' : ''}`}>
                        <MapPin aria-hidden="true" />
                        <span>
                          {day.baseMunicipioId ? (
                            <>
                              {t('Base en')}{' '}
                              <strong>
                                {municipios.find((item) => item.id === day.baseMunicipioId)
                                  ?.nombre || t('Municipio')}
                              </strong>
                            </>
                          ) : (
                            t('Sin base concreta')
                          )}
                        </span>
                        {canEdit && editingDay !== index && (
                          <button
                            onClick={() => {
                              setBaseIndex(index);
                              setBaseDraft(day.baseMunicipioId || '');
                            }}
                          >
                            {t('Cambiar')}
                            <span className="sr-only"> {t('Municipio base')}</span>
                          </button>
                        )}
                      </div>

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
                        (canEdit || day.notes) && (
                          <section className={`agenda-notes ${canEdit ? 'no-print' : ''}`}>
                            <StickyNote aria-hidden="true" />
                            <div>
                              <h4>{t('Notas del día')}</h4>
                              <p>
                                {day.notes ||
                                  t('Guarda aquí ideas, recordatorios o detalles de tu plan.')}
                              </p>
                            </div>
                            {canEdit && (
                              <button
                                onClick={() => {
                                  setNotesIndex(index);
                                  setNoteDraft(day.notes || '');
                                }}
                              >
                                {day.notes ? t('Editar') : t('Añadir')}
                                <span className="sr-only"> {t('Notas del día')}</span>
                              </button>
                            )}
                          </section>
                        )
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
          <AgendaDayArrows days={days} selected={activeDay} onSelect={selectDay} />
        </div>
        <aside className="trip-agenda__aside no-print">
          <AgendaRouteSummary
            days={days}
            selected={activeDay}
            onSelect={selectDay}
            collection={collection}
          />
          {budget}
        </aside>
      </div>
      {canEdit && notesIndex !== null && days[notesIndex] && (
        <Dialog
          className="agenda-notes-dialog"
          title={t('Notas · Día {0}', { 0: notesIndex + 1 })}
          onClose={() => setNotesIndex(null)}
          initialFocusRef={noteInput}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              updateDay(notesIndex, { notes: noteDraft.trim() });
              setNotesIndex(null);
            }}
          >
            <Field label={t('Notas del día')} htmlFor="agenda-note-draft">
              <textarea
                ref={noteInput}
                id="agenda-note-draft"
                rows={5}
                maxLength={1200}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder={t('Reservas, horarios, ideas…')}
              />
            </Field>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setNotesIndex(null)}>
                {t('Cancelar')}
              </Button>
              <Button type="submit">{t('Aplicar nota')}</Button>
            </div>
          </form>
        </Dialog>
      )}
      {canEdit && baseIndex !== null && days[baseIndex] && (
        <Dialog
          className="agenda-base-dialog"
          title={t('Municipio base')}
          description={destinationFor(collection, days[baseIndex].destinationId)?.nombre}
          onClose={() => setBaseIndex(null)}
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              updateDay(baseIndex, { baseMunicipioId: baseDraft || undefined });
              setBaseIndex(null);
            }}
          >
            <Field label={t('Municipio base')} htmlFor="agenda-base-draft">
              <select
                id="agenda-base-draft"
                value={baseDraft}
                onChange={(event) => setBaseDraft(event.target.value)}
              >
                <option value="">{t('Sin base concreta')}</option>
                {destinationFor(collection, days[baseIndex].destinationId)?.municipios?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setBaseIndex(null)}>
                {t('Cancelar')}
              </Button>
              <Button type="submit">{t('Cambiar base')}</Button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}

export default ItineraryBuilder;
