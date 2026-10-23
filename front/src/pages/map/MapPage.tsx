import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import {
  ArrowLeft,
  List,
  Map as MapIcon,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { Shell } from '../../components/layout';
import { Dialog, Empty, Loader, MediaImage, Toast } from '../../components/ui';
import { ExternalMapGate, useConsent } from '../../features/privacy/CookieConsent';
import { HomeFilterPanel } from '../../features/search/HomeFilterPanel';
import { getActiveFilterChips, removeActiveFilter } from '../../utils/filterFallbackEngine';
import {
  TourismMark,
  tourismColorStyle,
  tourismDefinition,
  tourismTypes,
} from '../../features/tourism/tourism';
import { useCompare, useTourismTypes } from '../../contexts';
import { api } from '../../services/api';
import { t } from '../../i18n';
import { imageUrl, plain, queryString } from '../../utils';
import type { Destino, FilterOptions, SearchFilters } from '../../types';
import { MapDestinationDetails } from './MapDestinationDetails';
import { AtlasMapPoints, AtlasViewport } from './AtlasMapLayers';

const filterKeys = [
  'q',
  'countryCode',
  'region',
  'month',
  'ubicacion',
  'presupuesto',
  'masificacion',
  'tipoTurismo',
  'actividades',
  'avoidCrowds',
];
export default function MapPage() {
  const [params, setParams] = useSearchParams(),
    { maps } = useConsent(),
    compare = useCompare(),
    { tourismTypes: catalog } = useTourismTypes();
  const filters = useMemo(
    () => Object.fromEntries([...params].filter(([k]) => filterKeys.includes(k))) as SearchFilters,
    [params],
  );
  const filterKey = queryString(filters),
    selected = params.get('destino'),
    listOpen = params.get('vista') === 'lista';
  const [destinations, setDestinations] = useState<Destino[]>([]),
    [options, setOptions] = useState<FilterOptions>({ locations: [], activities: [] }),
    [query, setQuery] = useState(filters.q || ''),
    [draft, setDraft] = useState<SearchFilters>({}),
    [filtersOpen, setFiltersOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [retry, setRetry] = useState(0),
    [fitVersion, setFitVersion] = useState(0),
    [tilesReady, setTilesReady] = useState(false),
    [tilesFailed, setTilesFailed] = useState(false),
    [message, setMessage] = useState(''),
    [motionSource, setMotionSource] = useState<'pointer' | 'keyboard'>('keyboard');
  const viewRef = useRef<HTMLButtonElement>(null);
  const active = destinations.find((d) => d.id === selected),
    chips = getActiveFilterChips(filters),
    legend = catalog.length ? catalog.map((c) => tourismDefinition(c.name, catalog)) : tourismTypes;
  useEffect(() => setQuery(filters.q || ''), [filters.q]);
  useEffect(() => {
    const c = new AbortController();
    api<FilterOptions>('/destinos/filter-options', { signal: c.signal })
      .then(setOptions)
      .catch(() => {});
    return () => c.abort();
  }, []);
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError('');
    api<Destino[]>(`/mapa${filterKey}`, { signal: ctrl.signal })
      .then((items) => {
        if (!ctrl.signal.aborted) setDestinations(items);
      })
      .catch((e) => {
        if (!ctrl.signal.aborted)
          setError(e instanceof Error ? e.message : t('No se pudo cargar el mapa'));
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [filterKey, retry]);
  function changeView(list: boolean) {
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (list) n.set('vista', 'lista');
      else n.delete('vista');
      return n;
    });
    setMessage(t(list ? 'Lista de resultados abierta' : 'Vista de mapa abierta'));
  }
  function apply(next: SearchFilters) {
    setParams((p) => {
      const n = new URLSearchParams();
      if (p.get('lang')) n.set('lang', p.get('lang')!);
      for (const [k, v] of Object.entries(next)) if (v && filterKeys.includes(k)) n.set(k, v);
      return n;
    });
    setFiltersOpen(false);
  }
  function select(id: string, source: 'pointer' | 'keyboard' = 'pointer') {
    setMotionSource(source);
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set('destino', id);
      n.delete('vista');
      return n;
    });
    const d = destinations.find((d) => d.id === id);
    if (d) setMessage(t('Destino seleccionado: {0}', { 0: d.nombre.trim() }));
  }
  function close() {
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.delete('destino');
      return n;
    });
    viewRef.current?.focus({ preventScroll: true });
    setMessage(t('Detalle cerrado. Puedes elegir otro destino.'));
  }
  return (
    <Shell footer={false}>
      <section
        className="atlas-map"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && active && !filtersOpen) {
            e.preventDefault();
            close();
          }
        }}
      >
        <header className="atlas-map__toolbar">
          <div className="atlas-map__top">
            <Link className="atlas-map__back" to="/" aria-label={t('Volver a descubrir')}>
              <ArrowLeft aria-hidden="true" />
              <span>{t('Volver a descubrir')}</span>
            </Link>
            <h1>{t('Tu próxima parada.')}</h1>
            <Link className="atlas-map__compare" to="/comparar" aria-label={t('Comparar destinos')}>
              ⇄<b>{compare.ids.length}</b>
            </Link>
          </div>
          <div className="atlas-map__search-row">
            <form
              role="search"
              aria-label={t('Buscar en el mapa')}
              onSubmit={(e) => {
                e.preventDefault();
                apply({ ...filters, q: query.trim() });
              }}
            >
              <Search aria-hidden="true" />
              <label className="sr-only" htmlFor="atlas-map-query">
                {t('Buscar en el mapa')}
              </label>
              <input
                type="search"
                id="atlas-map-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Destino, municipio o actividad')}
              />
              <button type="submit" className="button button--primary">
                {t('Buscar')} →
              </button>
            </form>
            <button
              type="button"
              className="button button--secondary atlas-map__filter-trigger"
              aria-label={t('Filtros')}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              onClick={() => {
                setDraft(filters);
                setFiltersOpen(true);
              }}
            >
              <SlidersHorizontal aria-hidden="true" />
              <span>{t('Filtros')}</span>
              {chips.length > 0 && <b>{chips.length}</b>}
            </button>
          </div>
          <div className="atlas-map__status">
            <p role="status">
              {loading ? t('Buscando…') : t('{0} destinos', { 0: destinations.length })}
            </p>
            <div className="atlas-map__view-switch" role="group" aria-label={t('Vista del mapa')}>
              <button
                ref={viewRef}
                type="button"
                aria-pressed={!listOpen}
                onClick={() => changeView(false)}
              >
                <MapIcon aria-hidden="true" />
                {t('Mapa')}
              </button>
              <button type="button" aria-pressed={listOpen} onClick={() => changeView(true)}>
                <List aria-hidden="true" />
                {t('Lista')}
              </button>
            </div>
          </div>
          {!!chips.length && (
            <div className="atlas-map__chips" aria-label={t('Filtros aplicados')}>
              {chips.map((chip) => (
                <button
                  type="button"
                  key={chip.id}
                  onClick={() => {
                    apply(removeActiveFilter(filters, chip.key, chip.value));
                    setMessage(t('Filtro eliminado'));
                  }}
                  aria-label={t('Quitar filtro: {0}', { 0: chip.label })}
                >
                  {chip.label}
                  <X aria-hidden="true" />
                </button>
              ))}
              <button type="button" onClick={() => apply({})}>
                {t('Limpiar')}
              </button>
            </div>
          )}
        </header>
        {error && (
          <div className="notice notice--error" role="alert">
            {error}
            <button className="button button--quiet" onClick={() => setRetry((n) => n + 1)}>
              {t('Reintentar')}
            </button>
          </div>
        )}
        <div
          className={`atlas-map__workspace ${listOpen ? 'is-list' : ''} ${active ? 'has-detail' : ''}`}
          aria-busy={loading}
        >
          <div className="atlas-map__canvas" hidden={listOpen}>
            <ExternalMapGate>
              <MapContainer
                center={[40, -3.5]}
                zoom={5}
                zoomControl={false}
                className="atlas-map__leaflet"
              >
                <TileLayer
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  maxZoom={19}
                  eventHandlers={{
                    loading: () => {
                      setTilesReady(false);
                      setTilesFailed(false);
                    },
                    load: () => setTilesReady(true),
                    tileerror: () => setTilesFailed(true),
                  }}
                />
                <ZoomControl position="topleft" />
                <AtlasViewport
                  destinations={destinations}
                  selected={active}
                  visible={!listOpen}
                  fitVersion={fitVersion}
                />
                <AtlasMapPoints
                  destinations={destinations}
                  selectedId={selected}
                  onSelect={(id) => select(id)}
                  onNotice={setMessage}
                />
              </MapContainer>
            </ExternalMapGate>
            {maps && !tilesReady && !tilesFailed && (
              <p className="atlas-map__map-state" role="status">
                {t('Cargando cartografía')}
              </p>
            )}
            {maps && tilesFailed && !tilesReady && (
              <p className="atlas-map__map-state" role="alert">
                {t('No se pudo cargar la cartografía')}{' '}
                <button onClick={() => changeView(true)}>{t('Lista')}</button>
              </p>
            )}
            <button
              type="button"
              className="button atlas-map__fit"
              disabled={!destinations.length || !maps}
              onClick={() => {
                setFitVersion((v) => v + 1);
                setMessage(t('Mapa ajustado a los resultados visibles'));
              }}
              aria-label={t('Encuadrar todos los resultados')}
            >
              <MapPin aria-hidden="true" />
              <span>{t('Ver todos')}</span>
            </button>
            <details className="atlas-map__legend">
              <summary>{t('Tipos de viaje')}</summary>
              <div>
                {legend.map((type) => (
                  <span key={type.key} style={tourismColorStyle(type.colorValue)}>
                    <type.Icon aria-hidden="true" />
                    {type.displayLabel || t(type.label)}
                  </span>
                ))}
              </div>
            </details>
            {!loading && !destinations.length && !error && (
              <div className="atlas-map__empty">
                <Empty
                  title={t('Ningún destino coincide')}
                  action={
                    <button className="button button--sun" onClick={() => apply({})}>
                      {t('Limpiar filtros')}
                    </button>
                  }
                >
                  {t('Prueba con otra zona o elimina algún filtro.')}
                </Empty>
              </div>
            )}
          </div>
          {listOpen && (
            <section className="atlas-map__list" aria-label={t('Destinos del mapa')}>
              {loading ? (
                <Loader />
              ) : !destinations.length ? (
                <Empty
                  title={t('Ningún destino coincide')}
                  action={
                    <button className="button button--sun" onClick={() => apply({})}>
                      {t('Limpiar filtros')}
                    </button>
                  }
                >
                  {error || t('Prueba con otra zona o elimina algún filtro.')}
                </Empty>
              ) : (
                <ol>
                  {destinations.map((d) => (
                    <li key={d.id}>
                      <button
                        id={`map-result-${d.id}`}
                        type="button"
                        className="atlas-map__result"
                        aria-pressed={d.id === selected}
                        onClick={(e) => select(d.id, e.detail ? 'pointer' : 'keyboard')}
                      >
                        <MediaImage src={imageUrl(d.imagen)} alt="" loading="lazy" />
                        <span>
                          <small>
                            {[d.country?.name && t(d.country.name), d.region || plain(d.ubicacion)]
                              .filter(Boolean)
                              .join(' · ')}
                          </small>
                          <strong>{d.nombre.trim()}</strong>
                          {d.searchMatch && <small>{t(d.searchMatch.label)}</small>}
                          <TourismMark value={d.tipoTurismoPrincipal} compact />
                          <small>{t('Mostrar en el mapa')} ↗</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
          {!listOpen && active && (
            <MapDestinationDetails
              key={active.id}
              destination={active}
              onClose={close}
              motionSource={motionSource}
              onNotice={setMessage}
              index={destinations.indexOf(active)}
              total={destinations.length}
              onStep={(step) => {
                const d = destinations[destinations.indexOf(active) + step];
                if (d) select(d.id);
              }}
            />
          )}
        </div>
        {filtersOpen && (
          <Dialog
            title={t('Filtros del mapa')}
            onClose={() => setFiltersOpen(false)}
            className="atlas-map-filter-dialog"
          >
            <HomeFilterPanel
              panelOnly
              filters={draft}
              isOpen
              activeCount={getActiveFilterChips(draft).length}
              countries={options.countries}
              locations={options.locations}
              locationLabels={options.locationLabels}
              activities={options.activities}
              onToggle={() => setFiltersOpen(false)}
              onUpdate={(key, value) =>
                setDraft((d) => ({
                  ...d,
                  [key]: value,
                  ...(key === 'countryCode' ? { region: '' } : {}),
                }))
              }
              onClear={() => setDraft({})}
              onApply={() => {
                apply(draft);
                setMessage(t('Filtros aplicados'));
              }}
            />
          </Dialog>
        )}
        {message && (
          <Toast
            key={message}
            duration={4000}
            onDismiss={() => setMessage('')}
            className="atlas-map__feedback"
          >
            {message}
          </Toast>
        )}
      </section>
    </Shell>
  );
}
