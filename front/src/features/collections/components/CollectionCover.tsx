import { t, intlLocale } from '../../../i18n';
import {
  ArrowUpRight,
  CalendarDays,
  FolderHeart,
  Lock,
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
  const ownershipLabel = collection.role === 'owner' ? t('Tu viaje') : t('Compartido contigo');
  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const formatDate = (value?: string | null) =>
    value ? dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`)) : '';
  const dates = collection.startDate
    ? collection.endDate
      ? `${formatDate(collection.startDate)} — ${formatDate(collection.endDate)}`
      : t('Desde el {0}', { 0: formatDate(collection.startDate) })
    : t('Fechas por decidir');
  const status = !collection.count
    ? t('Añade tu primer destino')
    : !collection.itineraryDays
      ? t('Prepara la agenda')
      : t('Continuar en la agenda');

  return (
    <Link to={`/colecciones/${collection.id}`} className="collection-card">
      <div className="collection-card__images" data-covers={Math.min(3, collection.covers.length)}>
        {collection.covers.slice(0, 3).map((cover, index) => (
          <MediaImage key={`${cover}-${index}`} src={imageUrl(cover)} alt="" loading="lazy" />
        ))}
        {!collection.covers.length && <FolderHeart />}
      </div>

      <div className="collection-card__content">
        <header>
          <span className="collection-card__ownership">
            {collection.visibility === 'shared' ? <Share2 /> : <Lock />} {ownershipLabel}
          </span>
          <ArrowUpRight className="collection-card__arrow" aria-hidden="true" />
        </header>
        <div className="collection-card__title">
          <p>
            <CalendarDays /> {dates}
          </p>
          <h2>{collection.nombre}</h2>
          <p>{collection.descripcion || t('Un viaje esperando su primera historia.')}</p>
        </div>
        <div className="collection-card__facts">
          <span>
            <MapPin /> {collection.count} {collection.count === 1 ? t('destino') : t('destinos')}
          </span>
          <span>
            <Route /> {collection.itineraryDays || 0}{' '}
            {collection.itineraryDays === 1 ? t('día preparado') : t('días preparados')}
          </span>
          <span>
            <Users /> {collection.travelerCount || 2} {t('viajeros')}
          </span>
        </div>
        <footer>
          <small>
            {collection.visibility === 'shared' ? t('Enlace activo') : t('Viaje privado')}
          </small>
          <span className="collection-card__continue">
            {status}
            <ArrowUpRight aria-hidden="true" />
          </span>
        </footer>
      </div>
    </Link>
  );
}
