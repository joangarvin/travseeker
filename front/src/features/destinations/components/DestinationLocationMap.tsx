import { useEffect, useRef, useState } from 'react';
import { Map as MapIcon, Minus, Plus } from 'lucide-react';
import { divIcon, type Map as LeafletMap } from 'leaflet';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { t } from '../../../i18n';

const destinationPin = divIcon({
  className: 'destination-location-pin',
  html: '<span></span>',
  iconSize: [30, 40],
  iconAnchor: [15, 40],
});

export default function DestinationLocationMap({
  latitude,
  longitude,
  name,
}: {
  latitude: number;
  longitude: number;
  name: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [active, setActive] = useState(false);
  const [zoom, setZoom] = useState(9);
  const [tilesFailed, setTilesFailed] = useState(false);
  const [tilesReady, setTilesReady] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!map) return;
    for (const handler of [
      map.dragging,
      map.touchZoom,
      map.doubleClickZoom,
      map.scrollWheelZoom,
      map.boxZoom,
      map.keyboard,
    ]) {
      if (active) handler.enable();
      else handler.disable();
    }
    map.getContainer().tabIndex = active ? 0 : -1;
  }, [map, active]);

  useEffect(() => {
    if (!map || !host.current) return;
    const updateZoom = () => setZoom(map.getZoom());
    updateZoom();
    map.on('zoomend', updateZoom);
    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(host.current);
    return () => {
      map.off('zoomend', updateZoom);
      observer.disconnect();
    };
  }, [map]);

  return (
    <div ref={host} className="destination-location-map">
      {visible && (
        <MapContainer
          ref={setMap}
          bounds={[
            [Math.max(-85, Math.min(85, latitude - 0.17)), Math.max(-180, longitude - 0.28)],
            [Math.max(-85, Math.min(85, latitude + 0.17)), Math.min(180, longitude + 0.28)],
          ]}
          minZoom={2}
          maxZoom={18}
          zoomControl={false}
          dragging={false}
          touchZoom={false}
          doubleClickZoom={false}
          scrollWheelZoom={false}
          boxZoom={false}
          keyboard={false}
          zoomAnimation={false}
          fadeAnimation={false}
          markerZoomAnimation={false}
          aria-label={t('Mapa de {0}', { 0: name })}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setTilesFailed(true),
              tileload: () => setTilesReady(true),
            }}
          />
          <Marker position={[latitude, longitude]} icon={destinationPin} interactive={false} />
        </MapContainer>
      )}
      {visible && !tilesReady && (
        <p className="destination-location-map__message" role="status">
          {tilesFailed ? t('No se pudo cargar el mapa') : t('Cargando mapa')}
        </p>
      )}
      <div className="destination-location-map__zoom" role="group" aria-label={t('Zoom del mapa')}>
        <button
          type="button"
          disabled={!active || !map || zoom >= 18}
          aria-label={t('Acercar')}
          onClick={() => map?.zoomIn()}
        >
          <Plus aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={!active || !map || zoom <= 2}
          aria-label={t('Alejar')}
          onClick={() => map?.zoomOut()}
        >
          <Minus aria-hidden="true" />
        </button>
      </div>
      <button
        className="dest-summary__map-toggle"
        type="button"
        aria-pressed={active}
        onClick={() => setActive(!active)}
      >
        <MapIcon aria-hidden="true" />
        {active ? t('Dejar de explorar') : t('Explorar mapa')}
      </button>
      <span className="sr-only" role="status">
        {active ? t('Mapa activo. Puedes moverlo y usar el zoom.') : t('Mapa bloqueado.')}
      </span>
    </div>
  );
}
