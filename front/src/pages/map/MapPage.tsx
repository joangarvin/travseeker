import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet';
import { divIcon } from 'leaflet';
import {
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';
import { TourismMultiSelect } from '../../features/tourism/TourismMultiSelect';
import { ActivityMultiSelect } from '../../features/activities/ActivityMultiSelect';
import {
  activityQueryValue,
  activityTypes,
  activityValues,
} from '../../features/activities/activities';
import {
  TourismMark,
  tourismDefinition,
  tourismQueryValue,
  tourismTypes,
  tourismValues,
} from '../../features/tourism/tourism';
import { imageUrl, plain, queryString } from '../../utils';
import type { Destino, FilterOptions, SearchFilters } from '../../types';
import { Empty, Loader, MediaImage } from '../../components/ui';
import { Shell } from '../../components/layout';
import { useTheme, useTourismTypes } from '../../contexts';

export default function MapPage() {
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(() =>
    Object.fromEntries(searchParams.entries()),
  );
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    locations: ['Costa', 'Interior', 'Isla', 'Montaña'],
    activities: activityTypes.map((activity) => activity.label),
  });
  const [query, setQuery] = useState(() => searchParams.get('q') || '');
  const [selected, setSelected] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(
    () => typeof window === 'undefined' || !window.matchMedia('(max-width: 760px)').matches,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tilesReady, setTilesReady] = useState(false);
  const [tilesFailed, setTilesFailed] = useState(false);

  useEffect(() => {
    api<FilterOptions>('/destinos/filter-options')
      .then(setFilterOptions)
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => setFilters((current) => ({ ...current, q: query })), 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    setLoading(true);
    setError('');
    const nextParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
    });
    setSearchParams(nextParams, { replace: true });
    api<Destino[]>(`/mapa${queryString(filters)}`)
      .then(setDestinos)
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'No se pudo cargar el mapa'),
      )
      .finally(() => setLoading(false));
  }, [filters, setSearchParams]);

  const active = useMemo(() => destinos.find((item) => item.id === selected), [destinos, selected]);
  const update = (key: keyof SearchFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const filterCount = Object.entries(filters).filter(([key, value]) => key !== 'q' && value).length;
  const clear = () => {
    setQuery('');
    setFilters({});
  };

  return (
    <Shell footer={false}>
      <section className="map-workspace">
        <header className="map-toolbar">
          <div className="map-toolbar__title">
            <p className="kicker">Exploración visual</p>
            <h1>El mapa</h1>
            <span>{loading ? 'Buscando…' : `${destinos.length} destinos`}</span>
          </div>
          <label className="map-search">
            <Search aria-hidden />
            <span className="sr-only">Buscar en el mapa</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Destino, municipio o actividad"
            />
          </label>
          <div className="map-toolbar__actions">
            <button
              className="button button--secondary"
              onClick={() => setFiltersOpen((value) => !value)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal /> Filtros {filterCount > 0 && <b>{filterCount}</b>}
            </button>
            <button
              className="icon-button"
              onClick={() => setListOpen((value) => !value)}
              aria-label={listOpen ? 'Ver solo el mapa' : 'Mostrar lista de destinos'}
              title={listOpen ? 'Ver solo el mapa' : 'Mostrar lista'}
            >
              {listOpen ? <MapIcon /> : <List />}
            </button>
          </div>
        </header>
        {filtersOpen && (
          <div className="map-filters">
            <select
              value={filters.month || ''}
              onChange={(event) => update('month', event.target.value)}
              aria-label="Mes"
            >
              <option value="">Cualquier mes</option>
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index} value={String(index + 1)}>
                  {new Date(2026, index).toLocaleString('es', { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={filters.ubicacion || ''}
              onChange={(event) => update('ubicacion', event.target.value)}
              aria-label="Ubicación"
            >
              <option value="">Cualquier ubicación</option>
              {filterOptions.locations.map((location) => (
                <option key={location}>{location}</option>
              ))}
            </select>
            <select
              value={filters.presupuesto || ''}
              onChange={(event) => update('presupuesto', event.target.value)}
              aria-label="Presupuesto"
            >
              <option value="">Cualquier presupuesto</option>
              <option>Bajo</option>
              <option>Medio-Bajo</option>
              <option>Medio</option>
              <option>Medio-Alto</option>
              <option>Alto</option>
            </select>
            <select
              value={filters.masificacion || ''}
              onChange={(event) => update('masificacion', event.target.value)}
              aria-label="Masificación"
            >
              <option value="">Cualquier afluencia</option>
              <option>Bajo</option>
              <option>Medio-Bajo</option>
              <option>Medio</option>
              <option>Medio-Alto</option>
              <option>Alto</option>
            </select>
            <div className="map-filters__tourism">
              <TourismMultiSelect
                id="map-tourism-types"
                label="Tipos de viaje"
                value={tourismValues(filters.tipoTurismo)}
                compact
                onChange={(values) => update('tipoTurismo', tourismQueryValue(values))}
              />
            </div>
            <div className="map-filters__activities">
              <ActivityMultiSelect
                id="map-activities"
                label="Actividades"
                value={activityValues(filters.actividades)}
                suggestions={filterOptions.activities}
                compact
                onChange={(values) => update('actividades', activityQueryValue(values))}
              />
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={filters.avoidCrowds === 'true'}
                onChange={(event) => update('avoidCrowds', event.target.checked ? 'true' : '')}
              />{' '}
              Evitar aglomeraciones
            </label>
            {(query || Object.values(filters).some(Boolean)) && (
              <button onClick={clear}>
                <X /> Limpiar
              </button>
            )}
          </div>
        )}
        <div className={`map-layout ${listOpen ? '' : 'map-layout--closed'}`}>
          {listOpen && (
            <aside className="map-list" aria-label="Destinos del mapa">
              {loading ? (
                <Loader />
              ) : error ? (
                <Empty title="El mapa no está disponible">{error}</Empty>
              ) : destinos.length ? (
                destinos.map((destino, index) => (
                  <button
                    key={destino.id}
                    onClick={() => {
                      setSelected(destino.id);
                      if (window.matchMedia('(max-width: 760px)').matches) setListOpen(false);
                    }}
                    className={selected === destino.id ? 'is-active' : ''}
                    aria-pressed={selected === destino.id}
                  >
                    <MediaImage src={imageUrl(destino.imagen)} alt="" loading="lazy" />
                    <span>
                      <small>
                        {String(index + 1).padStart(2, '0')} · {plain(destino.ubicacion)}
                      </small>
                      <b>{destino.nombre.trim()}</b>
                      {destino.searchMatch && (
                        <small className="map-list__match">{destino.searchMatch.label}</small>
                      )}
                      <em>
                        {plain(destino.presupuesto)} · {plain(destino.masificacion)}
                      </em>
                      <TourismMark value={destino.tipoTurismoPrincipal} compact />
                    </span>
                  </button>
                ))
              ) : (
                <Empty title="Ningún destino coincide">
                  Prueba con otra zona o elimina algún filtro.
                </Empty>
              )}
            </aside>
          )}
          <div className="map-canvas">
            <MapContainer
              center={[40, -3.5]}
              zoom={
                typeof window !== 'undefined' && window.matchMedia('(max-width: 600px)').matches
                  ? 5
                  : 6
              }
              zoomControl={false}
              className="map"
            >
              <TileLayer
                key={theme}
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url={`https://{s}.basemaps.cartocdn.com/${theme === 'dark' ? 'dark_all' : 'light_all'}/{z}/{x}/{y}{r}.png`}
                subdomains="abcd"
                eventHandlers={{
                  loading: () => {
                    setTilesReady(false);
                    setTilesFailed(false);
                  },
                  load: () => setTilesReady(true),
                  tileerror: () => setTilesFailed(true),
                }}
              />
              <ZoomControl position="bottomright" />
              <MapSizeSync layoutKey={`${listOpen}-${filtersOpen}`} />
              <MapViewport destinations={destinos} selected={active} />
              <MapPoints destinations={destinos} selectedId={selected} onSelect={setSelected} />
            </MapContainer>
            {!tilesReady && !tilesFailed && (
              <div className="map-state" role="status">
                <span />
                <b>Cargando cartografía</b>
              </div>
            )}
            {tilesFailed && !tilesReady && (
              <div className="map-state map-state--error" role="alert">
                <MapIcon />
                <span>
                  <b>No se pudo cargar la cartografía</b>
                  <small>Los resultados siguen disponibles en la lista.</small>
                </span>
              </div>
            )}
            {active && (
              <article className="map-selected">
                <MediaImage src={imageUrl(active.imagen)} alt="" />
                <div>
                  <TourismMark value={active.tipoTurismoPrincipal} compact />
                  <span>{plain(active.ubicacion)}</span>
                  <h2>{active.nombre.trim()}</h2>
                  <p>
                    {plain(active.presupuesto)} · {plain(active.masificacion)}
                  </p>
                  <Link to={`/destino/${active.id}`}>
                    Ver destino <MapPin />
                  </Link>
                </div>
                <button onClick={() => setSelected(null)} aria-label="Cerrar">
                  <X />
                </button>
              </article>
            )}
            <div className="map-legend" aria-label="Leyenda de tipos de turismo">
              {tourismTypes.map((type) => (
                <span className={`tourism--${type.key}`} key={type.key}>
                  <span className="map-legend__symbol">
                    <type.Icon aria-hidden />
                  </span>
                  <b>{type.label}</b>
                </span>
              ))}
            </div>
            <div className="map-watermark">
              <LocateFixed /> Mueve el mapa o elige un resultado
            </div>
          </div>
        </div>
      </section>
    </Shell>
  );
}

function MapSizeSync({ layoutKey }: { layoutKey: string }) {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const refresh = () => map.invalidateSize({ pan: false });
    const observer = new ResizeObserver(refresh);
    observer.observe(container);
    const frame = requestAnimationFrame(refresh);
    window.addEventListener('resize', refresh);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', refresh);
    };
  }, [map]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return () => cancelAnimationFrame(frame);
  }, [layoutKey, map]);
  return null;
}

