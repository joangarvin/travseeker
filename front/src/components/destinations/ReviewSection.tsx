import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, LogIn } from 'lucide-react';
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
  return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
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
    if (rating < 1) { setError('Elige cuántas estrellas'); return; }
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
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <span className="field-label text-[var(--color-teja)] mb-2 block">Firmas</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--color-primary)] tracking-tight">
              El libro de visitas
            </h2>
          </div>
          <div className="text-right">
            <p className="font-serif text-4xl font-medium text-[var(--color-primary)] leading-none">
              {stats.count > 0 ? stats.average.toFixed(1) : '—'}
            </p>
            <StarRating value={stats.average} readOnly size={14} className="mt-1.5 justify-end" />
            <p className="field-label text-[var(--color-muted)] mt-1">
              {stats.count} {stats.count === 1 ? 'firma' : 'firmas'}
            </p>
          </div>
        </div>

        <div className="ui-card p-5 sm:p-6 mb-6">
          {user ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="font-serif text-lg font-medium text-[var(--color-primary)]">
                {ownReview ? 'Tu firma' : 'Firma el libro'}
              </h3>
              <div>
                <p className="field-label text-[var(--color-muted)] mb-2">Valoración</p>
                <StarRating value={rating} onChange={setRating} size={28} />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Qué tal estuvo, sin florituras…"
                className="ui-input resize-none min-h-[5.5rem]"
              />
              {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Guardando…' : ownReview ? 'Actualizar' : 'Publicar'}
                </button>
                {ownReview && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" /> Borrar
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-lg font-medium text-[var(--color-primary)] mb-1">
                  ¿Has pasado por aquí?
                </h3>
                <p className="text-sm text-[var(--color-muted)]">Entra y deja tu firma. Sin cuenta no hay libro.</p>
              </div>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:bg-[var(--color-accent-hover)] transition-colors shrink-0"
              >
                <LogIn className="w-4 h-4" /> Entrar
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-[var(--color-muted)]">Cargando firmas…</p>
        ) : reviews.length > 0 ? (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="flex gap-4 p-4 sm:p-5 border-b border-[var(--color-border)] last:border-0">
                <Avatar user={{ nombre: r.user.nombre, email: '', avatarUrl: r.user.avatarUrl }} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-[var(--color-primary)]">
                      {r.user.nombre || 'Viajero anónimo'}
                    </span>
                    <span className="field-label text-[var(--color-muted)]">{formatDate(r.createdAt)}</span>
                  </div>
                  <StarRating value={r.rating} readOnly size={14} className="mb-2" />
                  {r.comment && <p className="text-[var(--color-primary)]/80 leading-relaxed">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-10 text-[var(--color-muted)] border border-dashed border-[var(--color-border-strong)] rounded-lg">
            Nadie ha firmado aún el libro de visitas. Estrénalo.
          </p>
        )}
      </section>
    </ScrollReveal>
  );
}
