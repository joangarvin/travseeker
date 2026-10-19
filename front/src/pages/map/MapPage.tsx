import { ExternalMapGate, useConsent } from '../../features/privacy/CookieConsent';
import { t, intlLocale } from '../../i18n';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  ZoomControl,
} from 'react-leaflet';
import { divIcon } from 'leaflet';
import {
  List,
  Check,
  LocateFixed,
  Map as MapIcon,
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
  tourismColorStyle,
  tourismDefinition,
  tourismQueryValue,
  tourismTypes,
  tourismValues,
} from '../../features/tourism/tourism';
import { imageUrl, plain, queryString } from '../../utils';
import type { Destino, FilterOptions, SearchFilters } from '../../types';
import { Empty, Loader, MediaImage } from '../../components/ui';
import { Shell } from '../../components/layout';
import { useTourismTypes } from '../../contexts';
import { MapDestinationDetails } from './MapDestinationDetails';

export default function MapPage() {
  const { maps } = useConsent();
  const { tourismTypes: tourismCatalog } = useTourismTypes();
  const legendTypes = useMemo(
    () =>
      tourismCatalog.length
        ? tourismCatalog.map((type) => tourismDefinition(type.name, tourismCatalog))
        : tourismTypes,
    [tourismCatalog],
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [filters, setFilters] = useState<SearchFilters>(() =>
    Object.fromEntries([...searchParams.entries()].filter(([key]) => key !== 'lang')),
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
  const listRef = useRef<HTMLElement>(null);
  const mapViewRef = useRef<HTMLButtonElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [motionSource, setMotionSource] = useState<'pointer' | 'keyboard'>('keyboard');
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);
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
    const controller = new AbortController();
    const nextParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
    });
    setSearchParams(
      (current) => {
        const language = current.get('lang');
        if (language) nextParams.set('lang', language);
        return nextParams;
      },
      { replace: true },
    );
    api<Destino[]>(`/mapa${queryString(filters)}`, { signal: controller.signal })
      .then((items) => {
        setDestinos(items);
        setSelected((previous) => (items.some((item) => item.id === previous) ? previous : null));
      })
      .catch((cause) =>
        controller.signal.aborted
          ? undefined
          : setError(cause instanceof Error ? cause.message : t('No se pudo cargar el mapa')),
      )
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, setSearchParams, retry]);

  const active = useMemo(() => destinos.find((item) => item.id === selected), [destinos, selected]);
  useEffect(() => {
    if (!selected || !listOpen) return;
    const frame = requestAnimationFrame(() =>
      listRef.current
        ?.querySelector('[data-selected="true"]')
        ?.scrollIntoView({ block: 'nearest', behavior: 'instant' }),
    );
    return () => cancelAnimationFrame(frame);
  }, [selected, listOpen]);
  const closeSelected = () => {
    const previous = selected;
    setSelected(null);
    requestAnimationFrame(() => {
      const row = previous && document.getElementById(`map-result-${previous}`);
      (row || mapViewRef.current)?.focus({ preventScroll: true });
    });
  };
  const update = (key: keyof SearchFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));
  const filterCount = Object.entries(filters).filter(([key, value]) => key !== 'q' && value).length;
  const clear = () => {
    setQuery('');
    setFilters({});
  };

  return (
    <Shell footer={false}>
      <section
        className="map-workspace"
        onKeyDown={(event) => {
          if (event.key === 'Escape' && active && !filtersOpen) {
            event.preventDefault();
            closeSelected();
          }
        }}
      >
        <header className="map-toolbar">
          <div className="map-toolbar__title">
            <h1>{t('El mapa')}</h1>
            <span aria-live="polite">
              {loading ? t('Buscando…') : t('{0} destinos', { 0: destinos.length })}
            </span>
          </div>
          <div className="map-search">
            <Search aria-hidden />
            <label className="sr-only" htmlFor="map-query">
              {t('Buscar en el mapa')}
            </label>
            <input
              id="map-query"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('Destino, municipio o actividad')}
            />
            {query && (
              <button
                type="button"
                className="map-search__clear"
                aria-label={t('Borrar búsqueda')}
                onClick={() => {
                  setQuery('');
                  document.getElementById('map-query')?.focus();
                }}
              >
                <X aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="map-toolbar__actions">
            <button
              className="button button--secondary"
              onClick={(event) => {
                setMotionSource(event.detail > 0 ? 'pointer' : 'keyboard');
                setFiltersOpen((value) => !value);
              }}
              aria-label={t('Filtros')}
              aria-expanded={filtersOpen}
              aria-controls="map-filters"
            >
              <SlidersHorizontal /> {t('Filtros')} {filterCount > 0 && <b>{filterCount}</b>}
            </button>
            <div className="map-view-switch" role="group" aria-label={t('Vista del mapa')}>
              <button
                type="button"
                aria-pressed={listOpen}
                onClick={(event) => {
                  setMotionSource(event.detail > 0 ? 'pointer' : 'keyboard');
                  setListOpen(true);
                }}
              >
                <List aria-hidden="true" />
                {t('Lista')}
              </button>
              <button
                ref={mapViewRef}
                type="button"
                aria-pressed={!listOpen}
                onClick={(event) => {
                  setMotionSource(event.detail > 0 ? 'pointer' : 'keyboard');
                  setListOpen(false);
                }}
              >
                <MapIcon aria-hidden="true" />
                {t('Mapa')}
              </button>
            </div>
          </div>
        </header>
        {filtersOpen && (
          <div
            className="map-filters"
            id="map-filters"
            role="region"
            aria-label={t('Filtros del mapa')}
            data-motion-trigger={motionSource}
          >
            <select
              value={filters.month || ''}
              onChange={(event) => update('month', event.target.value)}
              aria-label={t('Mes')}
            >
              <option value="">{t('Cualquier mes')}</option>
              {Array.from({ length: 12 }).map((_, index) => (
                <option key={index} value={String(index + 1)}>
                  {new Date(2026, index).toLocaleString(intlLocale, { month: 'long' })}
                </option>
              ))}
            </select>
            <select
              value={filters.ubicacion || ''}
              onChange={(event) => update('ubicacion', event.target.value)}
              aria-label={t('Ubicación')}
            >
              <option value="">{t('Cualquier ubicación')}</option>
              {filterOptions.locations.map((location) => (
                <option key={location} value={location}>
                  {filterOptions.locationLabels?.[location] || t(location)}
                </option>
              ))}
            </select>
            <select
              value={filters.presupuesto || ''}
              onChange={(event) => update('presupuesto', event.target.value)}
              aria-label={t('Presupuesto')}
            >
              <option value="">{t('Cualquier presupuesto')}</option>
              <option>{t('Bajo')}</option>
              <option>{t('Medio-Bajo')}</option>
              <option>{t('Medio')}</option>
              <option>{t('Medio-Alto')}</option>
              <option>{t('Alto')}</option>
            </select>
            <select
              value={filters.masificacion || ''}
              onChange={(event) => update('masificacion', event.target.value)}
              aria-label={t('Masificación')}
            >
              <option value="">{t('Cualquier afluencia')}</option>
              <option>{t('Bajo')}</option>
              <option>{t('Medio-Bajo')}</option>
              <option>{t('Medio')}</option>
              <option>{t('Medio-Alto')}</option>
              <option>{t('Alto')}</option>
            </select>
            <div className="map-filters__tourism">
              <TourismMultiSelect
                id="map-tourism-types"
                label={t('Tipos de viaje')}
                value={tourismValues(filters.tipoTurismo)}
                compact
                onChange={(values) => update('tipoTurismo', tourismQueryValue(values))}
              />
            </div>
            <div className="map-filters__activities">
              <ActivityMultiSelect
                id="map-activities"
                label={t('Actividades')}
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
              {t('Evitar aglomeraciones')}
            </label>
            {(query || Object.values(filters).some(Boolean)) && (
              <button onClick={clear}>
                <X /> {t('Limpiar')}
              </button>
            )}
          </div>
        )}
        {error && (
          <div className="notice notice--error" role="alert">
            {error}{' '}
            <button
              type="button"
              className="button button--quiet"
              onClick={() => setRetry((value) => value + 1)}
            >
              {t('Reintentar')}
            </button>
          </div>
        )}
        <div className={`map-layout ${listOpen ? 'map-layout--list' : 'map-layout--closed'}`}>
          {listOpen && (
            <aside ref={listRef} className="map-list" aria-label={t('Destinos del mapa')}>
              {loading ? (
                <Loader />
              ) : error ? (
                <Empty title={t('El mapa no está disponible')}>{error}</Empty>
              ) : destinos.length ? (
                <ol className="map-results">
                  {destinos.map((destino, index) => (
                    <li
                      key={destino.id}
                      className="map-list__item"
                      data-selected={selected === destino.id}
                    >
                      <button
                        id={`map-result-${destino.id}`}
                        type="button"
                        onClick={(event) => {
                          setMotionSource(event.detail > 0 ? 'pointer' : 'keyboard');
                          setSelected(destino.id);
                          if (window.matchMedia('(max-width: 760px)').matches) setListOpen(false);
                        }}
                        className="map-result"
                        aria-pressed={selected === destino.id}
                        aria-controls={
                          selected === destino.id && maps ? `map-detail-${destino.id}` : undefined
                        }
                      >
                        <MediaImage src={imageUrl(destino.imagen)} alt="" loading="lazy" />
                        <span className="map-result__body">
                          <span className="map-result__eyebrow">
                            <small>
                              {String(index + 1).padStart(2, '0')} · {plain(destino.ubicacion)}
                            </small>
                            <Check aria-hidden="true" />
                          </span>
                          <strong className="map-result__name">{destino.nombre.trim()}</strong>
                          {destino.searchMatch && (
                            <small className="map-list__match">
                              {t(destino.searchMatch.label)}
                            </small>
                          )}
                          <span className="map-result__facts">
                            <span>
                              {t('Presupuesto')} <b>{t(plain(destino.presupuesto))}</b>
                            </span>
                            <span>
                              {t('Afluencia')} <b>{t(plain(destino.masificacion))}</b>
                            </span>
                          </span>
                          <TourismMark value={destino.tipoTurismoPrincipal} compact />
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <Empty title={t('Ningún destino coincide')}>
                  {t('Prueba con otra zona o elimina algún filtro.')}
                </Empty>
              )}
            </aside>
          )}
          <div className="map-canvas" data-tour="map">
            <ExternalMapGate>
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
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                <ZoomControl position="bottomright" />
                <MapSizeSync layoutKey={`${listOpen}-${filtersOpen}`} />
                <MapViewport destinations={destinos} selected={active} />
                <MapPoints
                  destinations={destinos}
                  selectedId={selected}
                  onSelect={(id) => {
                    setMotionSource('pointer');
                    setSelected(id);
                  }}
                />
                {active?.latitud != null && active.longitud != null && (
                  <Popup
                    key={active.id}
                    position={[active.latitud, active.longitud]}
                    className="map-destination-popup"
                    offset={[0, -15]}
                    minWidth={220}
                    maxWidth={300}
                    maxHeight={350}
                    autoPanPadding={[16, 16]}
                    closeButton={false}
                    closeOnClick={false}
                    closeOnEscapeKey={false}
                  >
                    <MapDestinationDetails
                      destination={active}
                      onClose={closeSelected}
                      motionSource={motionSource}
                    />
                  </Popup>
                )}
              </MapContainer>
            </ExternalMapGate>
            {maps && !tilesReady && !tilesFailed && (
              <div className="map-state" role="status">
                <span />
                <b>{t('Cargando cartografía')}</b>
              </div>
            )}
            {maps && tilesFailed && !tilesReady && (
              <div className="map-state map-state--error" role="alert">
                <MapIcon />
                <span>
                  <b>{t('No se pudo cargar la cartografía')}</b>
                  <small>{t('Los resultados siguen disponibles en la lista.')}</small>
                </span>
              </div>
            )}
            <div className="map-legend" aria-label={t('Leyenda de tipos de turismo')}>
              {legendTypes.map((type) => (
                <span
                  className={`tourism--${type.key}`}
                  key={type.label}
                  style={tourismColorStyle(type.colorValue)}
                >
                  <span className="map-legend__symbol">
                    <type.Icon aria-hidden />
                  </span>
                  <b>{type.displayLabel || t(type.label)}</b>
                </span>
              ))}
            </div>
            <div className="map-watermark">
              <LocateFixed aria-hidden="true" />{' '}
              {active?.nombre.trim() || t('Mueve el mapa o elige un resultado')}
            </div>
          </div>
        </div>
        <p className="sr-only" role="status">
          {active ? t('Destino seleccionado: {0}', { 0: active.nombre.trim() }) : ''}
        </p>
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

type TourismCatalog = ReturnType<typeof useTourismTypes>['tourismTypes'];

function clusterGradient(items: Destino[], catalog: TourismCatalog) {
  const counts = new Map<string, number>();
  items.forEach((item) => {
    const color = tourismDefinition(item.tipoTurismoPrincipal, catalog).colorValue;
    // Admin-defined colors end up inside inline HTML, so only plain hex values are allowed.
    const safe = /^#[0-9a-f]{6}$/i.test(color) ? color : '#5f6470';
    counts.set(safe, (counts.get(safe) || 0) + 1);
  });
  let start = 0;
  const stops = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color, count]) => {
      const end = start + (count / items.length) * 360;
      const stop = `${color} ${start}deg ${end}deg`;
      start = end;
      return stop;
    });
  return `conic-gradient(${stops.join(', ')})`;
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
  const subscribeToZoom = useCallback(
    (notify: () => void) => {
      map.on('zoomend', notify);
      return () => {
        map.off('zoomend', notify);
      };
    },
    [map],
  );
  const zoom = useSyncExternalStore(subscribeToZoom, () => map.getZoom());
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
              title={t('{0} destinos', { 0: group.items.length })}
              icon={divIcon({
                className: 'map-cluster',
                html: `<span style="background:${clusterGradient(group.items, tourismCatalog)}"><b>${group.items.length}</b></span>`,
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
            className="map-marker"
            center={[destination.latitud!, destination.longitud!]}
            radius={active ? 13 : 9}
            pathOptions={{
              color: active ? 'var(--ink)' : 'var(--surface)',
              fillColor: type.colorValue,
              weight: active ? 4 : 3,
              fillOpacity: 1,
            }}
            eventHandlers={{ click: () => onSelect(destination.id) }}
          />
        );
      })}
    </>
  );
}
