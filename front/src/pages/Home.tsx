import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, ChevronDown, Map, SlidersHorizontal, Sparkles, Users } from 'lucide-react';
import { api, imageUrl, queryString } from '../lib/api';
import type { Destino, SearchFilters } from '../types';
import { DestinationCard, Loader, Notice, SearchBox, Shell } from '../components/ui';

const travelModes = ['Cultural', 'Naturaleza', 'Sol y playa', 'Rural', 'Montaña', 'Patrimonial'];

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [featured, setFeatured] = useState<Destino[]>([]);
  const [results, setResults] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>(() => Object.fromEntries(params.entries()));

  const search = async (next = filters) => {
    setLoading(true); setError('');
    try {
      const data = await api<Destino[]>(`/destinos${queryString(next)}`);
      const nextParams = new URLSearchParams();
      Object.entries(next).forEach(([key, value]) => { if (value) nextParams.set(key, value); });
      setResults(data); setParams(nextParams, { replace: true });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los destinos'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    Promise.all([api<Destino[]>('/destacados?limit=5'), api<Destino[]>(`/destinos${queryString(Object.fromEntries(params.entries()))}`)])
      .then(([hero, list]) => { setFeatured(hero); setResults(list); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los destinos'))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = useMemo(() => Object.values(filters).filter(Boolean).length, [filters]);
  const update = (key: keyof SearchFilters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  return <Shell>
    <section className="home-hero">
      <div className="home-hero__copy">
        <p className="kicker">Destinos españoles elegidos con criterio</p>
        <h1>Sal de aquí.<br /><em>Pero elige bien.</em></h1>
        <p className="home-hero__lead">Compara afluencia, presupuesto y mejor momento. El viaje empieza tomando una buena decisión.</p>
        <SearchBox value={filters.q || ''} onChange={(value) => update('q', value)} onSubmit={() => void search()} />
        <button className="filter-trigger" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}><SlidersHorizontal /> Afinar la búsqueda {activeCount > 0 && <b>{activeCount}</b>}<ChevronDown /></button>
      </div>
      <div className="image-wall" aria-label="Destinos destacados">
        {featured.slice(0, 3).map((destino, index) => <Link key={destino.id} to={`/destino/${destino.id}`} className={`image-wall__panel image-wall__panel--${index + 1}`}><img src={imageUrl(destino.imagen)} alt={destino.nombre} /><span><b>{String(index + 1).padStart(2, '0')}</b>{destino.nombre}</span></Link>)}
        {featured.length === 0 && <div className="image-wall__fallback"><Sparkles /><span>Tu próxima historia empieza aquí</span></div>}
      </div>
    </section>

    {filtersOpen && <section className="filter-drawer" aria-label="Filtros de búsqueda">
      <div className="filter-drawer__grid">
        <label>Mes<select value={filters.month || ''} onChange={(e) => update('month', e.target.value)}><option value="">Cualquier momento</option>{['1','2','3','4','5','6','7','8','9','10','11','12'].map((m) => <option key={m} value={m}>{new Date(2026, Number(m)-1).toLocaleString('es', { month: 'long' })}</option>)}</select></label>
        <label>Presupuesto<select value={filters.presupuesto || ''} onChange={(e) => update('presupuesto', e.target.value)}><option value="">Cualquiera</option><option>Bajo</option><option>Medio-Bajo</option><option>Medio</option><option>Medio-Alto</option><option>Alto</option></select></label>
        <label>Afluencia<select value={filters.masificacion || ''} onChange={(e) => update('masificacion', e.target.value)}><option value="">Cualquiera</option><option>Bajo</option><option>Medio-Bajo</option><option>Medio</option><option>Medio-Alto</option><option>Alto</option></select></label>
        <label>Tipo de viaje<select value={filters.tipoTurismo || ''} onChange={(e) => update('tipoTurismo', e.target.value)}><option value="">Cualquiera</option>{travelModes.map((mode) => <option key={mode}>{mode}</option>)}</select></label>
      </div>
      <div className="filter-drawer__actions"><label className="check"><input type="checkbox" checked={filters.avoidCrowds === 'true'} onChange={(e) => update('avoidCrowds', e.target.checked ? 'true' : '')} /> Evitar aglomeraciones</label><button className="button button--secondary" onClick={() => { setFilters({}); setParams({}); void search({}); }}>Limpiar</button><button className="button button--primary" onClick={() => { setFiltersOpen(false); void search(); }}>Ver resultados</button></div>
    </section>}

    <section className="trip-moods">
      <div><p className="kicker">Empieza por una sensación</p><h2>¿Qué quieres que pase?</h2></div>
      <div className="trip-moods__list">{travelModes.map((mode, index) => <button key={mode} onClick={() => { const next = { ...filters, tipoTurismo: mode }; setFilters(next); void search(next); document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }); }}><span>{String(index + 1).padStart(2, '0')}</span>{mode}<ArrowRight /></button>)}</div>
    </section>

    <section id="results" className="results-section">
      <header className="section-head"><div><p className="kicker">{activeCount ? 'Tu búsqueda' : 'La selección completa'}</p><h2>{activeCount ? `${results.length} lugares encajan` : 'Sitios que merecen el viaje'}</h2></div><Link to="/mapa">Abrir en el mapa <Map /></Link></header>
      {error && <Notice tone="error">{error}. Revisa la conexión e inténtalo de nuevo.</Notice>}
      {loading ? <Loader label="Buscando lugares" /> : <div className="destination-list">{results.map((destino, index) => <DestinationCard key={destino.id} destino={destino} index={index} />)}</div>}
    </section>

    <section className="decision-band"><div><CalendarDays /><span>Cuándo ir</span><b>Temporadas comparadas</b></div><div><Users /><span>Cuánta gente</span><b>Afluencia estimada</b></div><div><Sparkles /><span>Por qué merece la pena</span><b>Selección independiente</b></div></section>
  </Shell>;
}
