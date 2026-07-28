import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Check, Loader2, Bookmark } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getCollectionsForDestino,
  addToCollection,
  removeFromCollection,
  createCollection,
} from '../../api/collections';
import { COLLECTION_COLORS, colorHex } from '../../constants/collectionColors';
import type { CollectionForDestino } from '../../types/collection';

interface Props {
  destinoId: string;
  destinoNombre?: string;
  onClose: () => void;
}

export default function AddToCollectionModal({ destinoId, destinoNombre, onClose }: Props) {
  const { token } = useAuth();
  const [collections, setCollections] = useState<CollectionForDestino[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('emerald');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getCollectionsForDestino(destinoId, token, controller.signal)
      .then((data) => setCollections(data))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [destinoId, token]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const toggle = async (c: CollectionForDestino) => {
    if (!token || busyId) return;
    setBusyId(c.id);
    try {
      if (c.contains) await removeFromCollection(c.id, destinoId, token);
      else await addToCollection(c.id, destinoId, token);
      setCollections((prev) => prev.map((x) => (x.id === c.id ? { ...x, contains: !x.contains } : x)));
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newName.trim() || creating) return;
    setCreating(true);
    try {
      const created = await createCollection({ nombre: newName, color: newColor }, token);
      await addToCollection(created.id, destinoId, token);
      setCollections((prev) => [
        { id: created.id, nombre: created.nombre, color: created.color, contains: true },
        ...prev,
      ]);
      setNewName('');
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  };

  return createPortal(
    <div className="collection-modal">
      <div className="collection-modal__backdrop" onClick={onClose} aria-hidden />
      <div className="collection-modal__panel">
        <div className="collection-modal__header">
          <div className="collection-modal__header-title">
            <Bookmark className="icon-md" style={{ color: 'var(--color-brand-dark)' }} />
            <div>
              <h2 className="collection-modal__title">Guardar en colección</h2>
              {destinoNombre && <p className="collection-modal__subtitle">{destinoNombre}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="collection-modal__close" aria-label="Cerrar">
            <X className="icon-md" />
          </button>
        </div>

        <div className="collection-modal__body">
          {loading ? (
            <div className="collection-modal__loading">
              <Loader2 className="icon-md icon-brand icon-spin" />
            </div>
          ) : collections.length === 0 && !showForm ? (
            <p className="collection-modal__empty">
              Aún no tienes colecciones. Crea la primera para organizar tus viajes.
            </p>
          ) : (
            <ul className="collection-modal__list">
              {collections.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    disabled={busyId === c.id}
                    className="collection-modal__item-btn"
                  >
                    <span className="collection-modal__item-dot" style={{ backgroundColor: colorHex(c.color) }} />
                    <span className="collection-modal__item-name">{c.nombre}</span>
                    {busyId === c.id ? (
                      <Loader2 className="icon-md icon-muted icon-spin" />
                    ) : c.contains ? (
                      <span className="collection-modal__check">
                        <Check className="icon-sm" />
                      </span>
                    ) : (
                      <span className="collection-modal__check collection-modal__check--empty" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="collection-modal__footer">
          {showForm ? (
            <form onSubmit={handleCreate} className="collection-modal__form">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={80}
                placeholder="Nombre (p. ej. Verano 2026)"
                className="ui-input"
              />
              <div className="colecciones-form__colors">
                {COLLECTION_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setNewColor(col.id)}
                    className={`colecciones-color-btn colecciones-color-btn--round ${newColor === col.id ? 'is-selected' : ''}`}
                    style={{ backgroundColor: col.hex, color: col.hex }}
                    aria-label={col.label}
                  />
                ))}
              </div>
              <div className="collection-modal__form-actions">
                <button type="submit" disabled={!newName.trim() || creating} className="btn-cta">
                  {creating ? 'Creando...' : 'Crear y guardar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="collection-modal__new-btn"
            >
              <Plus className="icon-sm" /> Nueva colección
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
