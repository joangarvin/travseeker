import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Trash2, LogIn } from 'lucide-react';
import StarRating from '../ui/StarRating';
import Avatar from '../ui/Avatar';
import ScrollReveal from '../ui/ScrollReveal';
import { useAuth } from '../../context/AuthContext';
import { getReviews, upsertReview, deleteReview } from '../../api/reviews';
import { ApiError } from '../../api/client';
import type { Review, ReviewStats } from '../../types/review';

interface Props {
  destinoId: string;
}

const EMPTY_STATS: ReviewStats = { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function ReviewSection({ destinoId }: Props) {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const ownReview = useMemo(
    () => (user ? reviews.find((r) => r.user.id === user.id) : undefined),
    [reviews, user],
  );

  const load = useMemo(() => (signal?: AbortSignal) => {
    setLoading(true);
    return getReviews(destinoId, signal)
      .then((data) => {
        setReviews(data.reviews);
        setStats(data.stats);
      })
      .catch(() => { /* silencioso */ })
      .finally(() => setLoading(false));
  }, [destinoId]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    if (ownReview) {
      setRating(ownReview.rating);
      setComment(ownReview.comment ?? '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [ownReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (rating < 1) { setError('Selecciona una valoración'); return; }
    setSubmitting(true);
    setError('');
    try {
      await upsertReview(destinoId, rating, comment, token);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await deleteReview(destinoId, token);
      await load();
    } catch {
      setError('No se pudo eliminar la reseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollReveal>
      <section id="resenas">
        <h2 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight mb-2">Reseñas de viajeros</h2>
        <p className="text-sm text-[var(--color-muted)] mb-8">Opiniones reales de quienes ya han estado allí.</p>

        <div className="grid md:grid-cols-[260px_1fr] gap-8 mb-10">
          <div className="flex md:flex-col items-center md:items-start gap-4 md:gap-3 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <div className="text-center md:text-left">
              <div className="text-5xl font-semibold text-[var(--color-primary)] leading-none">
                {stats.count > 0 ? stats.average.toFixed(1) : '—'}
              </div>
              <StarRating value={stats.average} readOnly size={16} className="mt-2 justify-center md:justify-start" />
              <p className="text-xs text-[var(--color-muted)] mt-1">
                {stats.count} {stats.count === 1 ? 'reseña' : 'reseñas'}
              </p>
            </div>
            <div className="flex-1 w-full space-y-1.5">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = stats.distribution[n] || 0;
                const pct = stats.count > 0 ? (c / stats.count) * 100 : 0;
                return (
                  <div key={n} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-muted)] w-3">{n}</span>
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            {user ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-semibold text-[var(--color-primary)]">
                  {ownReview ? 'Edita tu reseña' : 'Deja tu reseña'}
                </h3>
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide mb-2">Tu valoración</p>
                  <StarRating value={rating} onChange={setRating} size={28} />
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Cuenta tu experiencia (opcional)"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border-strong)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all resize-none"
                />
                {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Guardando...' : ownReview ? 'Actualizar' : 'Publicar reseña'}
                  </button>
                  {ownReview && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={submitting}
                      className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-start justify-center h-full gap-3">
                <h3 className="font-semibold text-[var(--color-primary)]">¿Has visitado este destino?</h3>
                <p className="text-sm text-[var(--color-muted)]">Inicia sesión para compartir tu valoración con la comunidad.</p>
                <Link
                  to="/auth"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all"
                >
                  <LogIn className="w-4 h-4" /> Iniciar sesión
                </Link>
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Cargando reseñas...</p>
        ) : reviews.length > 0 ? (
          <div className="space-y-5">
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-4 p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                <Avatar user={{ nombre: r.user.nombre, email: '', avatarUrl: r.user.avatarUrl }} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-[var(--color-primary)]">
                      {r.user.nombre || 'Viajero anónimo'}
                    </span>
                    <span className="text-xs text-[var(--color-muted)]">{formatDate(r.createdAt)}</span>
                  </div>
                  <StarRating value={r.rating} readOnly size={14} className="mb-2" />
                  {r.comment && <p className="text-[var(--color-primary)]/80 leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)]">
            Todavía no hay reseñas. ¡Sé el primero en valorar este destino!
          </div>
        )}
      </section>
    </ScrollReveal>
  );
}
