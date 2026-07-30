import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Trash2, Check, GripVertical } from 'lucide-react';
import { getImageUrl } from '../../utils/images';
import { parseJsonSafe } from '../../utils/parseJson';
import { useAuth } from '../../context/AuthContext';
import { updateCollectionItem, removeFromCollection } from '../../api/collections';
import type { CollectionItem } from '../../types/collection';

interface Props {
  collectionId: string;
  item: CollectionItem;
  onRemove: (destinoId: string) => void;
  onUpdate?: (item: Pick<CollectionItem, 'destinoId' | 'notas' | 'dayIndex' | 'status' | 'sortOrder'>) => void;
  canEdit?: boolean;
  canDrag?: boolean;
}

export default function CollectionItemCard({ collectionId, item, onRemove, onUpdate, canEdit = true, canDrag = false }: Props) {
  const { token } = useAuth();
  const [notas, setNotas] = useState(item.notas ?? '');
  const [savedNotas, setSavedNotas] = useState(item.notas ?? '');
  const [dayIndex, setDayIndex] = useState<number | ''>(item.dayIndex ?? '');
  const [status, setStatus] = useState(item.status);
  const [savedPlanning, setSavedPlanning] = useState(`${item.dayIndex ?? ''}|${item.status}`);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [removing, setRemoving] = useState(false);

  const planningKey = `${dayIndex}|${status}`;
  const dirty = notas !== savedNotas || planningKey !== savedPlanning;

  const saveNotes = async () => {
    if (!token || !dirty || saving) return;
    setSaving(true);
    try {
      const updated = await updateCollectionItem(collectionId, item.destinoId, { notas, dayIndex: dayIndex === '' ? null : dayIndex, status }, token);
      setSavedNotas(notas);
      setSavedPlanning(planningKey);
      onUpdate?.(updated);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1600);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!token || removing) return;
    setRemoving(true);
    try {
      await removeFromCollection(collectionId, item.destinoId, token);
      onRemove(item.destinoId);
    } catch {
      setRemoving(false);
    }
  };

  return (
    <div className="collection-item-card">
      {canDrag && <span className="collection-item-card__drag" data-drag-handle role="button" tabIndex={0} aria-label={`Arrastrar ${item.destino.nombre} para cambiar su posición`}><GripVertical className="icon-md" /><small>Arrastrar</small></span>}
      <Link to={`/destino/${item.destinoId}`} className="collection-item-card__media">
        <img
          src={getImageUrl(item.destino.imagen)}
          alt={item.destino.nombre}
          loading="lazy"
        />
      </Link>

      <div className="collection-item-card__body">
        <div>
          <Link to={`/destino/${item.destinoId}`} className="collection-item-card__title">
            {item.destino.nombre.trim()}
          </Link>
          <p className="collection-item-card__loc">
            <MapPin className="icon-sm" style={{ color: 'var(--color-brand-dark)' }} />
            {parseJsonSafe(item.destino.ubicacion)}
          </p>
        </div>

        <div className="collection-item-card__notes">
          <div className="collection-item-card__planning">
            <label>Día<input type="number" min="1" max="365" value={dayIndex} onChange={(e) => setDayIndex(e.target.value ? Number(e.target.value) : '')} onBlur={saveNotes} readOnly={!canEdit} /></label>
            <label>Estado<select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} onBlur={saveNotes} disabled={!canEdit}><option value="idea">Idea</option><option value="confirmed">Confirmado</option><option value="booked">Reservado</option></select></label>
          </div>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            onBlur={saveNotes}
            rows={2}
            maxLength={500}
            placeholder="Añade una nota (mejor en mayo, reservar hotel...)"
            className="collection-item-card__textarea"
            readOnly={!canEdit}
          />
          <div className="collection-item-card__counter">{notas.length}/500</div>
        </div>

        {canEdit && <div className="collection-item-card__footer">
          <button
            type="button"
            onClick={remove}
            disabled={removing}
            className="collection-item-card__remove"
          >
            <Trash2 className="icon-sm" /> Quitar
          </button>
          {dirty ? (
            <button type="button" onClick={saveNotes} disabled={saving} className="collection-item-card__save">
              {saving ? 'Guardando...' : 'Guardar nota'}
            </button>
          ) : justSaved ? (
            <span className="collection-item-card__saved">
              <Check className="icon-sm" /> Guardado
            </span>
          ) : null}
        </div>}
      </div>
    </div>
  );
}
