import { useState } from 'react';
import { t } from '../../../i18n';
import { api } from '../../../services/api';
import type { Review } from '../../../types';

type ReviewStatus = Review['status'];

export function useAdminReviews(token: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);

  const moderateReview = async (
    id: string,
    patch: { status?: ReviewStatus; adminResponse?: string | null },
  ) => {
    if (!token) throw new Error(t('La sesión de administración ha expirado'));
    const previous = reviews.find((review) => review.id === id);
    if (!previous) throw new Error(t('La reseña ya no está disponible'));

    setReviews((current) =>
      current.map((review) =>
        review.id === id
          ? {
              ...review,
              ...patch,
              respondedAt:
                patch.adminResponse === undefined
                  ? review.respondedAt
                  : patch.adminResponse?.trim()
                    ? new Date().toISOString()
                    : null,
            }
          : review,
      ),
    );

    try {
      const saved = await api<Review>(
        `/admin/reviews/${id}`,
        { method: 'PATCH', body: JSON.stringify(patch) },
        token,
      );
      setReviews((current) => current.map((review) => (review.id === id ? saved : review)));
    } catch (cause) {
      setReviews((current) => current.map((review) => (review.id === id ? previous : review)));
      throw cause;
    }
  };

  const moderateReviews = async (ids: string[], status: ReviewStatus) => {
    if (!token) throw new Error(t('La sesión de administración ha expirado'));
    const selected = new Set(ids);
    const previous = reviews.filter((review) => selected.has(review.id));
    setReviews((current) =>
      current.map((review) => (selected.has(review.id) ? { ...review, status } : review)),
    );

    try {
      await api(
        '/admin/reviews/batch',
        { method: 'PATCH', body: JSON.stringify({ reviewIds: ids, status }) },
        token,
      );
    } catch (cause) {
      const previousById = new Map(previous.map((review) => [review.id, review]));
      setReviews((current) => current.map((review) => previousById.get(review.id) || review));
      throw cause;
    }
  };

  const deleteReviews = async (ids: string[]) => {
    if (!token) throw new Error(t('La sesión de administración ha expirado'));
    const selected = new Set(ids);
    const previous = reviews;
    setReviews((current) => current.filter((review) => !selected.has(review.id)));

    try {
      await api(
        '/admin/reviews/batch',
        { method: 'DELETE', body: JSON.stringify({ reviewIds: ids }) },
        token,
      );
    } catch (cause) {
      setReviews(previous);
      throw cause;
    }
  };

  return { reviews, setReviews, moderateReview, moderateReviews, deleteReviews };
}
