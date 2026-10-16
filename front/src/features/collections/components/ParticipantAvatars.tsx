import { t } from '../../../i18n';
import type { CollectionDetail } from '../../../types';
import { imageUrl, responsiveImageUrl } from '../../../utils';

export function ParticipantAvatars({ collection }: { collection: CollectionDetail }) {
  const people = [collection.owner, ...(collection.members || []).map((member) => member.user)]
    .filter(Boolean)
    .slice(0, 4) as Array<{ id: string; nombre?: string | null; avatarUrl?: string | null }>;
  const total = (collection.members?.length || 0) + 1;
  return (
    <div className="trip-participants" aria-label={t('{0} participantes', { 0: total })}>
      <div className="trip-participants__avatars" aria-hidden="true">
        {people.map((person) =>
          person.avatarUrl ? (
            <img
              key={person.id}
              className="trip-avatar"
              src={responsiveImageUrl(imageUrl(person.avatarUrl), 96)}
              loading="lazy"
              decoding="async"
              alt=""
            />
          ) : (
            <span key={person.id} className="trip-avatar trip-avatar--initials">
              {(person.nombre || '?').slice(0, 2).toUpperCase()}
            </span>
          ),
        )}
        {total > 4 && <span className="trip-avatar trip-avatar--initials">+{total - 4}</span>}
      </div>
      <span>
        {total === 1
          ? t('Solo tú tienes acceso')
          : t('{0} personas organizando este viaje', { 0: total })}
      </span>
    </div>
  );
}
