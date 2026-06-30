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
  html: `<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;background:#2eb87a;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></span>`,
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
    <div className="h-screen flex flex-col bg-[var(--color-secondary)] font-sans overflow-hidden">
      <Header />

      <div className="pt-[68px] flex flex-col flex-1 min-h-0">
        <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 md:px-8 py-3 z-[1000] shadow-sm">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-[var(--color-primary)] font-semibold mr-2">
              <MapPin className="w-4 h-4 text-[var(--color-brand-dark)]" />
              Mapa
              <span className="text-xs font-normal text-[var(--color-muted)]">
                {loading ? 'cargando...' : `${destinos.length} destinos`}
              </span>
            </div>

            {mapFilters.map((f) => (
              <select
                key={f.key}
                value={(filters[f.key as keyof SearchFilters] as string) || ''}
                onChange={(e) => updateFilter(f.key, e.target.value)}
                className="text-sm border border-[var(--color-border-strong)] rounded-lg px-3 py-2 bg-[var(--color-surface)] text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-brand)] cursor-pointer"
              >
                {f.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.value === '' ? f.label : opt.label}
                  </option>
                ))}
              </select>
            ))}

            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters({})}
                className="flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0">
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
                  <div className="w-52">
                    <img
                      src={getImageUrl(d.imagen)}
                      alt={d.nombre}
                      className="w-full h-28 object-cover rounded-lg mb-2"
                      loading="lazy"
                    />
                    <h3 className="font-semibold text-sm text-[#0a0f0d] mb-1">{d.nombre.trim()}</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {parseJsonSafe(d.ubicacion)} · {parseJsonSafe(d.presupuesto)}
                    </p>
                    <Link
                      to={`/destino/${d.id}`}
                      className="inline-block text-xs font-semibold text-[#156b4f] hover:underline"
                    >
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
