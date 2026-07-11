import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FolderHeart, LogIn, Plus, Trash2, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageLoader from '../components/ui/PageLoader';
import ScrollReveal from '../components/ui/ScrollReveal';
import PageHero from '../components/layout/PageHero';
import ListToolbar from '../components/ui/ListToolbar';
import { useAuth } from '../context/AuthContext';
import { useAbortableFetch } from '../hooks/useAbortableFetch';
import { getCollections, createCollection, deleteCollection } from '../api/collections';
import { getImageUrl } from '../utils/images';
import { COLLECTION_COLORS, colorHex } from '../constants/collectionColors';
import type { CollectionSummary } from '../types/collection';

function CoverCollage({ covers, color }: { covers: string[]; color: string }) {
  if (covers.length === 0) {
    return (
      <div
        className="h-40 w-full flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${colorHex(color)}, ${colorHex(color)}99)` }}
      >
        <FolderHeart className="w-10 h-10 text-white/80" />
      </div>
    );
  }
  return (
    <div className="h-40 w-full grid grid-cols-2 grid-rows-2 gap-0.5">
      {covers.slice(0, 4).map((src, i) => (
        <img
          key={i}
          src={getImageUrl(src, i, 'thumb')}
          alt=""
          className={`w-full h-full object-cover ${covers.length === 1 ? 'col-span-2 row-span-2' : ''} ${covers.length === 3 && i === 0 ? 'row-span-2' : ''}`}
          loading="lazy"
        />
      ))}
    </div>
  );
}

export default function Colecciones() {
  const { user, token, loading: authLoading } = useAuth();
  const { data, loading, setData: setCollections } = useAbortableFetch<CollectionSummary[]>(
    (signal) => getCollections(token as string, signal),
    [token],
    { enabled: !authLoading && !!user && !!token, initialData: [] },
  );
  const collections = useMemo(() => data ?? [], [data]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [color, setColor] = useState('emerald');
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'items'>('recent');

  const visibleCollections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? collections.filter((c) =>
          c.nombre.toLowerCase().includes(q) || (c.descripcion ?? '').toLowerCase().includes(q),
        )
      : collections;

    if (sortBy === 'name') return [...base].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    if (sortBy === 'items') return [...base].sort((a, b) => b.count - a.count);
    return base;
  }, [collections, query, sortBy]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !name.trim() || creating) return;
    setCreating(true);
    try {
      const created = await createCollection({ nombre: name, descripcion: desc, color }, token);
      setCollections((prev) => [created, ...(prev ?? [])]);
      setName('');
      setDesc('');
      setColor('emerald');
      setShowForm(false);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm('¿Eliminar esta colección? Los destinos no se borrarán de favoritos.')) return;
    setCollections((prev) => (prev ?? []).filter((c) => c.id !== id));
    try {
      await deleteCollection(id, token);
    } catch {
      /* noop */
    }
  };

  if (authLoading || (user && loading)) {
    return <PageLoader label="Cargando colecciones..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
        <Header />
        <div className="pt-24 sm:pt-32 px-4 sm:px-6 pb-20 max-w-lg mx-auto text-center">
          <div className="glass rounded-2xl border border-[var(--color-border)] p-10">
            <FolderHeart className="w-12 h-12 text-[var(--color-brand)] mx-auto mb-4" />
            <h1 className="font-serif text-3xl text-[var(--color-primary)] mb-3">Tus colecciones</h1>
            <p className="text-[var(--color-muted)] mb-8">
              Inicia sesión para organizar tus destinos en itinerarios como "Verano 2026" o "Norte de España".
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />

      <PageHero
        icon={<FolderHeart className="w-6 h-6 text-[var(--color-brand)]" />}
        title="Mis colecciones"
        description="Agrupa destinos en itinerarios y añade tus notas de viaje."
        action={(
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancelar' : 'Nueva colección'}
          </button>
        )}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pb-20">
        {collections.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            queryPlaceholder="Buscar colección..."
            sortValue={sortBy}
            onSortChange={(value) => setSortBy(value as 'recent' | 'name' | 'items')}
            sortOptions={[
              { value: 'recent', label: 'Más recientes' },
              { value: 'name', label: 'Nombre A-Z' },
              { value: 'items', label: 'Más destinos' },
            ]}
          />
        )}

        {showForm && (
          <form onSubmit={handleCreate} className="mb-8 p-6 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-sm space-y-4 animate-fade-up">
            <div className="grid md:grid-cols-2 gap-4">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Nombre (p. ej. Verano 2026)"
                className="px-4 py-3 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border-strong)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
              />
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                maxLength={280}
                placeholder="Descripción (opcional)"
                className="px-4 py-3 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border-strong)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] transition-colors"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                {COLLECTION_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setColor(col.id)}
                    className={`w-7 h-7 rounded-full transition-transform ${color === col.id ? 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)] scale-110' : ''}`}
                    style={{ backgroundColor: col.hex, '--tw-ring-color': col.hex } as React.CSSProperties}
                    aria-label={col.label}
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={!name.trim() || creating}
                className="px-6 py-3 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50"
              >
                {creating ? 'Creando...' : 'Crear colección'}
              </button>
            </div>
          </form>
        )}

        {visibleCollections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visibleCollections.map((c, index) => (
              <ScrollReveal key={c.id} delay={(index % 3) as 0 | 1 | 2}>
                <div className="group relative rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] overflow-hidden shadow-sm hover:bg-[var(--color-surface-2)] transition-colors duration-300">
                  <Link to={`/colecciones/${c.id}`} className="block">
                    <CoverCollage covers={c.covers} color={c.color} />
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colorHex(c.color) }} />
                        <h2 className="font-semibold text-lg text-[var(--color-primary)] truncate">{c.nombre}</h2>
                      </div>
                      {c.descripcion && (
                        <p className="text-sm text-[var(--color-muted)] line-clamp-2 mb-2">{c.descripcion}</p>
                      )}
                      <p className="text-xs text-[var(--color-muted)]">
                        {c.count} {c.count === 1 ? 'destino' : 'destinos'}
                      </p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm text-white/90 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-[var(--color-danger)] transition-all"
                    aria-label="Eliminar colección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </ScrollReveal>
            ))}
          </div>
        ) : (
          !showForm && (
            <div className="text-center py-20 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)]">
              <FolderHeart className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-4" />
              <p className="text-[var(--color-muted)] mb-6">
                {collections.length > 0
                  ? 'No encontramos colecciones que coincidan con tu búsqueda.'
                  : 'Aún no tienes colecciones. Crea tu primer itinerario para empezar a organizar tus viajes.'}
              </p>
              {collections.length === 0 && (
                <button onClick={() => setShowForm(true)} className="text-[var(--color-brand-dark)] font-semibold hover:underline">
                  Crear mi primera colección
                </button>
              )}
            </div>
          )
        )}
      </section>

      <Footer />
    </div>
  );
}
