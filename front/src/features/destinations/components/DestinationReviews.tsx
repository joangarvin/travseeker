import { t, intlLocale } from '../../../i18n';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button, Field, Loader, MediaImage, Notice } from '../../../components/ui';
import { imageUrl } from '../../../utils';
import type { Review } from '../../../types';
import type { useDestinationReviews } from '../hooks/useDestinationReviews';

const monthNames = [
  t('enero'),
  t('febrero'),
  t('marzo'),
  t('abril'),
  t('mayo'),
  t('junio'),
  t('julio'),
  t('agosto'),
  t('septiembre'),
  t('octubre'),
  t('noviembre'),
  t('diciembre'),
];

const reviewDateFormatter = new Intl.DateTimeFormat(intlLocale, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function reviewAuthor(review: Review) {
  return (
    [review.user?.nombre, review.user?.apellidos].filter(Boolean).join(' ').trim() ||
    t('Viajero de TravSeeker')
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
          <p className="kicker">{t('Experiencias reales')}</p>
          <h2 id="reviews-title">{t('Opiniones de viajeros')}</h2>
        </div>
        {hasReviews ? (
          <div
            className="reviews__score"
            aria-label={t('{0} de 5, {1} {2}', {
              0: average,
              1: reviewCount,
              2: reviewCount === 1 ? t('opinión') : t('opiniones'),
            })}
          >
            <Star aria-hidden="true" />
            <strong>
              {average.toLocaleString(intlLocale, { maximumFractionDigits: 1 })} {t('de 5')}
            </strong>
            <span>
              {reviewCount} {reviewCount === 1 ? t('opinión publicada') : t('opiniones publicadas')}
            </span>
          </div>
        ) : (
          <p className="reviews__no-score">{t('Todavía no hay una valoración pública.')}</p>
        )}
      </header>

      {hasReviews && reviewStats.distribution && (
        <div className="reviews__distribution" aria-label={t('Distribución de valoraciones')}>
          {[5, 4, 3, 2, 1].map((value) => {
            const count = reviewStats.distribution?.[value as 1 | 2 | 3 | 4 | 5] || 0;
            return (
              <div key={value}>
                <span>
                  {value} {t('estrellas')}
                </span>
                <progress
                  max={reviewCount}
                  value={count}
                  aria-label={t('{0} estrellas: {1} opiniones', { 0: value, 1: count })}
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
              {t('Reintentar')}
            </button>
          }
        >
          {reviewsError}
        </Notice>
      ) : reviewsLoading ? (
        <Loader label={t('Cargando opiniones')} />
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
                        {review.visitMonth &&
                          t(' · Viajó en {0}', { 0: monthNames[review.visitMonth - 1] })}
                      </p>
                    </div>
                    <span
                      className="review__rating"
                      aria-label={t('{0} de 5 estrellas', { 0: review.rating })}
                    >
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
                    {review.comment || t('Valoración sin comentario.')}
                  </p>
                  {review.adminResponse && (
                    <aside
                      className="review__response"
                      aria-label={t('Respuesta oficial de TravSeeker')}
                    >
                      <strong>{t('Respuesta oficial')}</strong>
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
              {t('Ver más opiniones')}
            </Button>
          )}
        </>
      ) : (
        <div className="reviews__empty">
          <h3>{t('Sé la primera persona en contarlo')}</h3>
          <p>{t('Una experiencia concreta puede ayudar a otra persona a decidir mejor.')}</p>
        </div>
      )}

      {authenticated ? (
        <form className="review-form" onSubmit={submitReview}>
          <div>
            <h3>{t('Cuenta cómo fue')}</h3>
            <p>
              {t(
                'Revisamos cada reseña antes de publicarla. Tu envío quedará pendiente y no cambiará la valoración pública inmediatamente.',
              )}
            </p>
          </div>
          <fieldset className="review-rating">
            <legend>{t('Tu puntuación')}</legend>
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
                    {value} {value === 1 ? t('estrella') : t('estrellas')}
                  </span>
                </label>
              ))}
            </div>
            <p aria-live="polite">
              {rating} {t('de 5 estrellas')}
            </p>
          </fieldset>
          <Field label={t('Tu experiencia')} htmlFor="review">
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
              placeholder={t(
                '¿Qué te ayudó a disfrutar el destino y qué conviene saber antes de ir?',
              )}
              aria-describedby="review-counter"
            />
          </Field>
          <p id="review-counter" className="review-form__counter">
            {comment.length}
            {t('/1000 caracteres · mínimo 20')}
          </p>
          {reviewError && <Notice tone="error">{reviewError}</Notice>}
          {reviewConfirmation && <Notice tone="success">{reviewConfirmation}</Notice>}
          <Button type="submit" loading={reviewPending}>
            {t('Enviar para revisión')}
          </Button>
        </form>
      ) : (
        <p className="reviews__login">
          <Link to="/auth" state={loginState}>
            {t('Entra para compartir tu experiencia')}
          </Link>
          {t('. La reseña se revisará antes de publicarse.')}
        </p>
      )}
    </section>
  );
}
