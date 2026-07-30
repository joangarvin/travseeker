import { Button } from '../../../components/ui';
import type { Review } from '../../../types';
import { AdminToolbar } from './AdminToolbar';

type ReviewStatus = 'published' | 'hidden';

type ReviewsPanelProps = {
  reviews: Review[];
  query: string;
  onQueryChange: (value: string) => void;
  onModerate: (id: string, status: ReviewStatus) => void;
};

export function ReviewsPanel({ reviews, query, onQueryChange, onModerate }: ReviewsPanelProps) {
  return (
    <>
      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar destino, persona o comentario"
        resultCount={reviews.length}
      />

      <div className="admin-list">
        {reviews.map((review) => {
          const isPublished = review.status === 'published';
          const nextStatus = isPublished ? 'hidden' : 'published';

          return (
            <article key={review.id}>
              <div>
                <span>
                  {review.destino?.nombre || 'Destino'} · {isPublished ? 'Publicada' : 'Oculta'}
                </span>
                <h2>
                  {review.rating}/5 · {review.user?.nombre || 'Usuario'}
                </h2>
                <p>{review.comment || 'Sin comentario'}</p>
              </div>
              <div>
                <Button
                  variant={isPublished ? 'secondary' : 'primary'}
                  onClick={() => onModerate(review.id, nextStatus)}
                >
                  {isPublished ? 'Ocultar' : 'Publicar'}
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