function MapViewport({ destinations, selected }: { destinations: Destino[]; selected?: Destino }) {
  const map = useMap();
  useEffect(() => {
    if (selected?.latitud != null && selected.longitud != null) {
      map.setView([selected.latitud, selected.longitud], Math.max(map.getZoom(), 8), {
        animate: false,
      });
      return;
    }
    const points = destinations
      .filter((destination) => destination.latitud != null && destination.longitud != null)
      .map((destination) => [destination.latitud!, destination.longitud!] as [number, number]);
    if (points.length > 24)
      map.setView([40, -3.5], map.getContainer().clientWidth < 600 ? 5 : 6, { animate: false });
    else if (points.length > 1)
      map.fitBounds(points, { padding: [42, 42], maxZoom: 7, animate: false });
    else if (points.length === 1) map.setView(points[0], 8, { animate: false });
  }, [destinations, selected, map]);
  return null;
}

function MapPoints({
  destinations,
  selectedId,
  onSelect,
}: {
  destinations: Destino[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const map = useMap();
  const { tourismTypes: tourismCatalog } = useTourismTypes();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });
  const groups = useMemo(() => {
    const located = destinations.filter(
      (destination) => destination.latitud != null && destination.longitud != null,
    );
    if (zoom >= 7)
      return located.map((destination) => ({
        key: destination.id,
        latitude: destination.latitud!,
        longitude: destination.longitud!,
        items: [destination],
      }));
    const compactViewport = map.getContainer().clientWidth < 600;
    const cell = zoom <= 5 ? (compactViewport ? 4.5 : 2.8) : 1.4;
    const grouped = new Map<string, Destino[]>();
    located.forEach((destination) => {
      const key = `${Math.round(destination.latitud! / cell)}:${Math.round(destination.longitud! / cell)}`;
      grouped.set(key, [...(grouped.get(key) || []), destination]);
    });
    return [...grouped.entries()].map(([key, items]) => ({
      key,
      latitude: items.reduce((sum, item) => sum + item.latitud!, 0) / items.length,
      longitude: items.reduce((sum, item) => sum + item.longitud!, 0) / items.length,
      items,
    }));
  }, [destinations, zoom, map]);
  return (
    <>
      {groups.map((group) => {
        if (group.items.length > 1)
          return (
            <Marker
              key={group.key}
              position={[group.latitude, group.longitude]}
              title={`${group.items.length} destinos`}
              icon={divIcon({
                className: 'map-cluster',
                html: `<span>${group.items.length}</span>`,
                iconSize: [38, 38],
                iconAnchor: [19, 19],
              })}
              eventHandlers={{
                click: () =>
                  map.setView([group.latitude, group.longitude], Math.min(zoom + 2, 9), {
                    animate: false,
                  }),
              }}
            />
          );
        const destination = group.items[0];
        const type = tourismDefinition(destination.tipoTurismoPrincipal, tourismCatalog);
        const active = selectedId === destination.id;
        return (
          <CircleMarker
            key={destination.id}
            center={[destination.latitud!, destination.longitud!]}
            radius={active ? 13 : 9}
            pathOptions={{
              className: `map-marker ${active ? 'is-selected' : ''}`,
              color: type.colorValue,
              fillColor: type.colorValue,
              weight: active ? 4 : 3,
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelect(destination.id) }}
          >
            <Popup>
              <div className="map-popup">
                <MediaImage src={imageUrl(destination.imagen)} alt="" />
                <TourismMark value={destination.tipoTurismoPrincipal} compact />
                <strong>{destination.nombre}</strong>
                <span>{plain(destination.ubicacion)}</span>
                <Link to={`/destino/${destination.id}`}>Abrir destino</Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
