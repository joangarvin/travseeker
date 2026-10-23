import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import { divIcon, latLngBounds, point } from 'leaflet';
import { useTourismTypes } from '../../contexts';
import { tourismDefinition } from '../../features/tourism/tourism';
import { t } from '../../i18n';
import type { Destino } from '../../types';

import { COUNTRY_ZOOM_MAX, groupMapDestinations } from './mapGeography';
const located = (items: Destino[]) =>
  items.filter((d) => Number.isFinite(d.latitud) && Number.isFinite(d.longitud));
const escapeText = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
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
  const groups = useMemo(() => groupMapDestinations(destinations, zoom), [destinations, zoom]);
  return (
    <>
      {groups.map((group) => {
        if (zoom <= COUNTRY_ZOOM_MAX) {
          const label = group.items[0].country?.name || t('Destinos');
          return (
            <Marker
              key={`country-${group.key}`}
              position={[group.lat, group.lng]}
              title={`${t(label)} · ${t('{0} destinos', { 0: group.items.length })}`}
              icon={divIcon({
                className: 'atlas-country-marker',
                html: `<span>${escapeText(t(label))}<b>${group.items.length}</b></span>`,
                iconSize: [140, 44],
                iconAnchor: [70, 22],
              })}
              eventHandlers={{
                click: () => {
                  const bounds = latLngBounds(group.items.map((d) => [d.latitud!, d.longitud!]));
                  const pad = innerWidth <= 760 ? 24 : 48;
                  map.setView(
                    bounds.getCenter(),
                    group.items.length === 1
                      ? 8
                      : Math.max(
                          COUNTRY_ZOOM_MAX + 1,
                          Math.min(9, map.getBoundsZoom(bounds, false, point(pad * 2, pad * 2))),
                        ),
                    {
                      animate: !matchMedia('(prefers-reduced-motion: reduce)').matches,
                      duration: 0.24,
                    },
                  );
                  onNotice(t('Mostrando destinos de {0}', { 0: t(label) }));
                },
              }}
            />
          );
        }
        const d = group.items[0],
          type = tourismDefinition(d.tipoTurismoPrincipal, catalog),
          color = /^#[0-9a-f]{6}$/i.test(type.colorValue) ? type.colorValue : '#5f6470',
          active = d.id === selectedId;
        return (
          <Marker
            key={d.id}
            position={[d.latitud!, d.longitud!]}
            title={`${d.nombre.trim()} · ${type.displayLabel || t(type.label)}`}
            icon={divIcon({
              className: `atlas-destination-marker ${active ? 'is-selected' : ''}`,
              html: `<span style="--marker-color:${color}">${active ? '<b aria-hidden="true">✓</b>' : ''}</span>`,
              iconSize: [44, 44],
              iconAnchor: [22, 22],
            })}
            eventHandlers={{ click: () => onSelect(d.id) }}
          >
            <Tooltip direction="top" offset={[0, -15]}>
              {d.nombre.trim()} · {type.displayLabel || t(type.label)}
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
}
