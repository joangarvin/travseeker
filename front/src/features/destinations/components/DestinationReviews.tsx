import { useEffect, useRef, useState } from 'react';
import { t, intlLocale } from '../../../i18n';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  Info,
  MessageSquareHeart,
  MessageSquarePlus,
  PencilLine,
  Star,
  X,
} from 'lucide-react';
import { Button, Field, Loader, MediaImage, Notice } from '../../../components/ui';
import { excerptAtWord, imageUrl } from '../../../utils';
import type { Review } from '../../../types';
import type { useDestinationReviews } from '../hooks/useDestinationReviews';

const months = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat(intlLocale, { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, month, 1)),
  ),
);
const parties = ['En pareja', 'En familia', 'Con amigos', 'En solitario'];
const dateFormatter = new Intl.DateTimeFormat(intlLocale, { month: 'long', year: 'numeric' });
const statusLabels = {
  pending: 'Pendiente de revisión',
  published: 'Publicada',
  rejected: 'No publicada',
  flagged: 'En revisión',
};
const DISTRIBUTION_THRESHOLD = 5;

function Stars({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span className="review__rating" aria-hidden="true" style={{ ['--star-size' as string]: `${size}px` }}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} className={index < value ? 'is-filled' : ''} />
      ))}
    </span>
  );
}

function ReviewEntry({ review }: { review: Review }) {
  const [expanded, setExpanded] = useState(false);
  const author =
    [review.user?.nombre, review.user?.apellidos].filter(Boolean).join(' ').trim() ||
    t('Viajero de TravSeeker');
  const comment = review.comment || t('Valoración sin comentario.');
  const long = comment.length > 340;
  return (
    <article className="review">
      <header>
        {review.user?.avatarUrl ? (
          <MediaImage
            sizes="48px"
            className="review__avatar"
            src={imageUrl(review.user.avatarUrl)}
            alt=""
            loading="lazy"
          />
        ) : (
          <span className="review__avatar-fallback" aria-hidden="true">
            {author
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join('')
              .toLocaleUpperCase(intlLocale)}
          </span>
        )}
        <div>
          <h3>{author}</h3>
          <p>
            <time dateTime={review.createdAt}>
              {dateFormatter.format(new Date(review.createdAt))}
            </time>
          </p>
        </div>
        <span aria-label={t('{0} de 5 estrellas', { 0: review.rating })}>
          <Stars value={review.rating} />
        </span>
      </header>
      <div className="review__body">
        {(review.visitMonth || review.travelParty) && (
          <p className="review__context">
            {review.visitMonth && (
              <span>{t('Viajó en {0}', { 0: months[review.visitMonth - 1] })}</span>
            )}
            {review.travelParty && <span>{t(review.travelParty)}</span>}
          </p>
        )}
        <p className="review__comment" id={`comment-${review.id}`}>
          {long && !expanded ? `“${excerptAtWord(comment, 340)}”` : `“${comment}”`}
        </p>
        {long && (
          <button
            className="review__read"
            type="button"
            aria-expanded={expanded}
            aria-controls={`comment-${review.id}`}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? t('Leer menos') : t('Leer más')} <ChevronDown aria-hidden="true" />
          </button>
        )}
        {review.adminResponse && (
          <aside className="review__response" aria-label={t('Respuesta oficial de TravSeeker')}>
            <strong>{t('Respuesta oficial')}</strong>
            <p>{review.adminResponse}</p>
          </aside>
        )}
      </div>
    </article>
  );
}

interface DestinationReviewsProps {
  destinationName: string;
  reviewState: ReturnType<typeof useDestinationReviews>;
  authenticated: boolean;
  emailVerified: boolean;
  loginState: { returnTo: string };
}

