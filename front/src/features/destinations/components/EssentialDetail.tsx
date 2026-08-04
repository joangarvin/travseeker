import { useState } from 'react';
import { Clock3, ExternalLink, MapPin, Sunrise, TicketCheck } from 'lucide-react';
import type { EssentialItem } from '../../../types';
import { imageUrl } from '../../../utils';
import { EssentialIconGlyph } from '../../essentials/essentialIcons';
import { essentialPresentation } from '../../essentials/essentialPresentation';

type EssentialDetailProps = {
  item: EssentialItem;
  groupIcon: string;
  headingId: string;
  showHeading?: boolean;
};

type PracticalFact = {
  Icon: typeof Clock3;
  label: string;
  value: string;
};

function openStreetMapUrl(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

function PracticalFacts({ facts, inMedia = false }: { facts: PracticalFact[]; inMedia?: boolean }) {
  if (!facts.length) return null;

  return (
    <dl className={`essential-detail__facts ${inMedia ? 'essential-detail__facts--media' : ''}`}>
      {facts.map(({ Icon: FactIcon, label, value }) => (
        <div key={label}>
          <FactIcon aria-hidden />
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EssentialActions({
  officialUrl,
  mapUrl,
  inMedia = false,
}: {
  officialUrl?: string | null;
  mapUrl?: string | null;
  inMedia?: boolean;
}) {
  if (!officialUrl && !mapUrl) return null;

  return (
    <div className={`essential-detail__actions ${inMedia ? 'essential-detail__actions--media' : ''}`}>
      {officialUrl && (
        <a
          className="essential-detail__action essential-detail__action--primary"
          href={officialUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span>Web oficial</span>
          <ExternalLink aria-hidden />
        </a>
      )}
      {mapUrl && (
        <a
          className="essential-detail__action essential-detail__action--secondary"
          href={mapUrl}
          target="_blank"
          rel="noreferrer"
        >
          <span>Abrir en el mapa</span>
          <ExternalLink aria-hidden />
        </a>
      )}
    </div>
  );
}

export function EssentialDetail({
  item,
  groupIcon,
  headingId,
  showHeading = true,
}: EssentialDetailProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const presentation = essentialPresentation(item);
  const officialUrl = item.officialUrl || item.place?.website;
  const mapUrl = item.place
    ? openStreetMapUrl(item.place.latitud, item.place.longitud)
    : null;
  const practicalFacts = [
    item.duration && { Icon: Clock3, label: 'Duración', value: item.duration },
    item.bestTime && { Icon: Sunrise, label: 'Mejor momento', value: item.bestTime },
    item.reservationRequired != null && {
      Icon: TicketCheck,
      label: 'Reserva',
      value: item.reservationRequired ? 'Necesaria' : 'No necesaria',
    },
  ].filter(Boolean) as PracticalFact[];
  const hasPhoto = Boolean(item.imageUrl && !imageFailed);
  const hasMediaLegend = Boolean(
    item.place || practicalFacts.length || officialUrl || mapUrl,
  );

  return (
    <div className={`essential-detail ${hasPhoto ? 'essential-detail--with-photo' : ''}`}>
      {hasPhoto && (
        <figure className="essential-detail__media">
          <img
            src={imageUrl(item.imageUrl || '')}
            alt={item.imageAlt || ''}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />

          {hasMediaLegend && (
            <figcaption className="essential-detail__legend">
              {item.place && (
                <div className="essential-detail__place">
                  <MapPin aria-hidden />
                  <div>
                    <strong>{item.place.nombre}</strong>
                    <span>
                      {item.place.categoria} · {item.place.latitud.toFixed(5)},{' '}
                      {item.place.longitud.toFixed(5)}
                    </span>
                  </div>
                </div>
              )}

              <PracticalFacts facts={practicalFacts} inMedia />
              <EssentialActions officialUrl={officialUrl} mapUrl={mapUrl} inMedia />
            </figcaption>
          )}
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

        {!hasPhoto && (
          <>
            {item.place && (
              <div className="essential-detail__place essential-detail__place--fallback">
                <MapPin aria-hidden />
                <div>
                  <strong>{item.place.nombre}</strong>
                  <span>
                    {item.place.categoria} · {item.place.latitud.toFixed(5)},{' '}
                    {item.place.longitud.toFixed(5)}
                  </span>
                </div>
              </div>
            )}
            <PracticalFacts facts={practicalFacts} />
            <EssentialActions officialUrl={officialUrl} mapUrl={mapUrl} />
          </>
        )}
      </div>
    </div>
  );
}
