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
        className="coleccion-cover--empty"
        style={{ background: `linear-gradient(135deg, ${colorHex(color)}, ${colorHex(color)}99)` }}
      >
        <FolderHeart />
      </div>
    );
  }
  return (
    <div className="coleccion-cover__grid">
      {covers.slice(0, 4).map((src, i) => {
        const isLarge = covers.length === 1 || (covers.length === 3 && i === 0);
        return (
          <img
            key={i}
            src={getImageUrl(src, i, isLarge ? 'card' : 'collage')}
            alt=""
            className={`${covers.length === 1 ? 'span-all' : ''} ${covers.length === 3 && i === 0 ? 'span-rows' : ''}`}
            loading="lazy"
          />
        );
      })}
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
      <div className="page-shell">
        <Header />
        <div className="page-guest">
          <div className="ui-card page-guest__card">
            <FolderHeart className="page-guest__icon" />
            <h1 className="page-guest__title">Tus listas de viaje</h1>
            <p className="page-guest__text">
              Entra para agrupar destinos por plan: «Puente de mayo», «Norte con perro», «Escapadas de un día».
            </p>
            <Link to="/auth" className="btn-cta btn-cta--lg">
              <LogIn className="icon-sm" />
              Entrar
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Header />

      <PageHero
        eyebrow="Colecciones"
        icon={<FolderHeart className="icon-md" style={{ color: 'var(--color-brand)' }} />}
        title="Tus listas de viaje"
        description="«Puente de mayo», «Norte con perro», «Escapadas de un día». Cada plan, su lista."
        action={(
          <button type="button" onClick={() => setShowForm((v) => !v)} className="btn-cta btn-cta--lg">
            {showForm ? <X className="icon-sm" /> : <Plus className="icon-sm" />}
            {showForm ? 'Cancelar' : 'Nueva lista'}
          </button>
        )}
      />

      <div className="page-wrap">
        <section className="page-section page-section--tight">
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
            <form onSubmit={handleCreate} className="ui-card colecciones-form animate-fade-up">
              <div className="colecciones-form__grid">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  placeholder="Nombre de plan (p. ej. Puente de mayo)"
                  className="ui-input"
                />
                <input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  maxLength={280}
                  placeholder="Descripción (opcional)"
                  className="ui-input"
                />
              </div>
              <div className="colecciones-form__footer">
                <div className="colecciones-form__colors">
                  {COLLECTION_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setColor(col.id)}
                      className={`colecciones-color-btn ${color === col.id ? 'is-selected' : ''}`}
                      style={{ backgroundColor: col.hex, color: col.hex }}
                      aria-label={col.label}
                    />
                  ))}
                </div>
                <button type="submit" disabled={!name.trim() || creating} className="btn-cta btn-cta--lg">
                  {creating ? 'Creando…' : 'Crear lista'}
                </button>
              </div>
            </form>
          )}

          {visibleCollections.length > 0 ? (
            <div className="colecciones-grid">
              {visibleCollections.map((c, index) => (
                <ScrollReveal key={c.id} delay={(index % 3) as 0 | 1 | 2}>
                  <div className="coleccion-card ui-card">
                    <Link to={`/colecciones/${c.id}`}>
                      <CoverCollage covers={c.covers} color={c.color} />
                      <div className="coleccion-card__body">
                        <div className="coleccion-card__title-row">
                          <span className="coleccion-card__dot" style={{ backgroundColor: colorHex(c.color) }} />
                          <h2 className="coleccion-card__title">{c.nombre}</h2>
                        </div>
                        {c.descripcion && (
                          <p className="coleccion-card__desc">{c.descripcion}</p>
                        )}
                        <p className="coleccion-card__count field-label">
                          {c.count} {c.count === 1 ? 'destino' : 'destinos'}
                        </p>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      className="coleccion-card__delete ink-chip"
                      aria-label="Eliminar colección"
                    >
                      <Trash2 className="icon-sm" />
                    </button>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            !showForm && (
              <div className="ui-card colecciones-empty">
                <FolderHeart className="colecciones-empty__icon" />
                <p className="colecciones-empty__title">
                  {collections.length > 0 ? 'Ninguna lista coincide' : 'Sin listas todavía'}
                </p>
                <p className="colecciones-empty__text">
                  {collections.length > 0
                    ? 'Ninguna lista coincide con esa búsqueda.'
                    : 'Una colección es una lista con intención. Crea la primera y ponle nombre de plan: «Puente de mayo», «Ruta del cochinillo».'}
                </p>
                {collections.length === 0 && (
                  <button type="button" onClick={() => setShowForm(true)} className="btn-cta btn-cta--lg">
                    Crear mi primera lista
                  </button>
                )}
              </div>
            )
          )}
        </section>

        <Footer />
      </div>
    </div>
  );
}
