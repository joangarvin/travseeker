import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Flag,
  MapPin,
  MessageSquareReply,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Empty, Toast } from '../../../components/ui';
import type { Review } from '../../../types';
import { imageUrl } from '../../../utils/media';
import { AdminToolbar } from './AdminToolbar';

export type ReviewStatus = Review['status'];
type ReviewTab = 'all' | 'pending' | 'published' | 'rejected';
type ReviewPatch = { status?: ReviewStatus; adminResponse?: string | null };

type ReviewsPanelProps = {
  reviews: Review[];
  query: string;
  onQueryChange: (value: string) => void;
  onModerate: (id: string, patch: ReviewPatch) => Promise<void>;
  onBulkModerate: (ids: string[], status: ReviewStatus) => Promise<void>;
  onBulkDelete: (ids: string[]) => Promise<void>;
};

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'Pendiente',
  published: 'Publicada',
  rejected: 'Rechazada',
  flagged: 'Señalada',
};

const DATE_FORMATTER = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

function reviewerName(review: Review) {
  return (
    [review.user?.nombre, review.user?.apellidos].filter(Boolean).join(' ') || 'Viajero anónimo'
  );
}

function ReviewerAvatar({ review }: { review: Review }) {
  const [failed, setFailed] = useState(false);
  const name = reviewerName(review);
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const source = imageUrl(review.user?.avatarUrl);

  return source && !failed ? (
    <img className="review-card__avatar" src={source} alt="" onError={() => setFailed(true)} />
  ) : (
    <span className="review-card__avatar review-card__avatar--fallback" aria-hidden="true">
      {initials}
    </span>
  );
}

function ReviewRating({ rating }: { rating: number }) {
  return (
    <div className="review-card__rating" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star key={index} className={index < rating ? 'is-filled' : ''} aria-hidden="true" />
      ))}
    </div>
  );
}

function DeleteReviewsDialog({
  count,
  isDeleting,
  onClose,
  onConfirm,
}: {
  count: number;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AdminModal
      title={`Eliminar ${count} ${count === 1 ? 'reseña' : 'reseñas'}`}
      subtitle="Esta acción no se puede deshacer."
      onClose={onClose}
    >
      <div className="review-delete-dialog">
        <Trash2 aria-hidden="true" />
        <p>
          Se eliminarán definitivamente las reseñas seleccionadas, incluidas sus respuestas del
          equipo.
        </p>
      </div>
      <footer className="modal-actions">
        <Button type="button" variant="quiet" data-autofocus onClick={onClose}>
          Conservar reseñas
        </Button>
        <Button type="button" variant="danger" loading={isDeleting} onClick={onConfirm}>
          Eliminar definitivamente
        </Button>
      </footer>
    </AdminModal>
  );
}

