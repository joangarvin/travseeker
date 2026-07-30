import { FolderHeart, Lock, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaImage } from '../../../components/ui';
import type { CollectionSummary } from '../../../types';
import { imageUrl } from '../../../utils';

export function CollectionCover({ collection }: { collection: CollectionSummary }) {
  const ownershipLabel = collection.role === 'owner' ? 'Tu viaje' : 'Compartido contigo';

  return (
    <Link to={`/colecciones/${collection.id}`} className="collection-card">
      <div className="collection-card__images">
        {collection.covers.slice(0, 3).map((cover, index) => (
          <MediaImage key={`${cover}-${index}`} src={imageUrl(cover)} alt="" loading="lazy" />
        ))}
        {!collection.covers.length && <FolderHeart />}
      </div>

      <div>
        <span>
          {collection.visibility === 'shared' ? <Share2 /> : <Lock />} {ownershipLabel}
        </span>
        <h2>{collection.nombre}</h2>
        <p>{collection.descripcion || 'Sin descripción todavía.'}</p>
        <small>{collection.count} destinos</small>
      </div>
    </Link>
  );
}
