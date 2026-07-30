import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleMarker, MapContainer, Popup, TileLayer, ZoomControl } from 'react-leaflet';
import { ChevronLeft, ChevronRight, LocateFixed, MapPin, SlidersHorizontal, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { api, imageUrl, plain, queryString } from '../lib/api';
import type { Destino, SearchFilters } from '../types';
import { Loader, Shell } from '../components/ui';

export default function MapPage() {
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setLoading(true); api<Destino[]>(`/mapa${queryString(filters)}`).then(setDestinos).finally(() => setLoading(false)); }, [filters]);
  const active = useMemo(() => destinos.find((item) => item.id === selected), [destinos, selected]);
  const update = (key: keyof SearchFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));
  return <Shell footer={false}>
    <section className="map-workspace">
      <header className="map-toolbar"><div><p className="kicker">Exploración visual</p><h1>El mapa</h1><span>{loading ? 'Buscando…' : `${destinos.length} destinos`}</span></div><div><button className="button button--secondary" onClick={() => setFiltersOpen((value) => !value)}><SlidersHorizontal /> Filtros</button><button className="icon-button" onClick={() => setListOpen((value) => !value)} aria-label={listOpen ? 'Ocultar lista' : 'Mostrar lista'}>{listOpen ? <ChevronLeft /> : <ChevronRight />}</button></div></header>
      {filtersOpen && <div className="map-filters"><select value={filters.month || ''} onChange={(e) => update('month', e.target.value)} aria-label="Mes"><option value="">Cualquier mes</option>{Array.from({ length: 12 }).map((_, i) => <option key={i} value={String(i + 1)}>{new Date(2026, i).toLocaleString('es', { month: 'long' })}</option>)}</select><select value={filters.presupuesto || ''} onChange={(e) => update('presupuesto', e.target.value)} aria-label="Presupuesto"><option value="">Cualquier presupuesto</option><option>Bajo</option><option>Medio-Bajo</option><option>Medio</option><option>Medio-Alto</option><option>Alto</option></select><select value={filters.masificacion || ''} onChange={(e) => update('masificacion', e.target.value)} aria-label="Afluencia"><option value="">Cualquier afluencia</option><option>Bajo</option><option>Medio-Bajo</option><option>Medio</option><option>Medio-Alto</option><option>Alto</option></select><label className="check"><input type="checkbox" checked={filters.avoidCrowds === 'true'} onChange={(e) => update('avoidCrowds', e.target.checked ? 'true' : '')} /> Evitar aglomeraciones</label>{Object.values(filters).some(Boolean) && <button onClick={() => setFilters({})}><X /> Limpiar</button>}</div>}
      <div className={`map-layout ${listOpen ? '' : 'map-layout--closed'}`}>
        {listOpen && <aside className="map-list" aria-label="Destinos del mapa">{loading ? <Loader /> : destinos.map((destino, index) => <button key={destino.id} onClick={() => setSelected(destino.id)} className={selected === destino.id ? 'is-active' : ''}><img src={imageUrl(destino.imagen)} alt="" /><span><small>{String(index + 1).padStart(2, '0')} · {plain(destino.ubicacion)}</small><b>{destino.nombre.trim()}</b><em>{plain(destino.presupuesto)} · {plain(destino.masificacion)}</em></span></button>)}</aside>}
        <div className="map-canvas"><MapContainer center={[40, -3.5]} zoom={6} zoomControl={false} className="map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><ZoomControl position="bottomright" />{destinos.filter((d) => d.latitud != null && d.longitud != null).map((destino) => <CircleMarker key={destino.id} center={[destino.latitud!, destino.longitud!]} radius={selected === destino.id ? 12 : 8} pathOptions={{ className: selected === destino.id ? 'map-marker is-selected' : 'map-marker', weight: 2, fillOpacity: 1 }} eventHandlers={{ click: () => setSelected(destino.id) }}><Popup><div className="map-popup"><img src={imageUrl(destino.imagen)} alt="" /><strong>{destino.nombre}</strong><span>{plain(destino.ubicacion)}</span><Link to={`/destino/${destino.id}`}>Abrir destino</Link></div></Popup></CircleMarker>)}</MapContainer>{active && <article className="map-selected"><img src={imageUrl(active.imagen)} alt="" /><div><span>{plain(active.ubicacion)}</span><h2>{active.nombre.trim()}</h2><p>{plain(active.presupuesto)} · {plain(active.masificacion)}</p><Link to={`/destino/${active.id}`}>Ver destino <MapPin /></Link></div><button onClick={() => setSelected(null)} aria-label="Cerrar"><X /></button></article>}<div className="map-watermark"><LocateFixed /> Explora y mueve el mapa</div></div>
      </div>
    </section>
  </Shell>;
}
