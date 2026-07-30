import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, FolderHeart, Heart, Lock, Plus, Search, Share2, Trash2, Users } from 'lucide-react';
import { api, imageUrl } from '../lib/api';
import { useAuth } from '../lib/state';
import type { CollectionDetail, CollectionSummary, Destino } from '../types';
import { Button, DestinationCard, Empty, Field, GuestGate, Loader, MediaImage, Notice, PageHeading, Shell } from '../components/ui';

type Favorite = { id: string; createdAt: string; destino: Destino };

export function FavoritesPage() {
  const { user, token, loading: authLoading } = useAuth(); const [items, setItems] = useState<Favorite[]>([]); const [query, setQuery] = useState(''); const [loading, setLoading] = useState(true);
  useEffect(() => { if (!token) { setLoading(false); return; } api<Favorite[]>('/favoritos', {}, token).then(setItems).finally(() => setLoading(false)); }, [token]);
  const filtered = useMemo(() => items.filter((item) => item.destino.nombre.toLowerCase().includes(query.toLowerCase())), [items, query]);
  if (authLoading) return <Shell><Loader /></Shell>;
  if (!user) return <GuestGate title="Guarda lo que te mueve">Marca destinos para encontrarlos después, sin volver a empezar la búsqueda.</GuestGate>;
  return <Shell><PageHeading kicker="Tu biblioteca" title="Destinos guardados"><p>{items.length ? `${items.length} lugares esperando su momento.` : 'Aquí aparecerán los destinos que guardes.'}</p></PageHeading><section className="library-toolbar"><div><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar entre tus guardados" aria-label="Buscar guardados" /></div></section><section className="library-content">{loading ? <Loader /> : filtered.length ? <div className="destination-list">{filtered.map((item, index) => <DestinationCard key={item.id} destino={item.destino} index={index} />)}</div> : <Empty icon={<Heart />} title="Nada por aquí">Guarda un destino desde su ficha y volverá a aparecer aquí.</Empty>}</section></Shell>;
}

function CollectionCover({ collection }: { collection: CollectionSummary }) {
  return <Link to={`/colecciones/${collection.id}`} className="collection-card"><div className="collection-card__images">{collection.covers.slice(0, 3).map((cover, index) => <MediaImage key={`${cover}-${index}`} src={imageUrl(cover)} alt="" loading="lazy" />)}{!collection.covers.length && <FolderHeart />}</div><div><span>{collection.visibility === 'shared' ? <Share2 /> : <Lock />} {collection.role === 'owner' ? 'Tu viaje' : 'Compartido contigo'}</span><h2>{collection.nombre}</h2><p>{collection.descripcion || 'Sin descripción todavía.'}</p><small>{collection.count} destinos</small></div></Link>;
}

