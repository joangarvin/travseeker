import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, Check, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, Dialog, Empty, MediaImage, Notice, Toast } from '../../../components/ui';
import type { CollectionDetail } from '../../../types';
import { imageUrl } from '../../../utils';
import { intlLocale, t } from '../../../i18n';
import { destinationDays } from '../destinationsModel';
import { resolveItineraryDate } from '../../../utils/itineraryExport';

type Item = CollectionDetail['items'][number];
type Props = {
  collection: CollectionDetail;
  canEdit: boolean;
  pending: boolean;
  onOpenDay: (index: number) => void;
  onOpenAgenda: () => void;
  onRemove: (id: string) => Promise<void | boolean>;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
};
type Modal = { kind: 'notes' | 'photo' | 'days' | 'remove'; item: Item };
export function TripDestinations({
  collection,
  canEdit,
  pending,
  onOpenDay,
  onOpenAgenda,
  onRemove,
  onSaveNotes,
}: Props) {
  const [modal, setModal] = useState<Modal | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [discard, setDiscard] = useState(false);
  const [keyboard, setKeyboard] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const dirty = modal?.kind === 'notes' && notes !== (modal.item.notas || '');
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  const open = (kind: Modal['kind'], item: Item) => {
    setError('');
    setDiscard(false);
    setNotes(item.notas || '');
    setModal({ kind, item });
  };
  const close = () => {
    if (saving) return;
    if (dirty) {
      setDiscard(true);
      return;
    }
    setModal(null);
    setError('');
  };
  const save = async () => {
    if (!modal || !canEdit || saving || pending) return;
    setSaving(true);
    setError('');
    try {
      await onSaveNotes(modal.item.destino.id, notes);
      setModal(null);
      setSuccess(t('Notas guardadas para {0}', { 0: modal.item.destino.nombre }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudieron guardar las notas'));
    } finally {
      setSaving(false);
    }
  };
  const remove = async () => {
    if (!modal || !canEdit || saving || pending) return;
    setSaving(true);
    setError('');
    try {
      const removed = await onRemove(modal.item.destino.id);
      if (removed === false) return;
      setModal(null);
      setSuccess(t('{0} se ha quitado del viaje', { 0: modal.item.destino.nombre }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudo quitar el destino'));
    } finally {
      setSaving(false);
    }
  };
  const unscheduled = collection.items.filter(
    (item) => !collection.itinerary.some((day) => day.destinationId === item.destino.id),
  ).length;
  const selectedDays = modal ? destinationDays(collection.itinerary, modal.item.destino.id) : [];
  const activities = selectedDays.reduce(
    (sum, { day }) => sum + (day.plannedActivities?.length || 0),
    0,
  );
  return (
    <section
      className="trip-destinations trip-destinations--collection"
      data-keyboard={keyboard || undefined}
      onPointerDownCapture={() => setKeyboard(false)}
      onKeyDownCapture={() => setKeyboard(true)}
    >
      <header className="trip-stops-heading">
        <div>
          <p className="kicker">{t('Los lugares de tu viaje')}</p>
          <h2>{t('Tus próximas paradas.')}</h2>
          <p>
            {t(
              'Las guías y las ideas de cada lugar, juntas. El plan de cada día vive en tu agenda.',
            )}
          </p>
        </div>
        {canEdit && (
          <Link className="button button--primary" to="/">
            <Plus aria-hidden="true" />
            {t('Añadir destino')}
          </Link>
        )}
      </header>
      <div className="trip-stops-meta">
        <span>
          {collection.items.length} {t(collection.items.length === 1 ? 'destino' : 'destinos')}
        </span>
        <span>
          {unscheduled} {t('sin días asignados')}
        </span>
        {!canEdit && <span>{t('Solo lectura')}</span>}
      </div>
      {collection.items.length ? (
        <div className="trip-stops-grid">
          {collection.items.map((item, index) => {
            const assigned = destinationDays(collection.itinerary, item.destino.id);
            return (
              <article className="trip-stop" key={item.id}>
                <button
                  className="trip-stop-photo"
                  type="button"
                  onClick={() => open('photo', item)}
                  aria-label={t('Ver foto de {0}', { 0: item.destino.nombre })}
                >
                  <MediaImage
                    src={imageUrl(item.destino.imagen)}
                    alt={item.destino.nombre}
                    loading="lazy"
                  />
                  <span>
                    {t('Ampliar foto')}
                    <ArrowUpRight aria-hidden="true" />
                  </span>
                </button>
                <div className="trip-stop-body">
                  <p className="trip-stop-location">
                    <MapPin aria-hidden="true" />
                    {item.destino.ubicacion || t('Parada {0}', { 0: index + 1 })}
                  </p>
                  <h3>
                    <Link to={`/destino/${item.destino.id}`}>{item.destino.nombre}</Link>
                  </h3>
                  <p className="trip-stop-description">
                    {item.destino.descripcion ||
                      t('Descubre sus imprescindibles y encuentra ideas para esta parada.')}
                  </p>
                  <button
                    className={`trip-stop-days ${assigned.length ? '' : 'trip-stop-days--empty'}`}
                    type="button"
                    onClick={() => (assigned.length ? open('days', item) : onOpenAgenda())}
                  >
                    <CalendarDays aria-hidden="true" />
                    <span>
                      {assigned.length
                        ? t(
                            assigned.length === 1
                              ? '{0} día en la agenda'
                              : '{0} días en la agenda',
                            { 0: assigned.length },
                          )
                        : t('Sin días asignados')}
                      <small>
                        {assigned.length
                          ? assigned
                              .slice(0, 4)
                              .map(({ day }) => `${t('Día')} ${day.dayNumber}`)
                              .join(' · ') +
                            (assigned.length > 4 ? ` · +${assigned.length - 4}` : '')
                          : t('Ver agenda para planificar')}
                      </small>
                    </span>
                    <ArrowUpRight aria-hidden="true" />
                  </button>
                  <div className="trip-stop-note">
                    <span>{t('Para recordar')}</span>
                    <p className={item.notas ? '' : 'muted'}>
                      {item.notas || t('¿Alguna idea para esta parada? Guárdala aquí.')}
                    </p>
                    {canEdit && (
                      <button
                        type="button"
                        className="trip-stop-edit"
                        disabled={saving || pending}
                        onClick={() => open('notes', item)}
                      >
                        <Pencil aria-hidden="true" />
                        {t(item.notas ? 'Editar nota' : 'Añadir nota')}
                      </button>
                    )}
                  </div>
                  <div className="trip-stop-actions">
                    <Link className="button button--primary" to={`/destino/${item.destino.id}`}>
                      {t('Ver guía')}
                      <ArrowUpRight aria-hidden="true" />
                    </Link>
                    {canEdit && (
                      <button
                        type="button"
                        className="trip-stop-remove"
                        disabled={saving || pending}
                        onClick={() => open('remove', item)}
                        aria-label={t('Quitar {0}', { 0: item.destino.nombre })}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          icon={<MapPin />}
          title={t('El próximo viaje empieza por un lugar.')}
          action={
            canEdit ? (
              <Link className="button button--primary" to="/">
                <Plus aria-hidden="true" />
                {t('Descubrir destinos')}
              </Link>
            ) : undefined
          }
        >
          {t('Añade destinos desde sus fichas para empezar a darle forma.')}
        </Empty>
      )}
      {modal && (
        <Dialog
          title={t(
            modal.kind === 'notes'
              ? 'Ideas para {0}'
              : modal.kind === 'remove'
                ? '¿Quitar {0}?'
                : modal.kind === 'days'
                  ? 'Agenda de {0}'
                  : '{0}',
            { 0: modal.item.destino.nombre },
          )}
          className={`trip-stop-dialog ${modal.kind === 'photo' ? 'trip-stop-dialog--photo' : ''}`}
          onClose={close}
          busy={saving || pending}
          initialFocusRef={modal.kind === 'notes' ? noteRef : undefined}
        >
          <div className="trip-stop-dialog-body">
            {error && <Notice tone="error">{error}</Notice>}
            {modal.kind === 'notes' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void save();
                }}
              >
                <label htmlFor="trip-stop-notes">{t('Nota de esta parada')}</label>
                <textarea
                  id="trip-stop-notes"
                  ref={noteRef}
                  rows={5}
                  maxLength={500}
                  value={notes}
                  disabled={saving || pending}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setDiscard(false);
                  }}
                />
                <p className="trip-stop-note-help">
                  {notes.length}/500 · {t('No modifica las notas de cada día.')}
                </p>
                {discard && (
                  <Notice
                    action={
                      <div className="trip-stop-dialog-actions">
                        <Button variant="secondary" onClick={() => setDiscard(false)}>
                          {t('Seguir editando')}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => {
                            setModal(null);
                            setError('');
                          }}
                        >
                          {t('Descartar nota')}
                        </Button>
                      </div>
                    }
                  >
                    {t('Tienes una nota sin guardar.')}
                  </Notice>
                )}
                <div className="trip-stop-dialog-actions">
                  <Button variant="secondary" disabled={saving || pending} onClick={close}>
                    {t('Cancelar')}
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    loadingLabel={t('Guardando…')}
                    disabled={!dirty || pending}
                  >
                    <Check aria-hidden="true" />
                    {t('Guardar nota')}
                  </Button>
                </div>
              </form>
            )}
            {modal.kind === 'remove' && (
              <>
                <p>
                  {t(
                    'Se quitará este destino junto con sus {0} días y {1} actividades de la agenda.',
                    { 0: selectedDays.length, 1: activities },
                  )}
                </p>
                <p>
                  {t(
                    'También se eliminarán sus notas. Los demás destinos conservarán su información.',
                  )}
                </p>
                <div className="trip-stop-dialog-actions">
                  <Button variant="secondary" disabled={saving || pending} onClick={close}>
                    {t('Cancelar')}
                  </Button>
                  <Button
                    variant="danger"
                    loading={saving}
                    loadingLabel={t('Quitando…')}
                    disabled={pending}
                    onClick={() => void remove()}
                  >
                    {t('Quitar destino y sus días')}
                  </Button>
                </div>
              </>
            )}
            {modal.kind === 'photo' && (
              <>
                <MediaImage
                  src={imageUrl(modal.item.destino.imagen)}
                  alt={modal.item.destino.nombre}
                  sizes="(max-width: 760px) 100vw, 1100px"
                  loading="eager"
                />
                {modal.item.destino.ubicacion && (
                  <p>
                    <MapPin aria-hidden="true" />
                    {modal.item.destino.ubicacion}
                  </p>
                )}
                <Link className="button button--primary" to={`/destino/${modal.item.destino.id}`}>
                  {t('Ver guía')}
                  <ArrowUpRight aria-hidden="true" />
                </Link>
              </>
            )}
            {modal.kind === 'days' && (
              <>
                <p>{t('Elige el día que quieres abrir en la agenda.')}</p>
                <div className="trip-stop-day-list">
                  {selectedDays.map(({ day, index }) => {
                    const date = resolveItineraryDate(day, collection);
                    const count = day.plannedActivities?.length || 0;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setModal(null);
                          onOpenDay(index);
                        }}
                      >
                        <CalendarDays aria-hidden="true" />
                        <span>
                          <strong>
                            {t('Día')} {day.dayNumber}
                            {date
                              ? ` · ${new Date(`${date.slice(0, 10)}T00:00:00Z`).toLocaleDateString(intlLocale, { day: 'numeric', month: 'short', timeZone: 'UTC' })}`
                              : ''}
                          </strong>
                          <small>
                            {count} {t(count === 1 ? 'actividad' : 'actividades')}
                          </small>
                        </span>
                        <ArrowUpRight aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </Dialog>
      )}
      {success && (
        <Toast duration={4500} onDismiss={() => setSuccess('')}>
          {success}
        </Toast>
      )}
    </section>
  );
}
