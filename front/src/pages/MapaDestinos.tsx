import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X } from 'lucide-react';
import Header from '../components/layout/Header';
import MapClusters from '../components/map/MapClusters';
import { destinosApi, type MapDestino, type SearchFilters } from '../api/destinos';
import { SEARCH_FILTERS } from '../constants/filters';
import { parseJsonSafe } from '../utils/parseJson';
import { getImageUrl } from '../utils/images';

const SPAIN_CENTER: [number, number] = [40.0, -3.5];
const MAP_FILTER_KEYS = ['tipoTurismo', 'presupuesto', 'masificacion', 'ubicacion'] as const;

export default function MapaDestinos() {
  const [destinos, setDestinos] = useState<MapDestino[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);

  const mapFilters = useMemo(
    () => SEARCH_FILTERS.filter((f) => (MAP_FILTER_KEYS as readonly string[]).includes(f.key)),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    destinosApi.getMapa(filters, controller.signal)
      .then((data) => {
        setDestinos(data);
        setActiveId(null);
      })
      .catch(() => { /* abort o error */ })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [filters]);

  const activeCount = Object.values(filters).filter(Boolean).length;
  const updateFilter = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const onSelect = useCallback((id: string) => {
    setActiveId(id);
    setListOpen(true);
  }, []);

  const sorted = useMemo(
    () => [...destinos].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [destinos],
  );

  return (
    <div className="map-page">
      <Header />

      <div className="map-page__body">
        <div className="map-page__toolbar">
          <div className="map-page__toolbar-inner">
            <div className="map-page__toolbar-head">
              <div className="map-page__title">
                <MapPin className="map-page__title-icon" />
                El mapa
                <span className="map-page__subtitle">
                  {loading ? 'cargando…' : `${destinos.length} destino${destinos.length === 1 ? '' : 's'}`}
                </span>
              </div>

              <button
                type="button"
                className="map-page__list-toggle"
                onClick={() => setListOpen((v) => !v)}
                aria-pressed={listOpen}
              >
                {listOpen ? 'Ocultar lista' : 'Ver lista'}
              </button>

              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilters({})}
                  className="map-page__clear touch-target"
                >
                  <X className="icon-sm" /> Limpiar
                </button>
              )}
            </div>

            <div className="map-page__filters scroll-filters">
              {mapFilters.map((f) => (
                <select
                  key={f.key}
                  value={(filters[f.key as keyof SearchFilters] as string) || ''}
                  onChange={(e) => updateFilter(f.key, e.target.value)}
                  className="map-page__select"
                >
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.value === '' ? f.label : opt.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>
        </div>

        <div className="map-page__split">
          {listOpen && (
            <aside className="map-page__list" aria-label="Lista de destinos">
              {loading ? (
                <p className="map-page__list-empty">Cargando destinos…</p>
              ) : sorted.length === 0 ? (
                <p className="map-page__list-empty">Nada con estos filtros.</p>
              ) : (
                <ul className="map-page__list-items">
                  {sorted.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        className={`map-page__list-item${activeId === d.id ? ' is-active' : ''}`}
                        onClick={() => onSelect(d.id)}
                      >
                        <img
                          src={getImageUrl(d.imagen, 0, 'thumb')}
                          alt=""
                          className="map-page__list-thumb"
                          loading="lazy"
                        />
                        <span className="map-page__list-text">
                          <span className="map-page__list-name">{d.nombre.trim()}</span>
                          <span className="map-page__list-meta">
                            {parseJsonSafe(d.ubicacion)} · {parseJsonSafe(d.presupuesto)}
                          </span>
                        </span>
                      </button>
                      <Link to={`/destino/${d.id}`} className="map-page__list-link">
                        Abrir
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </aside>
          )}

          <div className="map-page__canvas">
            <MapContainer
              center={SPAIN_CENTER}
              zoom={6}
              zoomControl={false}
              scrollWheelZoom
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ZoomControl position="bottomright" />
              <MapClusters destinos={destinos} activeId={activeId} onSelect={onSelect} />
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
