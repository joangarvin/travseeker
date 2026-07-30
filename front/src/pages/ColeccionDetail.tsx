import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Compass, Link2, Pencil, Search, Trash2, UserPlus, Users, X } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageLoader from '../components/ui/PageLoader';
import ScrollReveal from '../components/ui/ScrollReveal';
import CollectionItemCard from '../components/collections/CollectionItemCard';
import { useAuth } from '../context/AuthContext';
import { useAbortableFetch } from '../hooks/useAbortableFetch';
import { addCollectionMember, getCollection, removeCollectionMember, reorderCollectionItems, updateCollection, updateCollectionMember, deleteCollection, shareCollection, stopSharingCollection } from '../api/collections';
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [sharing, setSharing] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'editor' | 'viewer'>('editor');
  const [memberError, setMemberError] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [touchDragPosition, setTouchDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [orderError, setOrderError] = useState('');
  const dragIdRef = useRef<string | null>(null);
  const armedDragRef = useRef<string | null>(null);
  const orderRef = useRef<string[]>([]);
  const originalOrderRef = useRef<string[]>([]);

  useEffect(() => {
    if (collection) {
      setName(collection.nombre);
      setDesc(collection.descripcion ?? '');
      setColor(collection.color);
      setStartDate(collection.startDate?.slice(0, 10) ?? '');
      setEndDate(collection.endDate?.slice(0, 10) ?? '');
    }
  }, [collection]);

  const handleSave = async () => {
    if (!token || !id || !name.trim()) return;
    setSaving(true);
    try {
      const updated = await updateCollection(id, { nombre: name, descripcion: desc, color, startDate: startDate || null, endDate: endDate || null }, token);
      setCollection((prev) => (prev ? { ...prev, nombre: updated.nombre, descripcion: updated.descripcion, color: updated.color, startDate: updated.startDate ?? null, endDate: updated.endDate ?? null } : prev));
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

  const handleUpdateItem = (updated: Pick<CollectionDetail['items'][number], 'destinoId' | 'notas' | 'dayIndex' | 'status' | 'sortOrder'>) => {
    setCollection((prev) => prev ? { ...prev, items: prev.items.map((item) => item.destinoId === updated.destinoId ? { ...item, ...updated } : item).sort((a, b) => a.sortOrder - b.sortOrder || a.createdAt.localeCompare(b.createdAt)) } : prev);
  };

  const handleDragStart = (event: React.DragEvent<HTMLDivElement>, destinoId: string) => {
    if (armedDragRef.current !== destinoId) { event.preventDefault(); return; }
    dragIdRef.current = destinoId; setDraggingId(destinoId); setOrderError('');
    orderRef.current = collection?.items.map((item) => item.destinoId) ?? [];
    originalOrderRef.current = [...orderRef.current];
    event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', destinoId);
  };

  const moveItem = (activeId: string, overId: string) => {
    if (activeId === overId) return;
    setCollection((prev) => {
      if (!prev) return prev;
      const items = [...prev.items];
      const from = items.findIndex((item) => item.destinoId === activeId);
      const to = items.findIndex((item) => item.destinoId === overId);
      if (from < 0 || to < 0) return prev;
      const [moved] = items.splice(from, 1); items.splice(to, 0, moved);
      const ordered = items.map((item, index) => ({ ...item, sortOrder: index * 10 }));
      orderRef.current = ordered.map((item) => item.destinoId);
      return { ...prev, items: ordered };
    });
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>, overId: string) => {
    const activeId = dragIdRef.current;
    if (!activeId || activeId === overId) return;
    event.preventDefault(); event.dataTransfer.dropEffect = 'move';
    moveItem(activeId, overId);
  };

  const persistOrder = async () => {
    const ordered = orderRef.current;
    dragIdRef.current = null; armedDragRef.current = null; setDraggingId(null); setTouchDragPosition(null);
    if (!token || !id || !ordered.length) return;
    try { await reorderCollectionItems(id, ordered, token); originalOrderRef.current = [...ordered]; }
    catch (err) {
      const original = originalOrderRef.current;
      setCollection((prev) => prev ? { ...prev, items: [...prev.items].sort((a, b) => original.indexOf(a.destinoId) - original.indexOf(b.destinoId)) } : prev);
      setOrderError(err instanceof Error ? err.message : 'No se pudo guardar el orden');
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    await persistOrder();
  };

  const handleDragEnd = () => {
    if (dragIdRef.current && originalOrderRef.current.length) {
      const original = originalOrderRef.current;
      setCollection((prev) => prev ? { ...prev, items: [...prev.items].sort((a, b) => original.indexOf(a.destinoId) - original.indexOf(b.destinoId)) } : prev);
    }
    dragIdRef.current = null; armedDragRef.current = null; setDraggingId(null); setTouchDragPosition(null);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, destinoId: string) => {
    if (!(event.target as HTMLElement).closest('[data-drag-handle]')) return;
    armedDragRef.current = destinoId;
    if (event.pointerType === 'mouse') return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragIdRef.current = destinoId; setDraggingId(destinoId); setOrderError('');
    setTouchDragPosition({ x: event.clientX, y: event.clientY });
    orderRef.current = collection?.items.map((item) => item.destinoId) ?? [];
    originalOrderRef.current = [...orderRef.current];
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || !dragIdRef.current) return;
    event.preventDefault(); setTouchDragPosition({ x: event.clientX, y: event.clientY });
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>('[data-destino-id]');
    const overId = target?.dataset.destinoId;
    if (overId) moveItem(dragIdRef.current, overId);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse' && dragIdRef.current) void persistOrder();
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

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !id || !memberEmail.trim()) return;
    setMemberError('');
    try {
      const member = await addCollectionMember(id, memberEmail, memberRole, token);
      setCollection((prev) => prev ? { ...prev, members: [...prev.members.filter((item) => item.id !== member.id), member] } : prev);
      setMemberEmail('');
    } catch (err) { setMemberError(err instanceof Error ? err.message : 'No se pudo añadir'); }
  };

  const handleMemberRole = async (memberId: string, role: 'editor' | 'viewer') => {
    if (!token || !id) return;
    const member = await updateCollectionMember(id, memberId, role, token);
    setCollection((prev) => prev ? { ...prev, members: prev.members.map((item) => item.id === member.id ? member : item) } : prev);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!token || !id) return;
    await removeCollectionMember(id, memberId, token);
    setCollection((prev) => prev ? { ...prev, members: prev.members.filter((item) => item.id !== memberId) } : prev);
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
  const isOwner = collection.role === 'owner';
  const canEdit = collection.role === 'owner' || collection.role === 'editor';

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
              <div className="coleccion-detail-edit__dates">
                <label>Inicio<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ui-input" /></label>
                <label>Fin<input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className="ui-input" /></label>
              </div>
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
                {(collection.startDate || collection.endDate) && <p className="coleccion-detail-head__dates">
                  {collection.startDate ? new Date(collection.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : 'Sin inicio'}
                  {' — '}
                  {collection.endDate ? new Date(collection.endDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin fin'}
                </p>}
              </div>
              <div className="coleccion-detail-head__actions">
                {isOwner && <button type="button" onClick={handleShare} disabled={sharing} className="btn-pill">
                  <Link2 className="icon-sm" /> {sharing ? 'Creando…' : 'Compartir'}
                </button>}
                {isOwner && collection.shareToken && (
                  <button type="button" onClick={handleStopSharing} className="btn-pill">
                    Dejar de compartir
                  </button>
                )}
                {canEdit && <button type="button" onClick={() => setEditing(true)} className="btn-pill">
                  <Pencil className="icon-sm" /> Editar
                </button>}
                {isOwner && <button type="button" onClick={handleDelete} className="btn-pill btn-pill--danger">
                  <Trash2 className="icon-sm" /> Eliminar
                </button>}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="coleccion-detail-section">
        <div className="ui-card collection-collab">
          <div className="collection-collab__head"><Users className="icon-md" /><div><h2>Personas del viaje</h2><p>{isOwner ? 'Invita a alguien con cuenta en TravSeeker.' : `Tu permiso: ${collection.role === 'editor' ? 'editor' : 'lector'}.`}</p></div></div>
          {isOwner && <form className="collection-collab__invite" onSubmit={handleAddMember}><input type="email" className="ui-input" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="email@ejemplo.com" required /><select className="ui-input" value={memberRole} onChange={(event) => setMemberRole(event.target.value as 'editor' | 'viewer')}><option value="editor">Puede editar</option><option value="viewer">Solo lectura</option></select><button className="btn-cta" type="submit"><UserPlus className="icon-sm" /> Añadir</button></form>}
          {memberError && <p className="collection-collab__error">{memberError}</p>}
          {collection.members.length > 0 && <div className="collection-collab__members">{collection.members.map((member) => <div key={member.id} className="collection-collab__member"><span><strong>{member.user.nombre || member.user.email}</strong><small>{member.user.email}</small></span>{isOwner ? <><select value={member.role} onChange={(event) => handleMemberRole(member.id, event.target.value as 'editor' | 'viewer')}><option value="editor">Editor</option><option value="viewer">Lector</option></select><button type="button" onClick={() => handleRemoveMember(member.id)} aria-label="Quitar colaborador"><X className="icon-sm" /></button></> : <em>{member.role === 'editor' ? 'Editor' : 'Lector'}</em>}</div>)}</div>}
        </div>
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
        {canEdit && collection.items.length > 1 && <p className="coleccion-detail-order-hint">Arrastra las fichas desde el asa para ordenar el viaje.{query && ' Quita la búsqueda para cambiar el orden.'}</p>}
        {orderError && <p className="collection-order-error">{orderError}</p>}
        {touchDragPosition && draggingId && (() => { const dragged = collection.items.find((item) => item.destinoId === draggingId); return dragged ? <div className="collection-touch-preview" style={{ left: touchDragPosition.x, top: touchDragPosition.y }}><img src={dragged.destino.imagen} alt="" /><strong>{dragged.destino.nombre}</strong></div> : null; })()}

        {visibleItems.length > 0 ? (
          <div className="coleccion-itinerary-grid">
            {visibleItems.map((item, index) => (
              <div key={item.id} data-destino-id={item.destinoId} className={`collection-sort-item ${draggingId === item.destinoId ? 'is-dragging' : ''}`} draggable={canEdit && !query.trim()} onPointerDown={(event) => handlePointerDown(event, item.destinoId)} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handleDragEnd} onDragStart={(event) => handleDragStart(event, item.destinoId)} onDragOver={(event) => handleDragOver(event, item.destinoId)} onDrop={handleDrop} onDragEnd={handleDragEnd}>
                <ScrollReveal delay={(index % 3) as 0 | 1 | 2}><CollectionItemCard collectionId={collection.id} item={item} onRemove={handleRemoveItem} onUpdate={handleUpdateItem} canEdit={canEdit} canDrag={canEdit && !query.trim()} /></ScrollReveal>
              </div>
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
