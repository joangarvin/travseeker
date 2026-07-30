import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Compass, Link2, Pencil, Search, Trash2, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageLoader from '../components/ui/PageLoader';
import ScrollReveal from '../components/ui/ScrollReveal';
import CollectionItemCard from '../components/collections/CollectionItemCard';
import { useAuth } from '../context/AuthContext';
import { useAbortableFetch } from '../hooks/useAbortableFetch';
import { getCollection, updateCollection, deleteCollection, shareCollection, stopSharingCollection } from '../api/collections';
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
  const [sharing, setSharing] = useState(false);

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

  const handleShare = async () => {
    const currentCollection = collection;
    if (!token || !id || sharing || !currentCollection) return;
    setSharing(true);
    try {
      const shared = currentCollection.shareToken
        ? { shareToken: currentCollection.shareToken }
        : await shareCollection(id, token);
      const url = `${window.location.origin}/viaje/${shared.shareToken}`;
      await navigator.clipboard.writeText(url);
      setCollection((prev) => prev ? { ...prev, visibility: 'shared', shareToken: shared.shareToken } : prev);
      window.alert('Enlace del viaje copiado');
    } catch {
      window.alert('No se pudo crear el enlace compartido');
    } finally {
      setSharing(false);
    }
  };

  const handleStopSharing = async () => {
    const currentCollection = collection;
    if (!token || !id || !currentCollection?.shareToken) return;
    await stopSharingCollection(id, token);
    setCollection((prev) => prev ? { ...prev, visibility: 'private', shareToken: null } : prev);
  };

  const visibleItems = (collection?.items ?? []).filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return item.destino.nombre.toLowerCase().includes(q);
  });

  if (authLoading || (user && loading)) return <PageLoader label="Cargando colección..." />;

  if (!user) {
    return (
      <div className="page-center">
        <p className="page-center__title">Inicia sesión para ver tus colecciones</p>
        <Link to="/auth" className="link-brand">Iniciar sesión</Link>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="page-center">
        <p className="page-center__title">{error || 'Colección no encontrada'}</p>
        <Link to="/colecciones" className="page-center__link">
          <ArrowLeft className="icon-sm" /> Volver a colecciones
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Header />

      <section className="coleccion-detail-hero">
        <div className="coleccion-detail-hero__inner">
          <Link to="/colecciones" className="coleccion-detail-back">
            <ArrowLeft className="icon-sm" /> Colecciones
          </Link>

          {editing ? (
            <div className="coleccion-detail-edit">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="ui-input coleccion-detail-edit__title"
                placeholder="Nombre"
              />
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                maxLength={280}
                className="ui-input"
                placeholder="Descripción"
              />
              <div className="colecciones-form__colors">
                {COLLECTION_COLORS.map((col) => (
                  <button
                    key={col.id}
                    type="button"
                    onClick={() => setColor(col.id)}
                    className={`colecciones-color-btn colecciones-color-btn--round ${color === col.id ? 'is-selected' : ''}`}
                    style={{ backgroundColor: col.hex, color: col.hex }}
                    aria-label={col.label}
                  />
                ))}
              </div>
              <div className="coleccion-detail-edit__actions">
                <button type="button" onClick={handleSave} disabled={saving || !name.trim()} className="btn-cta">
                  <Check className="icon-sm" /> {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn-ghost">
                  <X className="icon-sm" /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="coleccion-detail-head">
              <div>
                <div className="coleccion-detail-head__title-row">
                  <span className="coleccion-detail-head__dot" style={{ backgroundColor: colorHex(collection.color) }} />
                  <h1 className="coleccion-detail-head__title">{collection.nombre}</h1>
                </div>
                {collection.descripcion && <p className="coleccion-detail-head__desc">{collection.descripcion}</p>}
                <p className="coleccion-detail-head__count">
                  {collection.items.length} {collection.items.length === 1 ? 'destino' : 'destinos'}
                </p>
              </div>
              <div className="coleccion-detail-head__actions">
                <button type="button" onClick={handleShare} disabled={sharing} className="btn-pill">
                  <Link2 className="icon-sm" /> {sharing ? 'Creando…' : 'Compartir'}
                </button>
                {collection.shareToken && (
                  <button type="button" onClick={handleStopSharing} className="btn-pill">
                    Dejar de compartir
                  </button>
                )}
                <button type="button" onClick={() => setEditing(true)} className="btn-pill">
                  <Pencil className="icon-sm" /> Editar
                </button>
                <button type="button" onClick={handleDelete} className="btn-pill btn-pill--danger">
                  <Trash2 className="icon-sm" /> Eliminar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="coleccion-detail-section">
        {collection.items.length > 0 && (
          <div className="ui-card coleccion-detail-search">
            <div className="coleccion-detail-search__wrap">
              <Search className="coleccion-detail-search__icon" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar destino en la colección..."
                className="coleccion-detail-search__input"
              />
            </div>
          </div>
        )}

        {visibleItems.length > 0 ? (
          <div className="colecciones-grid">
            {visibleItems.map((item, index) => (
              <ScrollReveal key={item.id} delay={(index % 3) as 0 | 1 | 2}>
                <CollectionItemCard collectionId={collection.id} item={item} onRemove={handleRemoveItem} />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="ui-card coleccion-detail-empty">
            <Compass className="coleccion-detail-empty__icon" />
            <p className="coleccion-detail-empty__text">
              Esta lista está en blanco. Pásate por el mapa y trae algo.
            </p>
            <div className="coleccion-detail-empty__links">
              <Link to="/mapa" className="coleccion-detail-empty__link">Abrir el mapa</Link>
              <Link to="/" className="coleccion-detail-empty__link">Ver destinos</Link>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