export function CollectionsPage() {
  const { user, token, loading: authLoading } = useAuth(); const [items, setItems] = useState<CollectionSummary[]>([]); const [open, setOpen] = useState(false); const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(true);
  const load = () => token ? api<CollectionSummary[]>('/colecciones', {}, token).then(setItems).finally(() => setLoading(false)) : Promise.resolve();
  useEffect(() => { void load(); }, [token]);
  const create = async (event: React.FormEvent) => { event.preventDefault(); if (!token) return; setError(''); try { await api('/colecciones', { method: 'POST', body: JSON.stringify({ nombre: name, descripcion: description, color: 'cobalt' }) }, token); setOpen(false); setName(''); setDescription(''); await load(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo crear el viaje'); } };
  if (authLoading) return <Shell><Loader /></Shell>;
  if (!user) return <GuestGate title="Convierte ideas en viajes">Agrupa destinos, ordénalos por días y comparte el plan con quien viaja contigo.</GuestGate>;
  return <Shell><PageHeading kicker="Planificación" title="Tus viajes" action={<Button onClick={() => setOpen(true)}><Plus /> Nuevo viaje</Button>}><p>De una primera idea a un itinerario que puedes compartir.</p></PageHeading><section className="collections-grid">{loading ? <Loader /> : items.length ? items.map((collection) => <CollectionCover key={collection.id} collection={collection} />) : <Empty icon={<FolderHeart />} title="Empieza un viaje">Crea una colección y añade destinos desde cualquier ficha.</Empty>}</section>{open && <div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="new-trip"><button className="modal__close" onClick={() => setOpen(false)} aria-label="Cerrar"><ArrowLeft /></button><h2 id="new-trip">Nuevo viaje</h2><form onSubmit={create}><Field label="Nombre" htmlFor="trip-name"><input id="trip-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} placeholder="Costa norte en septiembre" /></Field><Field label="Descripción" htmlFor="trip-description"><textarea id="trip-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={280} /></Field>{error && <Notice tone="error">{error}</Notice>}<Button type="submit">Crear viaje</Button></form></section></div>}</Shell>;
}

export function CollectionPage({ publicView = false }: { publicView?: boolean }) {
  const { id, shareToken } = useParams(); const { token } = useAuth(); const navigate = useNavigate();
  const [collection, setCollection] = useState<CollectionDetail | null>(null); const [loading, setLoading] = useState(true); const [message, setMessage] = useState('');
  const path = publicView ? `/colecciones/public/${shareToken}` : `/colecciones/${id}`;
  const load = () => api<CollectionDetail>(path, {}, publicView ? null : token).then(setCollection).finally(() => setLoading(false));
  useEffect(() => { void load(); }, [path, token]);
  const removeItem = async (destinoId: string) => { if (!token || !id) return; await api(`/colecciones/${id}/items/${destinoId}`, { method: 'DELETE' }, token); await load(); };
  const share = async () => { if (!token || !id) return; const result = await api<{ shareToken: string }>(`/colecciones/${id}/share`, { method: 'POST' }, token); await navigator.clipboard.writeText(`${location.origin}/viaje/${result.shareToken}`); setMessage('Enlace copiado'); await load(); };
  const removeCollection = async () => { if (!token || !id || !confirm('¿Eliminar este viaje? Esta acción no se puede deshacer.')) return; await api(`/colecciones/${id}`, { method: 'DELETE' }, token); navigate('/colecciones'); };
  if (loading) return <Shell><Loader label="Abriendo el viaje" /></Shell>;
  if (!collection) return <Shell><section className="status-page"><div><h1>Viaje no disponible</h1><Notice tone="error">Este viaje no está disponible.</Notice></div></section></Shell>;
  return <Shell><PageHeading kicker={publicView ? 'Viaje compartido' : collection.visibility === 'shared' ? 'Viaje con enlace activo' : 'Viaje privado'} title={collection.nombre} action={!publicView && collection.role === 'owner' ? <div className="heading-actions"><Button variant="secondary" onClick={() => void share()}><Share2 /> Compartir</Button><Button variant="danger" onClick={() => void removeCollection()}><Trash2 /> Eliminar</Button></div> : undefined}><p>{collection.descripcion || 'Un viaje en construcción.'}</p>{message && <Notice tone="success">{message}</Notice>}</PageHeading><section className="trip-meta"><span><Calendar /> {collection.startDate ? new Date(collection.startDate).toLocaleDateString('es') : 'Fechas abiertas'}</span><span><Users /> {collection.members?.length || 0} colaboradores</span><span>{collection.items.length} destinos</span></section><section className="itinerary">{collection.items.length ? collection.items.map((item, index) => <article key={item.id}><span className="itinerary__number">{String(index + 1).padStart(2, '0')}</span><MediaImage src={imageUrl(item.destino.imagen)} alt="" loading="lazy" /><div><small>{item.dayIndex ? `Día ${item.dayIndex}` : 'Sin día asignado'} · {item.status}</small><h2><Link to={`/destino/${item.destino.id}`}>{item.destino.nombre}</Link></h2><p>{item.notas || 'Sin notas todavía.'}</p></div>{!publicView && collection.role !== 'viewer' && <button onClick={() => void removeItem(item.destino.id)} aria-label={`Quitar ${item.destino.nombre}`}><Trash2 /></button>}</article>) : <Empty icon={<FolderHeart />} title="El itinerario está vacío">Añade destinos desde sus fichas para empezar a darle forma.</Empty>}</section></Shell>;
}
