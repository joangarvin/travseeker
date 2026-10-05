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
    timeZone: 'UTC',
  });
  const formatDate = (value?: string | null) =>
    value ? dateFormatter.format(new Date(`${value.slice(0, 10)}T00:00:00.000Z`)) : '';
  const dates = collection.startDate
    ? collection.endDate
      ? `${formatDate(collection.startDate)} — ${formatDate(collection.endDate)}`
      : t('Desde el {0}', { 0: formatDate(collection.startDate) })
    : t('Fechas por decidir');
  const steps = [
    Boolean(collection.startDate),
    collection.count > 0,
    Boolean(collection.itineraryDays),
    collection.visibility === 'shared',
  ];
  const progress = Math.round((steps.filter(Boolean).length / steps.length) * 100);
  const status =
    progress === 100
      ? t('Listo para compartir')
      : progress >= 50
        ? t('En planificación')
        : t('Primeras ideas');

  return (
    <Link to={`/colecciones/${collection.id}`} className="collection-card">
      <div className="collection-card__images">
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
            <Users /> {(collection.memberCount || 0) + 1} {t('personas')}
          </span>
        </div>
        <footer>
          <div
            className="collection-card__progress"
            aria-label={t('{0}% del viaje preparado', { 0: progress })}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
          <small>{status}</small>
        </footer>
      </div>
    </Link>
  );
}
