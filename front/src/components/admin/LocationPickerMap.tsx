import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

const SPAIN_CENTER: [number, number] = [40.0, -3.5];
const DEFAULT_ZOOM = 6;
const PIN_ZOOM = 10;

const pickerIcon = L.divIcon({
  className: 'ts-picker-marker',
  html: `<span style="display:block;width:22px;height:22px;border-radius:50% 50% 50% 0;background:#2f5d3f;border:3px solid #f5f0e6;transform:rotate(-45deg);box-shadow:0 3px 8px rgba(0,0,0,0.4);"></span>`,
  iconSize: [22, 22],
  iconAnchor: [11, 22],
});

interface Props {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToPin({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      map.flyTo([lat, lng], PIN_ZOOM, { duration: 0.6 });
    }
  }, [lat, lng, map]);
  return null;
}

export default function LocationPickerMap({ lat, lng, onChange }: Props) {
  const hasPoint = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
  const center = useMemo<[number, number]>(
    () => (hasPoint ? [lat!, lng!] : SPAIN_CENTER),
    [hasPoint, lat, lng],
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
          <MapPin className="w-4 h-4 text-[var(--color-brand-dark)]" />
          Ubicación en el mapa
        </label>
        {hasPoint ? (
          <span className="text-xs font-mono text-[var(--color-muted)] bg-[var(--color-secondary)] px-2 py-1 rounded-lg">
            {lat!.toFixed(5)}, {lng!.toFixed(5)}
          </span>
        ) : (
          <span className="text-xs text-amber-600 dark:text-amber-400">Haz clic en el mapa para colocar el pin</span>
        )}
      </div>
      <div className="h-56 sm:h-72 rounded-xl overflow-hidden border border-[var(--color-border-strong)] ring-1 ring-[var(--color-border)]/50 relative z-0">
        <MapContainer
          center={center}
          zoom={hasPoint ? PIN_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={onChange} />
          <FlyToPin lat={lat} lng={lng} />
          {hasPoint && (
            <Marker
              position={[lat!, lng!]}
              icon={pickerIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  onChange(pos.lat, pos.lng);
                },
              }}
            />
          )}
        </MapContainer>
      </div>
      <p className="text-xs text-[var(--color-muted)]">
        El destino solo aparecerá en el mapa público si tiene coordenadas. Puedes arrastrar el pin para afinar la posición.
      </p>
    </div>
  );
}
