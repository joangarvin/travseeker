import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet';

type EssentialMiniMapProps = {
  latitude: number;
  longitude: number;
  label: string;
};

export default function EssentialMiniMap({ latitude, longitude, label }: EssentialMiniMapProps) {
  const center: [number, number] = [latitude, longitude];
  return (
    <div className="essential-detail__map-frame" role="img" aria-label={`Mapa de ${label}`}>
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        keyboard={false}
        className="essential-detail__map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker
          center={center}
          radius={10}
          pathOptions={{
            className: 'essential-detail__map-marker',
            weight: 4,
            fillOpacity: 1,
          }}
        />
      </MapContainer>
    </div>
  );
}
