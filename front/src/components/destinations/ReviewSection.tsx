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
    if (!user?.emailVerified) {
      setError('Verifica tu email antes de firmar');
      return;
    }
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
        <div className="reviews-section__head">
          <div>
            <span className="reviews-section__eyebrow field-label">Firmas</span>
            <h2 className="reviews-section__title">
              El libro de visitas
            </h2>
          </div>
          <div className="reviews-section__score-wrap">
            {stats.count > 0 ? (
              <>
                <p className="reviews-section__score">
                  {stats.average.toFixed(1)}
                </p>
                <StarRating value={stats.average} readOnly size={14} className="reviews-section__stars" />
                <p className="reviews-section__count field-label">
                  {stats.count} {stats.count === 1 ? 'firma' : 'firmas'}
                </p>
              </>
            ) : (
              <p className="reviews-section__count field-label">
                Ficha editorial · sin firmas aún
              </p>
            )}
          </div>
        </div>

        <div className="ui-card reviews-form-card">
          {user && !user.emailVerified ? (
            <div className="reviews-guest">
              <div>
                <h3 className="reviews-form__title">Verifica tu email</h3>
                <p className="reviews-guest__text">
                  Para firmar el libro de visitas, confirma tu correo desde el perfil.
                </p>
              </div>
              <Link to="/perfil" className="btn-cta">
                Ir al perfil
              </Link>
            </div>
          ) : user ? (
            <form onSubmit={handleSubmit} className="reviews-form">
              <h3 className="reviews-form__title">
                {ownReview ? 'Tu firma' : 'Firma el libro'}
              </h3>
              <div>
                <p className="reviews-form__label field-label">Valoración</p>
                <StarRating value={rating} onChange={setRating} size={28} />
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Qué tal estuvo, sin florituras…"
                className="ui-input reviews-form__textarea"
              />
              {error && <p className="reviews-form__error">{error}</p>}
              <div className="reviews-form__actions">
                <button type="submit" disabled={submitting} className="btn-cta">
                  {submitting ? 'Guardando…' : ownReview ? 'Actualizar' : 'Publicar'}
                </button>
                {ownReview && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting}
                    className="reviews-form__delete"
                  >
                    <Trash2 className="icon-sm" /> Borrar
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="reviews-guest">
              <div>
                <h3 className="reviews-guest__title">
                  ¿Has pasado por aquí?
                </h3>
                <p className="reviews-guest__text">Entra y deja tu firma. Sin cuenta no hay libro.</p>
              </div>
              <Link to="/auth" className="btn-cta reviews-guest__cta">
                <LogIn className="icon-sm" /> Entrar
              </Link>
            </div>
          )}
        </div>

        {loading ? (
          <p className="reviews-loading">Cargando firmas…</p>
        ) : reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((r) => (
              <div key={r.id} className="reviews-item">
                <Avatar user={{ nombre: r.user.nombre, email: '', avatarUrl: r.user.avatarUrl }} size="md" />
                <div className="reviews-item__body">
                  <div className="reviews-item__head">
                    <span className="reviews-item__name">
                      {r.user.nombre || 'Viajero anónimo'}
                    </span>
                    <span className="reviews-item__date field-label">{formatDate(r.createdAt)}</span>
                  </div>
                  <StarRating value={r.rating} readOnly size={14} className="reviews-item__stars" />
                  {r.comment && <p className="reviews-item__comment">{r.comment}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="reviews-empty">
            Nadie ha firmado aún el libro de visitas. Estrénalo.
          </p>
        )}
      </section>
    </ScrollReveal>
  );
}
