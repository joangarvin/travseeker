import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Trash2, Check } from 'lucide-react';
import { getImageUrl } from '../../utils/images';
import { parseJsonSafe } from '../../utils/parseJson';
import { useAuth } from '../../context/AuthContext';
import { updateItemNotes, removeFromCollection } from '../../api/collections';
import type { CollectionItem } from '../../types/collection';

interface Props {
  collectionId: string;
  item: CollectionItem;
  onRemove: (destinoId: string) => void;
}

export default function CollectionItemCard({ collectionId, item, onRemove }: Props) {
  const { token } = useAuth();
  const [notas, setNotas] = useState(item.notas ?? '');
  const [savedNotas, setSavedNotas] = useState(item.notas ?? '');
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [removing, setRemoving] = useState(false);

  const dirty = notas !== savedNotas;

  const saveNotes = async () => {
    if (!token || !dirty || saving) return;
    setSaving(true);
    try {
      await updateItemNotes(collectionId, item.destinoId, notas, token);
      setSavedNotas(notas);
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
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            onBlur={saveNotes}
            rows={2}
            maxLength={500}
            placeholder="Añade una nota (mejor en mayo, reservar hotel...)"
            className="collection-item-card__textarea"
          />
          <div className="collection-item-card__counter">{notas.length}/500</div>
        </div>

        <div className="collection-item-card__footer">
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
        </div>
      </div>
    </div>
  );
}
