import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Plus, Trash2 } from 'lucide-react';
import { Button, Empty, MediaImage, Notice } from '../../../components/ui';
import type { CollectionDetail } from '../../../types';
import { imageUrl } from '../../../utils';
import { t } from '../../../i18n';

type Props = {
  collection: CollectionDetail;
  canEdit: boolean;
  pending: boolean;
  onOpenDay: (day: number) => void;
  onRemove: (id: string) => Promise<void>;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
};
export function TripDestinations({
  collection,
  canEdit,
  pending,
  onOpenDay,
  onRemove,
  onSaveNotes,
}: Props) {
  const [editing, setEditing] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const save = async (id: string) => {
    setSaving(true);
    setError('');
    try {
      await onSaveNotes(id, notes);
      setEditing(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudieron guardar las notas'));
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="trip-destinations">
      <header className="trip-section-heading">
        <div>
          <p className="kicker">{t('Los lugares de tu viaje')}</p>
          <h2>{t('Destino a destino')}</h2>
          <p>{t('Tus paradas, sus días y las ideas que quieres llevar contigo.')}</p>
        </div>
        {canEdit && (
          <Link className="button button--primary" to="/">
            <Plus />
            {t('Descubrir destinos')}
          </Link>
        )}
      </header>
      {error && <Notice tone="error">{error}</Notice>}
      {collection.items.length ? (
        <div className="trip-destinations__grid">
          {collection.items.map((item) => {
            const assigned = collection.itinerary
              .map((day, index) => ({ day, index }))
              .filter(({ day }) => day.destinationId === item.destino.id);
            const activities = assigned.reduce(
              (sum, { day }) => sum + (day.plannedActivities?.length || 0),
              0,
            );
            return (
              <article className="trip-destination" key={item.id}>
                <Link className="trip-destination__photo" to={`/destino/${item.destino.id}`}>
                  <MediaImage
                    src={imageUrl(item.destino.imagen)}
                    alt={item.destino.nombre}
                    loading="lazy"
                  />
                  <span>
                    <MapPin />
                    {item.destino.ubicacion}
                  </span>
                </Link>
                <div className="trip-destination__body">
                  <h3>
                    <Link to={`/destino/${item.destino.id}`}>{item.destino.nombre}</Link>
                  </h3>
                  <p className="muted">
                    {assigned.length} {t('días planificados')} · {activities} {t('actividades')}
                  </p>
                  <div className="trip-destination__days">
                    {assigned.map(({ day, index }) => (
                      <button type="button" key={index} onClick={() => onOpenDay(index)}>
                        {t('Día')} {day.dayNumber}
                      </button>
                    ))}
                  </div>
                  {!assigned.length && (
                    <p className="trip-destination__unplanned">
                      {t('Todavía sin día asignado. Abre la agenda para preparar esta parada.')}
                    </p>
                  )}
                  {editing === item.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void save(item.destino.id);
                      }}
                    >
                      <label htmlFor={`destination-notes-${item.id}`}>
                        {t('Notas del destino')}
                      </label>
                      <textarea
                        id={`destination-notes-${item.id}`}
                        maxLength={500}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        autoFocus
                      />
                      <div className="trip-destination__actions">
                        <Button type="submit" loading={saving}>
                          {t('Guardar notas')}
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={saving}
                          onClick={() => setEditing(null)}
                        >
                          {t('Cancelar')}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <p className="trip-destination__notes">
                      {item.notas ||
                        t('Anota recomendaciones, reservas o ideas para este destino.')}
                    </p>
                  )}
                  <div className="trip-destination__actions">
                    <Link className="button button--secondary" to={`/destino/${item.destino.id}`}>
                      {t('Ver guía')}
                    </Link>
                    {canEdit && (
                      <>
                        <Button
                          variant="secondary"
                          disabled={saving}
                          onClick={() => {
                            setEditing(item.id);
                            setNotes(item.notas || '');
                            setError('');
                          }}
                        >
                          {t('Editar notas')}
                        </Button>
                        <button
                          className="trip-destination__remove"
                          type="button"
                          disabled={pending || saving}
                          aria-label={t('Quitar {0}', { 0: item.destino.nombre })}
                          onClick={() => {
                            if (confirm(t('¿Quitar este destino y sus días del viaje?')))
                              void onRemove(item.destino.id);
                          }}
                        >
                          <Trash2 />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty icon={<MapPin />} title={t('El viaje está vacío')}>
          {t('Añade destinos desde sus fichas para empezar a darle forma.')}
          {canEdit && (
            <Link className="button button--primary" to="/">
              {t('Descubrir destinos')}
            </Link>
          )}
        </Empty>
      )}
    </section>
  );
}
