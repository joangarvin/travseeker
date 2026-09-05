import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '../../../services/api';
import type { Review, ReviewStats } from '../../../types';

export function useDestinationReviews(id: string, token: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({});
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
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
            cause instanceof Error ? cause.message : 'No se pudieron cargar las opiniones',
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

  const submitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!token) return;
    const cleanComment = comment.trim();
    if (cleanComment.length < 20) {
      setReviewError('Cuenta tu experiencia con al menos 20 caracteres.');
      return;
    }
    setReviewPending(true);
    setReviewError('');
    setReviewConfirmation('');
    try {
      await api(
        `/destinos/${id}/reviews`,
        { method: 'POST', body: JSON.stringify({ rating, comment: cleanComment }) },
        token,
      );
      setComment('');
      setRating(5);
      setReviewConfirmation(
        'Reseña enviada y pendiente de moderación. Aparecerá aquí cuando el equipo la publique.',
      );
    } catch (cause) {
      setReviewError(cause instanceof Error ? cause.message : 'No se pudo enviar la reseña');
    } finally {
      setReviewPending(false);
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
