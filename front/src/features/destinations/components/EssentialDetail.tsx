import { t } from '../../../i18n';
import { Clock3, ExternalLink, MapPin, Sunrise, TicketCheck } from 'lucide-react';
import type { EssentialItem } from '../../../types';
import { imageUrl, openStreetMapUrl, safeExternalUrl, validCoordinates } from '../../../utils';
import { MediaImage } from '../../../components/ui';

type PracticalFact = {
  Icon: typeof Clock3;
  label: string;
  value: string;
};

export function EssentialDetail({
  item,
  id,
  showMedia = true,
}: {
  item: EssentialItem;
  id: string;
  showMedia?: boolean;
}) {
  const officialUrl = safeExternalUrl(item.officialUrl || item.place?.website);
  const placeCoordinates = item.place
    ? validCoordinates(item.place.latitud, item.place.longitud)
    : null;
  const mapUrl = placeCoordinates ? openStreetMapUrl(placeCoordinates, 16) : null;
  const practicalFacts = [
    item.duration && { Icon: Clock3, label: t('Duración'), value: item.duration },
    item.bestTime && { Icon: Sunrise, label: t('Mejor momento'), value: item.bestTime },
    item.reservationRequired != null && {
      Icon: TicketCheck,
      label: t('Reserva'),
      value: item.reservationRequired ? t('Necesaria') : t('No necesaria'),
    },
  ].filter(Boolean) as PracticalFact[];

  return (
    <div className="essential-card__detail" id={id}>
      {showMedia && item.imageUrl && (
        <MediaImage
          className="essential-card__media"
          src={imageUrl(item.imageUrl)}
          alt={item.imageAlt || ''}
          loading="lazy"
        />
      )}
      {item.description && <p>{item.description}</p>}

      {!!practicalFacts.length && (
        <dl className="essential-card__facts">
          {practicalFacts.map(({ Icon, label, value }) => (
            <div key={label}>
              <Icon aria-hidden />
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {(item.place || officialUrl) && (
        <div className="essential-card__links">
          {item.place && (
            <span>
              <MapPin aria-hidden />
              {mapUrl ? (
                <a href={mapUrl} target="_blank" rel="noreferrer">
                  {item.place.nombre}
                  <span className="sr-only"> ({t('Ver mapa')})</span>
                </a>
              ) : (
                item.place.nombre
              )}
            </span>
          )}
          {officialUrl && (
            <a href={officialUrl} target="_blank" rel="noreferrer">
              {t('Web oficial')} <ExternalLink aria-hidden />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
