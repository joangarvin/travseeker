import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Compass, Pencil, Search, Trash2, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageLoader from '../components/ui/PageLoader';
import ScrollReveal from '../components/ui/ScrollReveal';
import CollectionItemCard from '../components/collections/CollectionItemCard';
import { useAuth } from '../context/AuthContext';
import { useAbortableFetch } from '../hooks/useAbortableFetch';
import { getCollection, updateCollection, deleteCollection } from '../api/collections';
import { COLLECTION_COLORS, colorHex } from '../constants/collectionColors';
import type { CollectionDetail } from '../types/collection';

export default function ColeccionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token, loading: authLoading } = useAuth();
  const { data: collection, loading, error, setData: setCollection } = useAbortableFetch<CollectionDetail>(
    (signal) => getCollection(id as string, token as string, signal),
    [id, token],
    { enabled: !authLoading && !!user && !!token && !!id },
  );

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('emerald');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (collection) {
      setName(collection.nombre);
      setDesc(collection.descripcion ?? '');
      setColor(collection.color);
    }
  }, [collection]);

  const handleSave = async () => {
    if (!token || !id || !name.trim()) return;
    setSaving(true);
    try {
      const updated = await updateCollection(id, { nombre: name, descripcion: desc, color }, token);
      setCollection((prev) => (prev ? { ...prev, nombre: updated.nombre, descripcion: updated.descripcion, color: updated.color } : prev));
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !id) return;
    if (!window.confirm('¿Eliminar esta colección?')) return;
    await deleteCollection(id, token);
    navigate('/colecciones', { replace: true });
  };

  const handleRemoveItem = (destinoId: string) => {
    setCollection((prev) => (prev ? { ...prev, items: prev.items.filter((i) => i.destinoId !== destinoId) } : prev));
  };

  const visibleItems = (collection?.items ?? []).filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.destino.nombre.toLowerCase().includes(q);
  });

  if (authLoading || (user && loading)) return <PageLoader label="Cargando colección..." />;

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-secondary)] flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--color-primary)] font-semibold text-xl">Inicia sesión para ver tus colecciones</p>
        <Link to="/auth" className="text-[var(--color-brand-dark)] font-medium hover:underline">Iniciar sesión</Link>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-[var(--color-secondary)] flex flex-col items-center justify-center gap-4">
        <p className="text-[var(--color-primary)] font-semibold text-xl">{error || 'Colección no encontrada'}</p>
        <Link to="/colecciones" className="text-sm text-[var(--color-brand-dark)] hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver a colecciones
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />

      <section className="relative pt-24 sm:pt-28 pb-10 sm:pb-12 px-4 sm:px-6 hero-mesh grain overflow-hidden">
        <div className="blob blob-1 opacity-30" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <Link to="/colecciones" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Colecciones
          </Link>

          {editing ? (
            <div className="max-w-2xl space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-2xl font-serif placeholder:text-white/40 focus:outline-none focus:border-[var(--color-brand)]"
                placeholder="Nombre"
              />
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                maxLength={280}
                className="w-full px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[var(--color-brand)]"
                placeholder="Descripción"
              />
              <div className="flex items-center gap-2">
                {COLLECTION_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setColor(col.id)}
                    className={`w-7 h-7 rounded-full transition-transform ${color === col.id ? 'ring-2 ring-offset-2 ring-offset-[#0d1f17] scale-110' : ''}`}
                    style={{ backgroundColor: col.hex, '--tw-ring-color': col.hex } as React.CSSProperties}
                    aria-label={col.label}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleSave} disabled={saving || !name.trim()} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50">
                  <Check className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white/80 hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: colorHex(collection.color) }} />
                  <h1 className="font-serif text-4xl md:text-5xl font-medium text-white tracking-tight">{collection.nombre}</h1>
                </div>
                {collection.descripcion && <p className="text-white/60 text-lg font-light max-w-2xl">{collection.descripcion}</p>}
                <p className="text-white/50 text-sm mt-2">
                  {collection.items.length} {collection.items.length === 1 ? 'destino' : 'destinos'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-dark text-white/90 text-sm font-medium hover:bg-white/10 transition-colors">
                  <Pencil className="w-4 h-4" /> Editar
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2.5 rounded-full glass-dark text-white/90 text-sm font-medium hover:bg-[var(--color-danger)] transition-colors">
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 md:px-10 pb-20 -mt-4">
        {collection.items.length > 0 && (
          <div className="mb-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 sm:p-4">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar destino en la colección..."
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border-strong)] text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)]"
              />
            </div>
          </div>
        )}

        {visibleItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleItems.map((item, index) => (
              <ScrollReveal key={item.id} delay={(index % 3) as 0 | 1 | 2}>
                <CollectionItemCard collectionId={collection.id} item={item} onRemove={handleRemoveItem} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <Compass className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-muted)] mb-6">
              Esta colección está vacía. Explora destinos y guárdalos aquí desde el botón "Guardar en colección".
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/" className="text-[var(--color-brand-dark)] font-semibold hover:underline">Explorar destinos</Link>
              <Link to="/mapa" className="text-[var(--color-brand-dark)] font-semibold hover:underline">Ver el mapa</Link>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
