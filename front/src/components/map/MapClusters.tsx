import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type { MapDestino } from '../../api/destinos';
import { getImageUrl } from '../../utils/images';
import { parseJsonSafe } from '../../utils/parseJson';

const markerIcon = L.divIcon({
  className: 'ts-map-marker',
  html: `<span style="display:block;width:18px;height:18px;border-radius:50% 50% 50% 0;background:#2f5d3f;border:2px solid #f5f0e6;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,0.35);"></span>`,
  iconSize: [18, 18],
  iconAnchor: [9, 18],
  popupAnchor: [0, -18],
});

export type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

interface Props {
  destinos: MapDestino[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
}

export default function MapClusters({ destinos, activeId, onSelect, onBoundsChange }: Props) {
  const map = useMap();

  useEffect(() => {
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 48,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 11,
    });

    destinos.forEach((d) => {
      const marker = L.marker([d.latitud, d.longitud], { icon: markerIcon });
      const img = getImageUrl(d.imagen, 0, 'map');
      const meta = `${parseJsonSafe(d.ubicacion)} · ${parseJsonSafe(d.presupuesto)}`;
      marker.bindPopup(
        `<div class="map-popup">
          <img src="${img}" alt="" class="map-popup__img" loading="lazy" />
          <h3 class="map-popup__title">${d.nombre.trim()}</h3>
          <p class="map-popup__meta">${meta}</p>
          <a href="/destino/${d.id}" class="map-popup__link">Ver destino →</a>
        </div>`,
      );
      marker.on('click', () => onSelect(d.id));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);

    return () => {
      map.removeLayer(cluster);
      cluster.clearLayers();
    };
  }, [map, destinos, onSelect]);

  useEffect(() => {
    if (!onBoundsChange) return;

    const emit = () => {
      const b = map.getBounds();
      onBoundsChange({
        north: b.getNorth(),
        south: b.getSouth(),
        east: b.getEast(),
        west: b.getWest(),
      });
    };

    emit();
    map.on('moveend', emit);
    map.on('zoomend', emit);
    return () => {
      map.off('moveend', emit);
      map.off('zoomend', emit);
    };
  }, [map, onBoundsChange]);

  useEffect(() => {
    if (!activeId) return;
    const target = destinos.find((d) => d.id === activeId);
    if (!target) return;
    map.flyTo([target.latitud, target.longitud], Math.max(map.getZoom(), 9), { duration: 0.6 });
  }, [activeId, destinos, map]);

  return null;
}
