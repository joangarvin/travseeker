import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button, Field, Loader, MediaImage, Notice } from '../../../components/ui';
import { imageUrl } from '../../../utils';
import type { Review } from '../../../types';
import type { useDestinationReviews } from '../hooks/useDestinationReviews';

const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const reviewDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function reviewAuthor(review: Review) {
  return (
    [review.user?.nombre, review.user?.apellidos].filter(Boolean).join(' ').trim() ||
    'Viajero de TravSeeker'
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('es');
}

interface DestinationReviewsProps {
  reviewState: ReturnType<typeof useDestinationReviews>;
  authenticated: boolean;
  loginState: { returnTo: string };
}

export function DestinationReviews({
  reviewState,
  authenticated,
  loginState,
}: DestinationReviewsProps) {
  const {
    reviews,
    reviewStats,
    reviewsLoading,
    reviewsError,
    loadReviews,
    rating,
    setRating,
    comment,
    setComment,
    reviewPending,
    reviewError,
    setReviewError,
    reviewConfirmation,
    setReviewConfirmation,
    visibleReviewCount,
    setVisibleReviewCount,
    submitReview,
  } = reviewState;
  const reviewCount = reviewStats.count || reviews.length;
  const hasReviews = reviewCount > 0;
  const average = reviewStats.average || 0;

  return (
    <section id="opiniones" className="reviews" aria-labelledby="reviews-title" data-reveal>
      <header className="reviews__heading">
        <div className="destination-section-heading">
          <p className="kicker">Experiencias reales</p>
          <h2 id="reviews-title">Opiniones de viajeros</h2>
        </div>
        {hasReviews ? (
          <div
            className="reviews__score"
            aria-label={`${average} de 5, ${reviewCount} ${reviewCount === 1 ? 'opinión' : 'opiniones'}`}
          >
            <Star aria-hidden="true" />
            <strong>{average.toLocaleString('es-ES', { maximumFractionDigits: 1 })} de 5</strong>
            <span>
              {reviewCount} {reviewCount === 1 ? 'opinión publicada' : 'opiniones publicadas'}
            </span>
          </div>
        ) : (
          <p className="reviews__no-score">Todavía no hay una valoración pública.</p>
        )}
      </header>

      {hasReviews && reviewStats.distribution && (
        <div className="reviews__distribution" aria-label="Distribución de valoraciones">
          {[5, 4, 3, 2, 1].map((value) => {
            const count = reviewStats.distribution?.[value as 1 | 2 | 3 | 4 | 5] || 0;
            return (
              <div key={value}>
                <span>{value} estrellas</span>
                <progress
                  max={reviewCount}
                  value={count}
                  aria-label={`${value} estrellas: ${count} opiniones`}
                />
                <b>{count}</b>
              </div>
            );
          })}
        </div>
      )}

      {reviewsError ? (
        <Notice
          tone="error"
          action={
            <button type="button" onClick={() => void loadReviews()}>
              Reintentar
            </button>
          }
        >
          {reviewsError}
        </Notice>
      ) : reviewsLoading ? (
        <Loader label="Cargando opiniones" />
      ) : reviews.length ? (
        <>
          <div className="reviews__list">
            {reviews.slice(0, visibleReviewCount).map((review) => {
              const author = reviewAuthor(review);
              return (
                <article className="review" key={review.id}>
                  <header>
                    {review.user?.avatarUrl ? (
                      <MediaImage
                        className="review__avatar"
                        src={imageUrl(review.user.avatarUrl)}
                        alt=""
                        loading="lazy"
                      />
                    ) : (
                      <span className="review__avatar-fallback" aria-hidden="true">
                        {initials(author)}
                      </span>
                    )}
                    <div>
                      <h3>{author}</h3>
                      <p>
                        <time dateTime={review.createdAt}>
                          {reviewDateFormatter.format(new Date(review.createdAt))}
                        </time>
                        {review.visitMonth && ` · Viajó en ${monthNames[review.visitMonth - 1]}`}
                      </p>
                    </div>
                    <span className="review__rating" aria-label={`${review.rating} de 5 estrellas`}>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={index < review.rating ? 'is-filled' : ''}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                  </header>
                  <p className="review__comment">
                    {review.comment || 'Valoración sin comentario.'}
                  </p>
                  {review.adminResponse && (
                    <aside
                      className="review__response"
                      aria-label="Respuesta oficial de TravSeeker"
                    >
                      <strong>Respuesta oficial</strong>
                      <p>{review.adminResponse}</p>
                    </aside>
                  )}
                </article>
              );
            })}
          </div>
          {visibleReviewCount < reviews.length && (
            <Button
              className="reviews__more"
              variant="secondary"
              onClick={() => setVisibleReviewCount((value) => value + 3)}
            >
              Ver más opiniones
            </Button>
          )}
        </>
      ) : (
        <div className="reviews__empty">
          <h3>Sé la primera persona en contarlo</h3>
          <p>Una experiencia concreta puede ayudar a otra persona a decidir mejor.</p>
        </div>
      )}

      {authenticated ? (
        <form className="review-form" onSubmit={submitReview}>
          <div>
            <h3>Cuenta cómo fue</h3>
            <p>
              Revisamos cada reseña antes de publicarla. Tu envío quedará pendiente y no cambiará la
              valoración pública inmediatamente.
            </p>
          </div>
          <fieldset className="review-rating">
            <legend>Tu puntuación</legend>
            <div>
              {[1, 2, 3, 4, 5].map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="rating"
                    value={value}
                    checked={rating === value}
                    onChange={() => setRating(value)}
                  />
                  <Star aria-hidden="true" />
                  <span className="sr-only">
                    {value} {value === 1 ? 'estrella' : 'estrellas'}
                  </span>
                </label>
              ))}
            </div>
            <p aria-live="polite">{rating} de 5 estrellas</p>
          </fieldset>
          <Field label="Tu experiencia" htmlFor="review">
            <textarea
              id="review"
              value={comment}
              onChange={(event) => {
                setComment(event.target.value);
                setReviewError('');
                setReviewConfirmation('');
              }}
              minLength={20}
              maxLength={1000}
              required
              placeholder="¿Qué te ayudó a disfrutar el destino y qué conviene saber antes de ir?"
              aria-describedby="review-counter"
            />
          </Field>
          <p id="review-counter" className="review-form__counter">
            {comment.length}/1000 caracteres · mínimo 20
          </p>
          {reviewError && <Notice tone="error">{reviewError}</Notice>}
          {reviewConfirmation && <Notice tone="success">{reviewConfirmation}</Notice>}
          <Button type="submit" loading={reviewPending}>
            Enviar para revisión
          </Button>
        </form>
      ) : (
        <p className="reviews__login">
          <Link to="/auth" state={loginState}>
            Entra para compartir tu experiencia
          </Link>
          . La reseña se revisará antes de publicarse.
        </p>
      )}
    </section>
  );
}
