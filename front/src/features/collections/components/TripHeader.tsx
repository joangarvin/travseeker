import { useState } from 'react';
import {
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Image,
  Link2,
  Lock,
  MapPin,
  Pencil,
  Share2,
  Users,
} from 'lucide-react';
import { Button, Dialog, MediaImage } from '../../../components/ui';
import { intlLocale, t } from '../../../i18n';
import type { CollectionDetail } from '../../../types';
import { imageUrl } from '../../../utils';

type Props = {
  collection: CollectionDetail;
  publicView: boolean;
  pending: boolean;
  onEdit: () => void;
  onShare: () => void;
};

export function TripHeader({ collection, publicView, pending, onEdit, onShare }: Props) {
  const [dialog, setDialog] = useState<'photos' | 'people' | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = collection.items.filter((item) => item.destino.imagen?.trim());
  const photo = photos[photoIndex % (photos.length || 1)];
  const canEdit = !publicView && collection.role !== 'viewer';
  const isOwner = !publicView && collection.role === 'owner';
  const people = [
    ...(collection.owner ? [{ user: collection.owner, role: 'owner' }] : []),
    ...(collection.members || []),
  ];
  const roleLabel = (role: string) =>
    role === 'owner' ? t('Propietario') : role === 'editor' ? t('Editor') : t('Lector');
  const formatter = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const date = (value: string) => new Date(`${value.slice(0, 10)}T00:00:00Z`);
  const dates = !collection.startDate
    ? t('Fechas abiertas')
    : collection.endDate
      ? formatter.formatRange(date(collection.startDate), date(collection.endDate))
      : t('Desde el {0}', { 0: formatter.format(date(collection.startDate)) });
  const names =
    people.length <= 2
      ? people.map(({ user }) => user.nombre).join(' · ')
      : t('{0} personas con acceso', { 0: people.length });
  const avatar = (user: NonNullable<CollectionDetail['owner']>) =>
    user.avatarUrl ? (
      <MediaImage className="trip-avatar" src={imageUrl(user.avatarUrl)} alt="" sizes="40px" />
    ) : (
      <span className="trip-avatar trip-avatar--initials">
        {(user.nombre || '?').slice(0, 2).toUpperCase()}
      </span>
    );

  return (
    <>
      <header className="trip-panorama">
        <div className="trip-panorama__cover">
          {photos.length ? (
            <>
              <MediaImage
                src={imageUrl(photos[0].destino.imagen)}
                alt=""
                fetchPriority="high"
                sizes="100vw"
              />
              <button
                type="button"
                className="trip-panorama__photo-button no-print"
                onClick={() => {
                  setPhotoIndex(0);
                  setDialog('photos');
                }}
              >
                <Camera aria-hidden="true" />
                {t('Ver fotos')}
              </button>
            </>
          ) : (
            <div className="trip-panorama__empty">
              <Image aria-hidden="true" />
              <span>{t('Foto no disponible')}</span>
            </div>
          )}
        </div>
        <div className="trip-panorama__main">
          <div className="trip-panorama__title">
            <h1>{collection.nombre}</h1>
            {collection.descripcion?.trim() && <p>{collection.descripcion}</p>}
          </div>
          <div className="trip-panorama__actions no-print">
            {canEdit && (
              <Button variant="secondary" onClick={onEdit} disabled={pending}>
                <Pencil aria-hidden="true" />
                {t('Editar viaje')}
              </Button>
            )}
            {isOwner && (
              <Button onClick={onShare} disabled={pending}>
                <Share2 aria-hidden="true" />
                {t('Compartir')}
              </Button>
            )}
            {!canEdit && (
              <span className="trip-panorama__status">
                <Lock aria-hidden="true" />
                {t('Solo lectura')}
              </span>
            )}
          </div>
          <div className="trip-panorama__facts">
            <span>
              <CalendarDays aria-hidden="true" />
              {dates}
            </span>
            <span>
              <Users aria-hidden="true" />
              {collection.travelerCount || 2}{' '}
              {t(collection.travelerCount === 1 ? 'viajero' : 'viajeros')}
            </span>
            <span>
              <MapPin aria-hidden="true" />
              {collection.items.length} {t(collection.items.length === 1 ? 'destino' : 'destinos')}
            </span>
          </div>
        </div>
        <div className="trip-panorama__footer">
          {people.length > 0 && (
            <button
              type="button"
              className="trip-panorama__people"
              onClick={() => setDialog('people')}
              aria-label={t('Ver las personas con acceso al viaje')}
            >
              <span className="trip-panorama__avatars" aria-hidden="true">
                {people.slice(0, 3).map(({ user }) => (
                  <span key={user.id}>{avatar(user)}</span>
                ))}
                {people.length > 3 && <span className="trip-avatar">+{people.length - 3}</span>}
              </span>
              <span>
                <strong>{names}</strong>
                <small>{t('Con acceso al viaje')}</small>
              </span>
            </button>
          )}
          <span className="trip-panorama__status">
            {collection.visibility === 'shared' || publicView ? (
              <Link2 aria-hidden="true" />
            ) : (
              <Lock aria-hidden="true" />
            )}
            {t(
              publicView
                ? 'Viaje compartido'
                : collection.visibility === 'shared'
                  ? 'Enlace activo'
                  : 'Viaje privado',
            )}
          </span>
        </div>
      </header>
      {dialog === 'photos' && photo && (
        <Dialog
          className="trip-photo-gallery"
          title={photo.destino.nombre}
          onClose={() => setDialog(null)}
        >
          <MediaImage
            key={photo.destino.id}
            src={imageUrl(photo.destino.imagen)}
            alt={photo.destino.nombre}
            sizes="(max-width: 760px) 100vw, 900px"
          />
          <div className="trip-photo-gallery__controls">
            <Button
              variant="secondary"
              aria-label={t('Foto anterior')}
              disabled={photos.length < 2}
              onClick={() => setPhotoIndex((n) => (n + photos.length - 1) % photos.length)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <span aria-live="polite">
              {(photoIndex % photos.length) + 1} / {photos.length}
            </span>
            <Button
              variant="secondary"
              aria-label={t('Foto siguiente')}
              disabled={photos.length < 2}
              onClick={() => setPhotoIndex((n) => (n + 1) % photos.length)}
            >
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </Dialog>
      )}
      {dialog === 'people' && (
        <Dialog
          className="trip-access-dialog"
          title={t('Personas con acceso')}
          onClose={() => setDialog(null)}
        >
          <ul className="trip-access-dialog__list">
            {people.map(({ user, role }) => (
              <li key={user.id}>
                {avatar(user)}
                <span>
                  <strong>{user.nombre}</strong>
                  <small>{roleLabel(role)}</small>
                </span>
              </li>
            ))}
          </ul>
          {isOwner && (
            <Button
              onClick={() => {
                setDialog(null);
                onShare();
              }}
            >
              {t('Gestionar acceso')}
            </Button>
          )}
        </Dialog>
      )}
    </>
  );
}
