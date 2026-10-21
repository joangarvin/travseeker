import { t, intlLocale } from '../../../i18n';
import { useState } from 'react';
import {
  ArrowUpRight,
  CalendarDays,
  FolderHeart,
  Lock,
  LoaderCircle,
  MapPin,
  Route,
  Share2,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaImage } from '../../../components/ui';
import type { CollectionSummary } from '../../../types';
import { imageUrl } from '../../../utils';

export function CollectionCover({ collection }: { collection: CollectionSummary }) {
  const [opening, setOpening] = useState(false);
  const ownershipLabel = collection.role === 'owner' ? t('Tu viaje') : t('Compartido contigo');
  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const asDate = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00.000Z`);
  const dates = collection.startDate
    ? collection.endDate
      ? dateFormatter.formatRange(asDate(collection.startDate), asDate(collection.endDate))
      : t('Desde el {0}', { 0: dateFormatter.format(asDate(collection.startDate)) })
    : t('Fechas por decidir');
  const canEdit = collection.role === 'owner' || collection.role === 'editor';
  const status = !canEdit
    ? t('Ver viaje')
    : !collection.count
      ? t('Elegir destinos')
      : !collection.itineraryDays
        ? t('Preparar agenda')
        : t('Abrir agenda');
  const covers = collection.covers.filter(Boolean).slice(0, 3);
  const remaining = Math.max(0, collection.count - covers.length);

  const content = (
    <div className="collection-card__content">
      <div className="collection-card__title">
        <h2>{collection.nombre}</h2>
        {collection.descripcion?.trim() && <p>{collection.descripcion}</p>}
      </div>
      <p className="collection-card__dates">
        <CalendarDays aria-hidden="true" /> {dates}
      </p>
      <div className="collection-card__facts">
        <span>
          <MapPin aria-hidden="true" /> {collection.count}{' '}
          {collection.count === 1 ? t('destino') : t('destinos')}
        </span>
        <span>
          <Route aria-hidden="true" /> {collection.itineraryDays || 0}{' '}
          {collection.itineraryDays === 1 ? t('día de ruta') : t('días de ruta')}
        </span>
        <span>
          <Users aria-hidden="true" /> {collection.travelerCount || 2}{' '}
          {collection.travelerCount === 1 ? t('viajero') : t('viajeros')}
        </span>
      </div>
      <footer>
        <small>
          {collection.visibility === 'shared' ? (
            <Share2 aria-hidden="true" />
          ) : (
            <Lock aria-hidden="true" />
          )}
          {collection.visibility === 'shared' ? t('Enlace activo') : t('Viaje privado')}
        </small>
        <span
          className="collection-card__continue"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {opening ? t('Abriendo viaje…') : status}
          {opening ? (
            <LoaderCircle className="collection-card__spinner" aria-hidden="true" />
          ) : (
            <ArrowUpRight aria-hidden="true" />
          )}
        </span>
      </footer>
    </div>
  );

  return (
    <Link
      to={`/colecciones/${collection.id}`}
      className="collection-card"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        const card = event.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
        // Cover the farthest corner from the entry point, at any card size.
        const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));
        card.style.setProperty('--reveal-x', `${x}px`);
        card.style.setProperty('--reveal-y', `${y}px`);
        card.style.setProperty('--reveal-radius', `${Math.ceil(radius) + 2}px`);
      }}
      data-opening={opening || undefined}
      aria-busy={opening || undefined}
      aria-label={t(opening ? 'Abriendo viaje: {0}' : 'Abrir viaje: {0}', { 0: collection.nombre })}
      onClick={(event) => {
        // Keep native new-tab/window behavior and only mark a normal navigation.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        if (opening) {
          event.preventDefault();
          return;
        }
        setOpening(true);
      }}
    >
      <div className="collection-card__media">
        <div className="collection-card__images" data-covers={covers.length}>
          {covers.map((cover, index) => (
            <MediaImage key={`${cover}-${index}`} src={imageUrl(cover)} alt="" loading="lazy" />
          ))}
          {!covers.length && <FolderHeart aria-hidden="true" />}
        </div>
        <span className="collection-card__ownership">{ownershipLabel}</span>
        {covers.length > 0 && remaining > 0 && (
          <span className="collection-card__more">
            +{remaining} {remaining === 1 ? t('destino') : t('destinos')}
          </span>
        )}
      </div>

      {content}
      <div className="collection-card__reveal" aria-hidden="true">
        <div className="collection-card__reveal-media" />
        {content}
      </div>
    </Link>
  );
}
