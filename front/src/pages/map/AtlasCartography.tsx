import { useMemo, useState } from 'react';
import { TileLayer } from 'react-leaflet';
import { t } from '../../i18n';

// Tile progress is local: panning must not rerender the page and replace every marker image.
export function AtlasCartography({ mobile, onList }: { mobile: boolean; onList: () => void }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [version, setVersion] = useState(0);
  const events = useMemo(
    () => ({
      load: () => setStatus((current) => (current === 'error' ? 'error' : 'ready')),
      tileerror: () => setStatus('error'),
    }),
    [],
  );
  return (
    <>
      <TileLayer
        key={version}
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={19}
        updateWhenIdle
        updateWhenZooming={false}
        keepBuffer={2}
        eventHandlers={events}
      />
      {status === 'loading' && (
        <p className="atlas-map__map-state" role="status">
          {t('Cargando cartografía')}
        </p>
      )}
      {status === 'error' && (
        <p className="atlas-map__map-state" role="alert">
          {t('No se pudo cargar la cartografía')}{' '}
          <button
            type="button"
            onClick={() => {
              setStatus('loading');
              setVersion((v) => v + 1);
            }}
          >
            {t('Reintentar')}
          </button>
          {mobile && (
            <button type="button" onClick={onList}>
              {t('Lista')}
            </button>
          )}
        </p>
      )}
    </>
  );
}
