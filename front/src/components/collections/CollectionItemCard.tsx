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
    <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] overflow-hidden hover:border-[var(--color-brand)]/40 hover:shadow-md transition-all duration-300 flex flex-col shadow-sm">
      <Link to={`/destino/${item.destinoId}`} className="relative block h-40 overflow-hidden group shrink-0">
        <img
          src={getImageUrl(item.destino.imagen)}
          alt={item.destino.nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      <div className="p-4 flex flex-col gap-3.5 flex-1">
        <div className="space-y-1">
          <Link to={`/destino/${item.destinoId}`} className="block">
            <h3 className="font-semibold text-[var(--color-primary)] leading-tight hover:text-[var(--color-brand-dark)] transition-colors">{item.destino.nombre.trim()}</h3>
          </Link>
          <p className="text-[var(--color-muted)] text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3 text-[var(--color-brand-dark)] shrink-0" />
            {parseJsonSafe(item.destino.ubicacion)}
          </p>
        </div>

        <div className="space-y-1 pt-2.5 border-t border-[var(--color-border)]">
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            onBlur={saveNotes}
            rows={2}
            maxLength={500}
            placeholder="Añade una nota (mejor en mayo, reservar hotel...)"
            className="w-full text-xs px-3 py-2 rounded-lg bg-[var(--color-secondary)] border border-[var(--color-border-strong)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/35 resize-none leading-relaxed"
          />
          <div className="text-[10px] text-[var(--color-muted)] text-right">{notas.length}/500</div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <button
            onClick={remove}
            disabled={removing}
            className="flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors disabled:opacity-50 font-medium"
          >
            <Trash2 className="w-3.5 h-3.5" /> Quitar
          </button>
          {dirty ? (
            <button onClick={saveNotes} disabled={saving} className="text-xs font-semibold text-[var(--color-brand-dark)] px-2.5 py-1.5 rounded-md hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar nota'}
            </button>
          ) : justSaved ? (
            <span className="text-xs text-[var(--color-brand-dark)] flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" /> Guardado
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