export function ReviewsPanel({
  reviews,
  query,
  onQueryChange,
  onModerate,
  onBulkModerate,
  onBulkDelete,
}: ReviewsPanelProps) {
  const [activeTab, setActiveTab] = useState<ReviewTab>(() =>
    reviews.some((review) => review.status === 'pending') ? 'pending' : 'all',
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const [editingResponseIds, setEditingResponseIds] = useState<Set<string>>(() => new Set());
  const [busyIds, setBusyIds] = useState<Set<string>>(() => new Set());
  const [bulkAction, setBulkAction] = useState<ReviewStatus | 'delete' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const counts = useMemo(
    () => ({
      all: reviews.length,
      pending: reviews.filter((review) => review.status === 'pending').length,
      published: reviews.filter((review) => review.status === 'published').length,
      rejected: reviews.filter((review) => ['rejected', 'flagged'].includes(review.status)).length,
    }),
    [reviews],
  );

  const visibleReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es');
    return reviews.filter((review) => {
      const matchesTab =
        activeTab === 'all' ||
        review.status === activeTab ||
        (activeTab === 'rejected' && review.status === 'flagged');
      if (!matchesTab) return false;
      if (!normalizedQuery) return true;
      return `${review.destino?.nombre || ''} ${reviewerName(review)} ${review.comment || ''}`
        .toLocaleLowerCase('es')
        .includes(normalizedQuery);
    });
  }, [activeTab, query, reviews]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab, query]);

  const allVisibleSelected =
    visibleReviews.length > 0 && visibleReviews.every((review) => selectedIds.has(review.id));

  const toggleReview = (reviewId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(reviewId)) next.delete(reviewId);
      else next.add(reviewId);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleReviews.forEach((review) => next.delete(review.id));
      else visibleReviews.forEach((review) => next.add(review.id));
      return next;
    });
  };

  const moderateOne = async (review: Review, patch: ReviewPatch, successMessage: string) => {
    setBusyIds((current) => new Set(current).add(review.id));
    try {
      await onModerate(review.id, patch);
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(review.id);
        return next;
      });
      setToast({ tone: 'success', text: successMessage });
      return true;
    } catch (cause) {
      setToast({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo actualizar la reseña',
      });
      return false;
    } finally {
      setBusyIds((current) => {
        const next = new Set(current);
        next.delete(review.id);
        return next;
      });
    }
  };

  const openResponseEditor = (review: Review) => {
    setResponseDrafts((current) => ({
      ...current,
      [review.id]: current[review.id] ?? review.adminResponse ?? '',
    }));
    setEditingResponseIds((current) => new Set(current).add(review.id));
  };

  const closeResponseEditor = (review: Review) => {
    setResponseDrafts((current) => ({ ...current, [review.id]: review.adminResponse ?? '' }));
    setEditingResponseIds((current) => {
      const next = new Set(current);
      next.delete(review.id);
      return next;
    });
  };

  const saveResponse = async (review: Review, responseDraft: string) => {
    const saved = await moderateOne(
      review,
      { adminResponse: responseDraft, status: 'published' },
      responseDraft.trim()
        ? 'Respuesta guardada y reseña publicada'
        : 'Respuesta eliminada y reseña publicada',
    );
    if (saved) {
      setEditingResponseIds((current) => {
        const next = new Set(current);
        next.delete(review.id);
        return next;
      });
    }
  };

  const runBulkModeration = async (status: ReviewStatus) => {
    const ids = [...selectedIds];
    if (!ids.length) return;
    setBulkAction(status);
    try {
      await onBulkModerate(ids, status);
      setSelectedIds(new Set());
      setToast({
        tone: 'success',
        text: `${ids.length} ${ids.length === 1 ? 'reseña actualizada' : 'reseñas actualizadas'}`,
      });
    } catch (cause) {
      setToast({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudieron actualizar las reseñas',
      });
    } finally {
      setBulkAction(null);
    }
  };

  const confirmBulkDelete = async () => {
    const ids = [...selectedIds];
    setBulkAction('delete');
    try {
      await onBulkDelete(ids);
      setSelectedIds(new Set());
      setConfirmDelete(false);
      setToast({
        tone: 'success',
        text: `${ids.length} ${ids.length === 1 ? 'reseña eliminada' : 'reseñas eliminadas'}`,
      });
    } catch (cause) {
      setToast({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudieron eliminar las reseñas',
      });
    } finally {
      setBulkAction(null);
    }
  };

  const tabs: Array<{ id: ReviewTab; label: string }> = [
    { id: 'all', label: 'Todas' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'published', label: 'Publicadas' },
    { id: 'rejected', label: 'Rechazadas / reportadas' },
  ];

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    document.getElementById(`review-tab-${nextTab.id}`)?.focus();
  };

  return (
    <div className="review-moderation">
      <header className="review-moderation__intro">
        <div>
          <span className="kicker">Comunidad</span>
          <h2>Moderación de reseñas</h2>
          <p>Revisa cada experiencia antes de hacerla visible en TravSeeker.</p>
        </div>
        {counts.pending > 0 && (
          <div className="review-moderation__queue" aria-label={`${counts.pending} pendientes`}>
            <strong>{counts.pending}</strong>
            <span>por revisar</span>
          </div>
        )}
      </header>

      <div className="review-tabs" role="tablist" aria-label="Filtrar reseñas por estado">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`review-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls="review-results"
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={activeTab === tab.id ? 'is-active' : ''}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => handleTabKeyDown(event, index)}
          >
            <span>{tab.label}</span>
            <strong>{counts[tab.id]}</strong>
          </button>
        ))}
      </div>

      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar destino, persona o comentario"
        resultCount={visibleReviews.length}
      >
        {visibleReviews.length > 0 && (
          <label className="review-select-all">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
            <span>Seleccionar visibles</span>
          </label>
        )}
      </AdminToolbar>

      <section
        id="review-results"
        role="tabpanel"
        aria-labelledby={`review-tab-${activeTab}`}
        className="review-card-list"
      >
        {visibleReviews.length === 0 ? (
          <Empty icon={<MessageSquareReply />} title="No hay reseñas aquí">
            {query
              ? 'Prueba con otra búsqueda.'
              : 'Las reseñas aparecerán cuando lleguen a este estado.'}
          </Empty>
        ) : (
          visibleReviews.map((review) => {
            const isBusy = busyIds.has(review.id);
            const responseDraft = responseDrafts[review.id] ?? review.adminResponse ?? '';
            const responseChanged = responseDraft.trim() !== (review.adminResponse || '').trim();
            const isEditingResponse = editingResponseIds.has(review.id);
            const author = reviewerName(review);

            return (
              <article
                key={review.id}
                className={`review-card review-card--${review.status}${selectedIds.has(review.id) ? ' is-selected' : ''}`}
              >
                <label className="review-card__select">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(review.id)}
                    onChange={() => toggleReview(review.id)}
                  />
                  <span className="sr-only">Seleccionar reseña de {author}</span>
                </label>

                <header className="review-card__header">
                  <ReviewerAvatar review={review} />
                  <div className="review-card__identity">
                    <h3>{author}</h3>
                    <div className="review-card__destination">
                      <MapPin aria-hidden="true" />
                      <span>{review.destino?.nombre || 'Destino sin nombre'}</span>
                    </div>
                  </div>
                  <span className={`review-status review-status--${review.status}`}>
                    {review.status === 'published' && <CheckCircle2 aria-hidden="true" />}
                    {review.status === 'pending' && <CalendarDays aria-hidden="true" />}
                    {review.status === 'rejected' && <X aria-hidden="true" />}
                    {review.status === 'flagged' && <Flag aria-hidden="true" />}
                    {STATUS_LABELS[review.status]}
                  </span>
                </header>

                <div className="review-card__meta">
                  <ReviewRating rating={review.rating} />
                  <time dateTime={review.createdAt}>
                    {DATE_FORMATTER.format(new Date(review.createdAt))}
                  </time>
                </div>

                <p className="review-card__comment">
                  {review.comment || 'Valoración sin comentario.'}
                </p>

                <div className="review-card__response">
                  {review.adminResponse && !isEditingResponse && (
                    <div className="review-card__official-response">
                      <div>
                        <span>
                          <MessageSquareReply aria-hidden="true" /> Respuesta oficial
                        </span>
                        {review.respondedAt && (
                          <time dateTime={review.respondedAt}>
                            Respondida el {DATE_FORMATTER.format(new Date(review.respondedAt))}
                          </time>
                        )}
                      </div>
                      <p>{review.adminResponse}</p>
                    </div>
                  )}

                  {isEditingResponse ? (
                    <div className="review-card__response-editor">
                      <label htmlFor={`review-response-${review.id}`}>
                        <MessageSquareReply aria-hidden="true" />
                        Respuesta del equipo
                      </label>
                      <textarea
                        id={`review-response-${review.id}`}
                        value={responseDraft}
                        maxLength={1000}
                        rows={3}
                        autoFocus
                        disabled={isBusy}
                        placeholder="Añade una respuesta pública y cercana…"
                        onChange={(event) =>
                          setResponseDrafts((current) => ({
                            ...current,
                            [review.id]: event.target.value,
                          }))
                        }
                      />
                      <div>
                        <small>{responseDraft.length}/1000</small>
                        <div>
                          <Button
                            type="button"
                            variant="quiet"
                            disabled={isBusy}
                            onClick={() => closeResponseEditor(review)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={!responseChanged || isBusy}
                            loading={isBusy && responseChanged}
                            onClick={() => void saveResponse(review, responseDraft)}
                          >
                            Guardar y publicar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="quiet"
                      className="review-card__response-trigger"
                      onClick={() => openResponseEditor(review)}
                    >
                      <MessageSquareReply aria-hidden="true" />
                      {review.adminResponse ? 'Editar respuesta' : 'Responder y publicar'}
                    </Button>
                  )}
                </div>

                <footer className="review-card__actions">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={review.status === 'published' || isBusy}
                    loading={isBusy && review.status !== 'published'}
                    onClick={() =>
                      void moderateOne(review, { status: 'published' }, 'Reseña publicada')
                    }
                  >
                    <Check aria-hidden="true" /> Aprobar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={review.status === 'rejected' || isBusy}
                    onClick={() =>
                      void moderateOne(review, { status: 'rejected' }, 'Reseña rechazada')
                    }
                  >
                    <X aria-hidden="true" /> Rechazar
                  </Button>
                </footer>
              </article>
            );
          })
        )}
      </section>

      {selectedIds.size > 0 && (
        <aside className="review-bulk-bar" aria-label="Acciones para reseñas seleccionadas">
          <div aria-live="polite">
            <strong>{selectedIds.size}</strong>
            <span>{selectedIds.size === 1 ? 'seleccionada' : 'seleccionadas'}</span>
          </div>
          <div>
            <Button
              type="button"
              variant="primary"
              loading={bulkAction === 'published'}
              disabled={bulkAction !== null}
              onClick={() => void runBulkModeration('published')}
            >
              <Check aria-hidden="true" /> Aprobar
            </Button>
            <Button
              type="button"
              variant="secondary"
              loading={bulkAction === 'rejected'}
              disabled={bulkAction !== null}
              onClick={() => void runBulkModeration('rejected')}
            >
              <X aria-hidden="true" /> Rechazar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={bulkAction !== null}
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 aria-hidden="true" /> Eliminar
            </Button>
          </div>
        </aside>
      )}

      {confirmDelete && (
        <DeleteReviewsDialog
          count={selectedIds.size}
          isDeleting={bulkAction === 'delete'}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => void confirmBulkDelete()}
        />
      )}

      {toast && (
        <Toast tone={toast.tone} onDismiss={() => setToast(null)}>
          {toast.text}
        </Toast>
      )}
    </div>
  );
}
