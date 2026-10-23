import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { GeoJSON, Marker, Tooltip, useMap } from 'react-leaflet';
import { divIcon, latLngBounds, point } from 'leaflet';
import { useTourismTypes } from '../../contexts';
import { tourismDefinition } from '../../features/tourism/tourism';
import { t } from '../../i18n';
import type { Destino } from '../../types';

import { COUNTRY_ZOOM_MAX, clusterMapDestinations, groupMapDestinations } from './mapGeography';
import { imageUrl, responsiveImageUrl } from '../../utils';
import outlines from './data/country-outlines.json';
import type { Feature } from 'geojson';
const located = (items: Destino[]) =>
  items.filter((d) => Number.isFinite(d.latitud) && Number.isFinite(d.longitud));
const escapeText = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
function countryLabelPosition(code: string, fallback: [number, number]): [number, number] {
  const feature = outlines.features.find((f) => f.properties.code === code);
  if (!feature) return fallback;
  const polygons =
    feature.geometry.type === 'Polygon'
      ? [feature.geometry.coordinates]
      : feature.geometry.coordinates;
  const boxes = (polygons as number[][][][])
    .map((polygon) => {
      const ring = polygon[0];
      const lngs = ring.map((p) => p[0]),
        lats = ring.map((p) => p[1]);
      return {
        west: Math.min(...lngs),
        east: Math.max(...lngs),
        south: Math.min(...lats),
        north: Math.max(...lats),
      };
    })
    .sort(
      (a, b) => (b.east - b.west) * (b.north - b.south) - (a.east - a.west) * (a.north - a.south),
    );
  const box = boxes[0];
  return box ? [(box.north + box.south) / 2, (box.east + box.west) / 2] : fallback;
}
export function AtlasViewport({
  destinations,
  selected,
  visible,
  fitVersion,
}: {
  destinations: Destino[];
  selected?: Destino;
  visible: boolean;
  fitVersion: number;
}) {
  const map = useMap(),
    last = useRef<Destino[] | null>(null),
    fit = useRef(-1);
  useEffect(() => {
    const el = map.getContainer();
    const resize = () => {
      if (el.clientWidth && el.clientHeight) map.invalidateSize({ pan: false });
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [map]);
  useEffect(() => {
    if (!visible) return;
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      if (last.current === destinations && fit.current === fitVersion) return;
      last.current = destinations;
      fit.current = fitVersion;
      const ds = located(destinations);
      if (!ds.length) return;
      const coords = ds.map((d) => [d.latitud!, d.longitud!] as [number, number]);
      if (coords.length === 1) map.setView(coords[0], 8, { animate: false });
      else
        map.fitBounds(coords, {
          padding: innerWidth <= 760 ? [24, 24] : [48, 48],
          maxZoom: 6,
          animate: false,
        });
    });
    return () => cancelAnimationFrame(frame);
  }, [map, destinations, visible, fitVersion]);
  useEffect(() => {
    if (!visible || selected?.latitud == null || selected.longitud == null) return;
    map.setView([selected.latitud, selected.longitud], Math.max(8, map.getZoom()), {
      animate: !matchMedia('(prefers-reduced-motion: reduce)').matches,
      duration: 0.24,
    });
  }, [map, selected, visible]);
  return null;
}
export function AtlasMapPoints({
  destinations,
  selectedId,
  onSelect,
  onNotice,
}: {
  destinations: Destino[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNotice: (text: string) => void;
}) {
  const map = useMap(),
    { tourismTypes: catalog } = useTourismTypes();
  const subscribe = useCallback(
    (notify: () => void) => {
      map.on('zoomend', notify);
      return () => {
        map.off('zoomend', notify);
      };
    },
    [map],
  );
  const zoom = useSyncExternalStore(subscribe, () => map.getZoom());
  const countries = useMemo(
    () => groupMapDestinations(destinations, COUNTRY_ZOOM_MAX),
    [destinations],
  );
  const groups = useMemo(
    () =>
      zoom <= COUNTRY_ZOOM_MAX
        ? countries
        : clusterMapDestinations(
            destinations,
            (lat, lng) => map.project([lat, lng], zoom),
            zoom < 8 ? 52 : 0,
            selectedId,
          ),
    [destinations, zoom, countries, selectedId, map],
  );
  const labelPositions: { x: number; y: number }[] = [];
  function zoomTo(items: Destino[], label: string) {
    const bounds = latLngBounds(items.map((d) => [d.latitud!, d.longitud!]));
    const pad = innerWidth <= 760 ? 32 : 64;
    map.setView(
      bounds.getCenter(),
      Math.max(
        COUNTRY_ZOOM_MAX + 1,
        Math.min(12, map.getBoundsZoom(bounds, false, point(pad * 2, pad * 2))),
      ),
      { animate: !matchMedia('(prefers-reduced-motion: reduce)').matches, duration: 0.24 },
    );
    onNotice(label);
  }
  return (
    <>
      {zoom <= COUNTRY_ZOOM_MAX &&
        countries.map((group) => {
          const feature = outlines.features.find((f) => f.properties.code === group.key);
          if (!feature) return null;
          const label = group.items.find((d) => d.country?.name)?.country?.name || group.key;
          return (
            <GeoJSON
              key={group.key}
              data={feature as Feature}
              style={{
                color: '#3047f2',
                weight: 1.7,
                fillColor: '#3047f2',
                fillOpacity: 0.16,
                className: 'atlas-country-outline',
              }}
              eventHandlers={{
                click: () => zoomTo(group.items, t('Mostrando destinos de {0}', { 0: t(label) })),
              }}
            />
          );
        })}
      {groups.map((group) => {
        if (zoom <= COUNTRY_ZOOM_MAX) {
          const label =
            group.items.find((d) => d.country?.name)?.country?.name ||
            (group.key === 'unknown' ? t('Destinos') : group.key);
          return (
            <Marker
              key={`country-${group.key}`}
              position={countryLabelPosition(group.key, [group.lat, group.lng])}
              title={`${t(label)} · ${t('{0} destinos', { 0: group.items.length })}`}
              icon={divIcon({
                className: 'atlas-country-marker',
                html: `<span class="atlas-country-card"><span class="atlas-country-card__text"><strong>${escapeText(t(label))}</strong><small>${escapeText(t('{0} destinos', { 0: group.items.length }))}</small></span><span class="atlas-country-card__arrow" aria-hidden="true">↗</span></span>`,
                iconSize: [170, 66],
                iconAnchor: [85, 33],
              })}
              eventHandlers={{
                click: () => zoomTo(group.items, t('Mostrando destinos de {0}', { 0: t(label) })),
              }}
            />
          );
        }
        const d = group.items[0],
          type = tourismDefinition(d.tipoTurismoPrincipal, catalog),
          color = /^#[0-9a-f]{6}$/i.test(type.colorValue) ? type.colorValue : '#5f6470',
          active = d.id === selectedId,
          cluster = group.items.length > 1;
        const position = map.project([group.lat, group.lng], zoom);
        const showLabel =
          !cluster &&
          (active ||
            (zoom >= 7 &&
              !labelPositions.some(
                (p) => Math.abs(p.x - position.x) < 190 && Math.abs(p.y - position.y) < 65,
              )));
        if (showLabel) labelPositions.push(position);
        const photo = responsiveImageUrl(imageUrl(d.imagen), 96),
          name = d.nombre.trim();
        return (
          <Marker
            key={group.key}
            position={[group.lat, group.lng]}
            zIndexOffset={active ? 1000 : showLabel ? 100 : 0}
            title={
              cluster
                ? t('Explorar {0} destinos cercanos', { 0: group.items.length })
                : `${name} · ${type.displayLabel || t(type.label)}`
            }
            icon={divIcon({
              className: `atlas-photo-marker ${active ? 'is-selected' : ''} ${showLabel ? 'has-label' : ''} ${cluster ? 'is-cluster' : ''}`,
              html: `<span class="atlas-photo-pin" style="--marker-color:${color}"><span class="atlas-photo-pin__image">${photo ? `<img src="${escapeText(photo)}" alt="" loading="lazy" draggable="false"/>` : '<span aria-hidden="true">↗</span>'}</span>${cluster ? `<b class="atlas-photo-pin__count">${group.items.length}</b>` : ''}${showLabel ? `<span class="atlas-photo-pin__label"><strong>${escapeText(name)}</strong>${active ? `<small>${escapeText(type.displayLabel || t(type.label))}</small>` : ''}</span>` : ''}</span>`,
              iconSize: showLabel ? [200, 52] : [52, 52],
              iconAnchor: [26, 52],
            })}
            eventHandlers={{
              click: () =>
                cluster
                  ? zoomTo(
                      group.items,
                      t('Explorando {0} destinos cercanos', { 0: group.items.length }),
                    )
                  : onSelect(d.id),
            }}
          >
            <Tooltip direction="top" offset={[0, -48]}>
              {cluster ? (
                t('Explorar {0} destinos cercanos', { 0: group.items.length })
              ) : (
                <>
                  <type.Icon size={16} aria-hidden="true" /> {name} ·{' '}
                  {type.displayLabel || t(type.label)}
                </>
              )}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
