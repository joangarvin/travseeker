import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { Crosshair, MapPin } from 'lucide-react';

function ClickHandler({ onPick }: { onPick: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click: (event) =>
      onPick(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6))),
  });
  return null;
}

export function CoordinatePicker({
  latitude,
  longitude,
  onChange,
  compact = false,
}: {
  latitude?: number | null;
  longitude?: number | null;
  onChange: (latitude: number, longitude: number) => void;
  compact?: boolean;
}) {
  const hasPoint = Number.isFinite(latitude) && Number.isFinite(longitude);
  const center: [number, number] = hasPoint ? [latitude!, longitude!] : [40.2, -3.5];
  return (
    <div className={`coordinate-picker ${compact ? 'coordinate-picker--compact' : ''}`}>
      <div className="coordinate-picker__hint">
        <Crosshair />
        <span>
          <b>Haz clic en el mapa</b>
          <small>Las coordenadas se completan automáticamente.</small>
        </span>
      </div>
      <MapContainer
        key={`${center[0]}-${center[1]}`}
        center={center}
        zoom={hasPoint ? 9 : 5}
        zoomControl={compact}
        className="coordinate-picker__map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        {hasPoint && (
          <CircleMarker
            center={center}
            radius={9}
            pathOptions={{ className: 'coordinate-picker__marker', weight: 3, fillOpacity: 1 }}
          />
        )}
      </MapContainer>
      <div className="coordinate-picker__readout">
        <MapPin />
        <span>
          {hasPoint ? `${latitude?.toFixed(5)}, ${longitude?.toFixed(5)}` : 'Sin punto asignado'}
        </span>
      </div>
    </div>
  );
}
