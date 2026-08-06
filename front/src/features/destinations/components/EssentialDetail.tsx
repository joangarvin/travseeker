import {
  Bookmark,
  Check,
  Clock3,
  ExternalLink,
  MapPin,
  Route,
  Sunrise,
  TicketCheck,
  X,
} from 'lucide-react';
import type { EssentialItem } from '../../../types';
import { imageUrl } from '../../../utils';
import { MediaImage } from '../../../components/ui';
import { EssentialIconGlyph } from '../../essentials/essentialIcons';
import { essentialPresentation } from '../../essentials/essentialPresentation';

type EssentialDetailProps = {
  item: EssentialItem;
  groupIcon: string;
  headingId: string;
  priority: string;
  saved: boolean;
  inRoute: boolean;
  onToggleSaved: () => void;
  onToggleRoute: () => void;
  onClose?: () => void;
};

type PracticalFact = {
  Icon: typeof Clock3;
  label: string;
  value: string;
};

function openStreetMapUrl(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

export function EssentialDetail({
  item,
  groupIcon,
  headingId,
  priority,
  saved,
  inRoute,
  onToggleSaved,
  onToggleRoute,
  onClose,
}: EssentialDetailProps) {
  const presentation = essentialPresentation(item);
  const officialUrl = item.officialUrl || item.place?.website;
  const mapUrl = item.place ? openStreetMapUrl(item.place.latitud, item.place.longitud) : null;
  const practicalFacts = [
    item.duration && { Icon: Clock3, label: 'Duración', value: item.duration },
    item.bestTime && { Icon: Sunrise, label: 'Mejor momento', value: item.bestTime },
    item.reservationRequired != null && {
      Icon: TicketCheck,
      label: 'Reserva',
      value: item.reservationRequired ? 'Necesaria' : 'No necesaria',
    },
  ].filter(Boolean) as PracticalFact[];

  return (
    <article className="essential-sheet" aria-labelledby={headingId}>
      <div className="essential-sheet__media">
        {item.imageUrl ? (
          <MediaImage
            src={imageUrl(item.imageUrl)}
            alt={item.imageAlt || presentation.title}
            loading="lazy"
          />
        ) : (
          <div className="essential-sheet__media-fallback">
            <EssentialIconGlyph name={item.icon || groupIcon} />
            <span>Imagen no disponible</span>
          </div>
        )}
        <span className="essential-sheet__priority">{priority}</span>
        {onClose && (
          <button type="button" className="essential-sheet__close" onClick={onClose}>
            <X aria-hidden /> <span>Cerrar detalle</span>
          </button>
        )}
      </div>

      <div className="essential-sheet__body">
        <header>
          <span className="essential-sheet__symbol" aria-hidden>
            <EssentialIconGlyph name={item.icon || groupIcon} />
          </span>
          <div>
            <p>Por qué merece la pena</p>
            <h4 id={headingId}>{presentation.title}</h4>
          </div>
        </header>

        <p className="essential-sheet__description">
          {presentation.description ||
            'La guía todavía no dispone de una explicación ampliada para esta experiencia.'}
        </p>

        {!!practicalFacts.length && (
          <dl className="essential-sheet__facts">
            {practicalFacts.map(({ Icon, label, value }) => (
              <div key={label}>
                <Icon aria-hidden />
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {item.place && (
          <div className="essential-sheet__place">
            <MapPin aria-hidden />
            <div>
              <span>Dónde está</span>
              <strong>{item.place.nombre}</strong>
              <small>{item.place.categoria}</small>
            </div>
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noreferrer">
                Ver mapa <ExternalLink aria-hidden />
              </a>
            )}
          </div>
        )}

        <div className="essential-sheet__planning" aria-label="Planificar esta experiencia">
          <button type="button" aria-pressed={saved} onClick={onToggleSaved}>
            {saved ? <Check aria-hidden /> : <Bookmark aria-hidden />}
            {saved ? 'Guardada' : 'Guardar'}
          </button>
          <button
            type="button"
            className="is-primary"
            aria-pressed={inRoute}
            onClick={onToggleRoute}
          >
            {inRoute ? <Check aria-hidden /> : <Route aria-hidden />}
            {inRoute ? 'En mi ruta' : 'Añadir a mi ruta'}
          </button>
        </div>

        {officialUrl && (
          <a
            className="essential-sheet__official"
            href={officialUrl}
            target="_blank"
            rel="noreferrer"
          >
            Consultar la web oficial <ExternalLink aria-hidden />
          </a>
        )}
      </div>
    </article>
  );
}