export function DestinationReviews({
  destinationName,
  reviewState,
  authenticated,
  emailVerified,
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
    visitMonth,
    setVisitMonth,
    travelParty,
    setTravelParty,
    ownReview,
    ownLoading,
    ownError,
    retryOwnReview,
    reviewPending,
    reviewError,
    setReviewError,
    reviewConfirmation,
    setReviewConfirmation,
    visibleReviewCount,
    setVisibleReviewCount,
    submitReview,
  } = reviewState;
  const [formOpen, setFormOpen] = useState(false);
  const compose = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!formOpen || ownLoading) return;
    compose.current?.scrollIntoView({ block: 'start', behavior: 'instant' });
    compose.current
      ?.querySelector<HTMLInputElement>('input[name="rating"]:checked, input[name="rating"]')
      ?.focus({ preventScroll: true });
  }, [formOpen, ownLoading]);
  const [starFilter, setStarFilter] = useState(0);
  const [monthFilter, setMonthFilter] = useState('');
  const [partyFilter, setPartyFilter] = useState('');
  const [sort, setSort] = useState('recent');
  const count = reviewStats.count ?? reviews.length;
  const average = reviewStats.average || 0;
  const roundedStars = Math.round(average);
  const showDistribution = count >= DISTRIBUTION_THRESHOLD;
  const filtered = reviews
    .filter(
      (review) =>
        (!starFilter || review.rating === starFilter) &&
        (!monthFilter || review.visitMonth === Number(monthFilter)) &&
        (!partyFilter || review.travelParty === partyFilter),
    )
    .sort((a, b) => {
      const difference =
        sort === 'highest' ? b.rating - a.rating : sort === 'lowest' ? a.rating - b.rating : 0;
      return difference || Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });
  const availableMonths = [
    ...new Set(reviews.flatMap((review) => (review.visitMonth ? [review.visitMonth] : []))),
  ].sort((a, b) => a - b);
  const availableParties = [
    ...new Set(reviews.flatMap((review) => (review.travelParty ? [review.travelParty] : []))),
  ];
  const hasFilters = Boolean(starFilter || monthFilter || partyFilter);
  const clearFilters = () => {
    setStarFilter(0);
    setMonthFilter('');
    setPartyFilter('');
    setVisibleReviewCount(3);
  };
  const openForm = () => setFormOpen(true);
  const edit = () => {
    setReviewError('');
    setReviewConfirmation('');
  };
  const actionLabel = ownReview ? t('Editar mi reseña') : t('Escribir mi opinión');
  const firstLabel = t('Escribir la primera');
  const action = authenticated ? (
    <Button
      aria-expanded={formOpen}
      aria-controls="review-compose"
      onClick={() => setFormOpen(!formOpen)}
    >
      {formOpen ? <X aria-hidden="true" /> : <PencilLine aria-hidden="true" />}
      {formOpen ? t('Cerrar formulario') : actionLabel}
    </Button>
  ) : (
    <Link className="button button--primary" to="/auth" state={loginState}>
      <PencilLine aria-hidden="true" />
      {actionLabel}
    </Link>
  );
  const firstAction = authenticated ? (
    <Button aria-expanded={formOpen} aria-controls="review-compose" onClick={openForm}>
      <PencilLine aria-hidden="true" />
      {firstLabel}
    </Button>
  ) : (
    <Link className="button button--primary" to="/auth" state={loginState}>
      <PencilLine aria-hidden="true" />
      {firstLabel}
    </Link>
  );
  const ghostAction = authenticated ? (
    <button className="reviews__ghost" type="button" onClick={openForm}>
      <MessageSquarePlus aria-hidden="true" />
      <span>
        {t('¿Has estado en {0}?', { 0: destinationName })}
        <br />
        {t('Tu opinión ayuda a decidir.')}
      </span>
    </button>
  ) : (
    <Link className="reviews__ghost" to="/auth" state={loginState}>
      <MessageSquarePlus aria-hidden="true" />
      <span>
        {t('¿Has estado en {0}?', { 0: destinationName })}
        <br />
        {t('Tu opinión ayuda a decidir.')}
      </span>
    </Link>
  );

  return (
    <section id="opiniones" className="reviews" aria-labelledby="reviews-title">
      <header className="reviews__heading">
        <div className="destination-section-heading">
          <p className="kicker">{t('Experiencias reales')}</p>
          <h2 id="reviews-title">{t('Opiniones de viajeros')}</h2>
        </div>
        {(count > 0 || reviewsError || reviewsLoading || formOpen) && action}
      </header>
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
      ) : count > 0 ? (
        <div className="reviews__layout">
          <aside className="reviews__summary" aria-label={t('Resumen de valoraciones')}>
            <Stars value={roundedStars} size={22} />
            <div className="reviews__score">
              <strong>
                {average.toLocaleString(intlLocale, {
                  maximumFractionDigits: 1,
                })}
              </strong>
              <small>
                {count === 1
                  ? t('1 opinión publicada')
                  : t('{0} opiniones publicadas', { 0: count })}
              </small>
            </div>
            {showDistribution ? (
              <div className="reviews__distribution" aria-label={t('Distribución de valoraciones')}>
                {[5, 4, 3, 2, 1].map((value) => {
                  const total =
                    reviewStats.distribution?.[value as 1 | 2 | 3 | 4 | 5] ??
                    reviews.filter((review) => review.rating === value).length;
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={!total}
                      aria-pressed={starFilter === value}
                      aria-label={t('{0} estrellas: {1} opiniones', { 0: value, 1: total })}
                      onClick={() => {
                        setStarFilter(starFilter === value ? 0 : value);
                        setVisibleReviewCount(3);
                      }}
                    >
                      <span>
                        {value}
                        <Star aria-hidden="true" />
                      </span>
                      <progress max={count} value={total} aria-hidden="true" />
                      <b>{total}</b>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="reviews__few">
                <Info aria-hidden="true" />
                {t('El reparto por estrellas aparecerá cuando haya 5 opiniones.')}
              </p>
            )}
          </aside>
          <div className="reviews__content">
            {reviews.length > 3 && (
              <div className="reviews__filters">
                <label>
                  {t('Ordenar por')}
                  <select
                    value={sort}
                    onChange={(event) => {
                      setSort(event.target.value);
                      setVisibleReviewCount(3);
                    }}
                  >
                    <option value="recent">{t('Más recientes')}</option>
                    <option value="highest">{t('Mayor puntuación')}</option>
                    <option value="lowest">{t('Menor puntuación')}</option>
                  </select>
                </label>
                {availableMonths.length > 1 && (
                  <label>
                    {t('Mes de visita')}
                    <select
                      value={monthFilter}
                      onChange={(event) => {
                        setMonthFilter(event.target.value);
                        setVisibleReviewCount(3);
                      }}
                    >
                      <option value="">{t('Todos los meses')}</option>
                      {availableMonths.map((month) => (
                        <option key={month} value={month}>
                          {months[month - 1]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {availableParties.length > 1 && (
                  <label>
                    {t('Tipo de viaje')}
                    <select
                      value={partyFilter}
                      onChange={(event) => {
                        setPartyFilter(event.target.value);
                        setVisibleReviewCount(3);
                      }}
                    >
                      <option value="">{t('Todos los viajes')}</option>
                      {availableParties.map((party) => (
                        <option key={party} value={party}>
                          {t(party)}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
            )}
            {hasFilters && (
              <div className="reviews__filter-status">
                <span role="status">
                  {starFilter
                    ? t('{0} opiniones · {1} estrellas', { 0: filtered.length, 1: starFilter })
                    : t('{0} opiniones', { 0: filtered.length })}
                </span>
                <button type="button" onClick={clearFilters}>
                  <X aria-hidden="true" />
                  {t('Quitar filtros')}
                </button>
              </div>
            )}
            <div className="reviews__list">
              {filtered.slice(0, visibleReviewCount).map((review) => (
                <ReviewEntry review={review} key={review.id} />
              ))}
              {!filtered.length && (
                <p className="reviews__no-results">{t('No hay opiniones con estos filtros.')}</p>
              )}
              {!hasFilters && filtered.length > 0 && filtered.length < 3 && !formOpen && ghostAction}
            </div>
            {visibleReviewCount < filtered.length && (
              <Button
                className="reviews__more"
                variant="secondary"
                onClick={() => setVisibleReviewCount((value) => value + 3)}
              >
                {t('Ver más opiniones')}
                <ChevronDown aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        !formOpen && (
          <div className="reviews__invitation">
            <span className="reviews__invitation-icon" aria-hidden="true">
              <MessageSquareHeart />
            </span>
            <div>
              <h3>{t('Aún nadie ha opinado sobre {0}', { 0: destinationName })}</h3>
              <p>
                {t('¿Has estado? Cuenta qué te ayudó y qué conviene saber antes de ir.')}
              </p>
            </div>
            {firstAction}
          </div>
        )
      )}
      {authenticated && ownReview && !reviewConfirmation && (
        <p className="reviews__own-status" role="status">
          {t('Tu reseña')}: <strong>{t(statusLabels[ownReview.status])}</strong>
        </p>
      )}
      {reviewConfirmation && <Notice tone="success">{reviewConfirmation}</Notice>}
      {authenticated && formOpen && (
        <div ref={compose} id="review-compose" className="reviews__compose">
          {ownLoading ? (
            <Loader label={t('Cargando tu reseña')} />
          ) : ownError ? (
            <Notice
              tone="error"
              action={
                <button type="button" onClick={retryOwnReview}>
                  {t('Reintentar')}
                </button>
              }
            >
              {ownError}
            </Notice>
          ) : !emailVerified ? (
            <Notice>
              {t('Verifica tu email antes de compartir tu experiencia.')}{' '}
              <Link to="/perfil">{t('Ir a mi perfil')}</Link>
            </Notice>
          ) : (
            <form className="review-form" onSubmit={submitReview}>
              <div className="review-form__intro">
                <h3>{ownReview ? t('Actualiza tu experiencia') : t('Cuenta cómo fue')}</h3>
                <p>
                  {ownReview
                    ? t(
                        'Al enviar, sustituirás tu reseña anterior y volverá a revisión antes de publicarse.',
                      )
                    : t('Tu reseña se revisará antes de publicarse.')}
                </p>
              </div>
              <fieldset className="review-form__fields" disabled={reviewPending}>
                <legend className="sr-only">{t('Tu reseña')}</legend>
                <fieldset className="review-rating">
                  <legend>{t('Tu puntuación')}</legend>
                  <div>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <label key={value} className={value <= rating ? 'is-filled' : ''}>
                        <input
                          type="radio"
                          name="rating"
                          value={value}
                          required
                          checked={rating === value}
                          onChange={() => {
                            setRating(value);
                            edit();
                          }}
                        />
                        <Star aria-hidden="true" />
                        <span className="sr-only">{t('{0} de 5 estrellas', { 0: value })}</span>
                      </label>
                    ))}
                  </div>
                  <p aria-live="polite">
                    {rating ? t('{0} de 5 estrellas', { 0: rating }) : t('Sin seleccionar')}
                  </p>
                </fieldset>
                <div className="review-form__context">
                  <Field label={t('Mes de visita (opcional)')} htmlFor="review-month">
                    <select
                      id="review-month"
                      value={visitMonth}
                      onChange={(event) => {
                        setVisitMonth(event.target.value);
                        edit();
                      }}
                    >
                      <option value="">{t('Sin indicar')}</option>
                      {months.map((month, index) => (
                        <option value={index + 1} key={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t('Con quién viajaste (opcional)')} htmlFor="review-party">
                    <select
                      id="review-party"
                      value={travelParty}
                      onChange={(event) => {
                        setTravelParty(event.target.value);
                        edit();
                      }}
                    >
                      <option value="">{t('Sin indicar')}</option>
                      {travelParty && !parties.includes(travelParty) && (
                        <option value={travelParty}>{t(travelParty)}</option>
                      )}
                      {parties.map((party) => (
                        <option key={party} value={party}>
                          {t(party)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label={t('Tu experiencia')} htmlFor="review">
                  <textarea
                    id="review"
                    value={comment}
                    onChange={(event) => {
                      setComment(event.target.value);
                      edit();
                    }}
                    minLength={20}
                    maxLength={1000}
                    required
                    aria-describedby="review-counter"
                    placeholder={t(
                      '¿Qué te ayudó a disfrutar el destino y qué conviene saber antes de ir?',
                    )}
                  />
                </Field>
                <p id="review-counter" className="review-form__counter">
                  {comment.length}
                  {t('/1000 caracteres · mínimo 20')}
                </p>
                {reviewError && <Notice tone="error">{reviewError}</Notice>}
                <Button type="submit" loading={reviewPending} loadingLabel={t('Enviando…')}>
                  <PencilLine aria-hidden="true" />
                  {t('Enviar para revisión')}
                </Button>
              </fieldset>
            </form>
          )}
        </div>
      )}
    </section>
  );
}
