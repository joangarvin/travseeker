import { lazy, Suspense, useState } from 'react';
import { Clock3, ExternalLink, Link2, MapPin, Sunrise, TicketCheck } from 'lucide-react';
import type { EssentialItem } from '../../../types';
import { EssentialIconGlyph } from '../../essentials/essentialIcons';
import { imageUrl } from '../../../utils';
import { essentialPresentation } from '../../essentials/essentialPresentation';

const EssentialMiniMap = lazy(() => import('./EssentialMiniMap'));

type EssentialDetailProps = {
  item: EssentialItem;
  groupIcon: string;
  headingId: string;
  showHeading?: boolean;
  expanded?: boolean;
};

function openStreetMapUrl(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export function EssentialDetail({
  item,
  groupIcon,
  headingId,
  showHeading = true,
  expanded = true,
}: EssentialDetailProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const presentation = essentialPresentation(item);
  const officialUrl = item.officialUrl || item.place?.website;
  const practicalFacts = [
    item.duration && { Icon: Clock3, label: 'Duración', value: item.duration },
    item.bestTime && { Icon: Sunrise, label: 'Mejor momento', value: item.bestTime },
    item.reservationRequired != null && {
      Icon: TicketCheck,
      label: 'Reserva',
      value: item.reservationRequired ? 'Necesaria' : 'No necesaria',
    },
  ].filter(Boolean) as Array<{ Icon: typeof Clock3; label: string; value: string }>;

  return (
    <div className="essential-detail">
      {item.imageUrl && !imageFailed && (
        <figure className="essential-detail__photo">
          <img
            src={imageUrl(item.imageUrl)}
            alt={item.imageAlt || ''}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        </figure>
      )}

      <div className="essential-detail__content">
        {showHeading && (
          <header>
            <span className="essential-detail__symbol" aria-hidden>
              <EssentialIconGlyph name={item.icon || groupIcon} />
            </span>
            <div>
              <p>Selección esencial</p>
              <h4 id={headingId}>{presentation.title}</h4>
            </div>
          </header>
        )}

        {presentation.description && (
          <p className="essential-detail__description">{presentation.description}</p>
        )}

        {!!practicalFacts.length && (
          <dl className="essential-detail__facts">
            {practicalFacts.map(({ Icon: FactIcon, label, value }) => (
              <div key={label}>
                <FactIcon aria-hidden />
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {officialUrl && (
          <a
            className="essential-detail__official-link"
            href={officialUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Link2 aria-hidden />
            <span>Abrir web oficial</span>
            <ExternalLink aria-hidden />
          </a>
        )}

        {item.place && (
          <section className="essential-detail__location" aria-labelledby={`${headingId}-location`}>
            <header>
              <MapPin aria-hidden />
              <div>
                <h5 id={`${headingId}-location`}>{item.place.nombre}</h5>
                <p>
                  {item.place.categoria} · {item.place.latitud.toFixed(5)},{' '}
                  {item.place.longitud.toFixed(5)}
                </p>
              </div>
            </header>
            {expanded && (
              <Suspense
                fallback={<div className="essential-detail__map-loading">Cargando mapa…</div>}
              >
                <EssentialMiniMap
                  latitude={item.place.latitud}
                  longitude={item.place.longitud}
                  label={item.place.nombre}
                />
              </Suspense>
            )}
            <a
              className="essential-detail__map-link"
              href={openStreetMapUrl(item.place.latitud, item.place.longitud)}
              target="_blank"
              rel="noreferrer"
            >
              Abrir ubicación en OpenStreetMap
              <ExternalLink aria-hidden />
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
