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
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-[var(--color-primary)]/45" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[var(--color-surface)] rounded-t-lg sm:rounded-lg border border-[var(--color-border-strong)] max-h-[82vh] flex flex-col animate-fade-up" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-5 h-5 text-[var(--color-brand-dark)]" />
            <div>
              <h2 className="font-semibold text-[var(--color-primary)] leading-tight">Guardar en colección</h2>
              {destinoNombre && <p className="text-xs text-[var(--color-muted)] truncate max-w-[240px]">{destinoNombre}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-secondary)] transition-colors" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-[var(--color-brand)] animate-spin" /></div>
          ) : collections.length === 0 && !showForm ? (
            <p className="text-center text-sm text-[var(--color-muted)] py-6">
              Aún no tienes colecciones. Crea la primera para organizar tus viajes.
            </p>
          ) : (
            <ul className="space-y-1">
              {collections.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    disabled={busyId === c.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--color-secondary)] transition-colors text-left disabled:opacity-60"
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: colorHex(c.color) }} />
                    <span className="flex-1 text-[var(--color-primary)] font-medium truncate">{c.nombre}</span>
                    {busyId === c.id ? (
                      <Loader2 className="w-5 h-5 text-[var(--color-muted)] animate-spin" />
                    ) : c.contains ? (
                      <span className="w-6 h-6 rounded-full bg-[var(--color-brand)] text-[var(--color-on-brand)] flex items-center justify-center">
                        <Check className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full border-2 border-[var(--color-border-strong)]" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[var(--color-border)] p-3">
          {showForm ? (
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={80}
                placeholder="Nombre (p. ej. Verano 2026)"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border-strong)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
              />
              <div className="flex items-center gap-2">
                {COLLECTION_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setNewColor(col.id)}
                    className={`w-7 h-7 rounded-full transition-transform ${newColor === col.id ? 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)] scale-110' : ''}`}
                    style={{ backgroundColor: col.hex, '--tw-ring-color': col.hex } as React.CSSProperties}
                    aria-label={col.label}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={!newName.trim() || creating} className="flex-1 py-2.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50">
                  {creating ? 'Creando...' : 'Crear y guardar'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-xl text-[var(--color-muted)] hover:bg-[var(--color-secondary)] transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--color-border-strong)] text-[var(--color-brand-dark)] font-semibold hover:bg-[var(--color-secondary)] transition-colors"
            >
              <Plus className="w-4 h-4" /> Nueva colección
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
