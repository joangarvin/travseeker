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
    <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden shadow-sm flex flex-col">
      <Link to={`/destino/${item.destinoId}`} className="relative block h-40 overflow-hidden group">
        <img
          src={getImageUrl(item.destino.imagen)}
          alt={item.destino.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold leading-tight">{item.destino.nombre.trim()}</h3>
          <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" />
            {parseJsonSafe(item.destino.ubicacion)}
          </p>
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          onBlur={saveNotes}
          rows={2}
          maxLength={500}
          placeholder="Añade una nota (mejor en mayo, reservar hotel...)"
          className="w-full text-sm px-3 py-2 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] resize-none"
        />
        <div className="text-[11px] text-[var(--color-muted)]">{notas.length}/500</div>
        <div className="flex items-center justify-between">
          <button
            onClick={remove}
            disabled={removing}
            className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" /> Quitar
          </button>
          {dirty ? (
            <button onClick={saveNotes} disabled={saving} className="text-xs font-semibold text-[var(--color-brand-dark)] px-2.5 py-1.5 rounded-md hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar nota'}
            </button>
          ) : justSaved ? (
            <span className="text-xs text-[var(--color-brand-dark)] flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Guardado
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
