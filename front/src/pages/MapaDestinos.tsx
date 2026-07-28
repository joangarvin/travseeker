import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, X } from 'lucide-react';
import Header from '../components/layout/Header';
import { destinosApi, type MapDestino, type SearchFilters } from '../api/destinos';
import { SEARCH_FILTERS } from '../constants/filters';
import { parseJsonSafe } from '../utils/parseJson';
import { getImageUrl } from '../utils/images';

const SPAIN_CENTER: [number, number] = [40.0, -3.5];

const markerIcon = L.divIcon({
  className: 'ts-map-marker',
  html: `<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;background:#2f5d3f;border:2px solid #f5f0e6;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -18],
});

const MAP_FILTER_KEYS = ['tipoTurismo', 'presupuesto', 'masificacion', 'ubicacion'] as const;

export default function MapaDestinos() {
  const [destinos, setDestinos] = useState<MapDestino[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [loading, setLoading] = useState(true);

  const mapFilters = useMemo(
    () => SEARCH_FILTERS.filter((f) => (MAP_FILTER_KEYS as readonly string[]).includes(f.key)),
    [],
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    destinosApi.getMapa(filters, controller.signal)
      .then((data) => setDestinos(data))
      .catch(() => { /* abort o error */ })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [filters]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const updateFilter = (key: string, value: string) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

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
                  {loading ? 'cargando…' : `toda la España tranquila · ${destinos.length} destinos`}
                </span>
              </div>

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
            {destinos.map((d) => (
              <Marker key={d.id} position={[d.latitud, d.longitud]} icon={markerIcon}>
                <Popup>
                  <div className="map-popup">
                    <img
                      src={getImageUrl(d.imagen, 0, 'map')}
                      alt={d.nombre}
                      className="map-popup__img"
                      loading="lazy"
                    />
                    <h3 className="map-popup__title">{d.nombre.trim()}</h3>
                    <p className="map-popup__meta">
                      {parseJsonSafe(d.ubicacion)} · {parseJsonSafe(d.presupuesto)}
                    </p>
                    <Link to={`/destino/${d.id}`} className="map-popup__link">
                      Ver destino →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
