import { t } from '../../../i18n';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../../services/api';
import type { Review, ReviewStats } from '../../../types';

export function useDestinationReviews(id: string, token: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({});
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [visitMonth, setVisitMonth] = useState('');
  const [travelParty, setTravelParty] = useState('');
  const [ownReview, setOwnReview] = useState<Review | null>(null);
  const [ownLoading, setOwnLoading] = useState(Boolean(token));
  const [ownError, setOwnError] = useState('');
  const [ownRetry, setOwnRetry] = useState(0);
  const submission = useRef<AbortController | null>(null);
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewConfirmation, setReviewConfirmation] = useState('');
  const [visibleReviewCount, setVisibleReviewCount] = useState(3);

  const loadReviews = useCallback(
    async (signal?: AbortSignal) => {
      setReviewsLoading(true);
      setReviewsError('');
      try {
        const data = await api<{ reviews: Review[]; stats: ReviewStats }>(
          `/destinos/${id}/reviews`,
          {
            signal,
          },
        );
        if (!signal?.aborted) {
          setReviews(data.reviews);
          setReviewStats(data.stats);
        }
      } catch (cause) {
        if (!signal?.aborted) {
          setReviewsError(
            cause instanceof Error ? cause.message : t('No se pudieron cargar las opiniones'),
          );
        }
      } finally {
        if (!signal?.aborted) setReviewsLoading(false);
      }
    },
    [id],
  );

  useEffect(() => {
    const controller = new AbortController();
    setReviews([]);
    setReviewStats({});
    setVisibleReviewCount(3);
    void loadReviews(controller.signal);
    return () => controller.abort();
  }, [loadReviews]);

  useEffect(() => {
    const controller = new AbortController();
    setOwnReview(null);
    setRating(0);
    setComment('');
    setVisitMonth('');
    setTravelParty('');
    setReviewError('');
    setReviewConfirmation('');
    setReviewPending(false);
    setOwnError('');
    setOwnLoading(Boolean(token));
    if (token) {
      void api<Review | null>(
        `/destinos/${id}/reviews/mine`,
        {
          signal: controller.signal,
          cache: 'no-store',
        },
        token,
      )
        .then((review) => {
          if (controller.signal.aborted) return;
          setOwnReview(review);
          setRating(review?.rating || 0);
          setComment(review?.comment || '');
          setVisitMonth(review?.visitMonth ? String(review.visitMonth) : '');
          setTravelParty(review?.travelParty || '');
        })
        .catch((cause) => {
          if (!controller.signal.aborted)
            setOwnError(cause instanceof Error ? cause.message : t('No se pudo cargar tu reseña.'));
        })
        .finally(() => {
          if (!controller.signal.aborted) setOwnLoading(false);
        });
    }
    return () => {
      controller.abort();
      submission.current?.abort();
    };
  }, [id, token, ownRetry]);

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || reviewPending || ownLoading || ownError) return;
    if (!rating) {
      setReviewError(t('Elige una puntuación antes de enviar.'));
      return;
    }
    const cleanComment = comment.trim();
    if (cleanComment.length < 20) {
      setReviewError(t('Cuenta tu experiencia con al menos 20 caracteres.'));
      return;
    }
    setReviewPending(true);
    setReviewError('');
    setReviewConfirmation('');
    const controller = new AbortController();
    submission.current = controller;
    try {
      const saved = await api<Review>(
        `/destinos/${id}/reviews`,
        {
          method: 'POST',
          signal: controller.signal,
          body: JSON.stringify({ rating, comment: cleanComment, visitMonth, travelParty }),
        },
        token,
      );
      if (controller.signal.aborted) return;
      setOwnReview(saved);
      setComment(saved.comment || '');
      setReviewConfirmation(
        t('Reseña enviada y pendiente de moderación. Aparecerá aquí cuando el equipo la publique.'),
      );
      void loadReviews(controller.signal);
    } catch (cause) {
      if (!controller.signal.aborted)
        setReviewError(cause instanceof Error ? cause.message : t('No se pudo enviar la reseña'));
    } finally {
      if (!controller.signal.aborted) setReviewPending(false);
    }
  };

  return {
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
    retryOwnReview: () => setOwnRetry((value) => value + 1),
    reviewPending,
    reviewError,
    setReviewError,
    reviewConfirmation,
    setReviewConfirmation,
    visibleReviewCount,
    setVisibleReviewCount,
    submitReview,
  };
}
