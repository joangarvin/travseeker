import { useEffect, useState } from 'react';
import { Eye, EyeOff, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin';
import type { Review } from '../../types/review';

export default function AdminReviews() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reply, setReply] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    adminApi.listReviews(token).then(setReviews).catch(() => setError('No se pudieron cargar las reseñas. Comprueba que el backend esté desplegado y actualizado.')).finally(() => setLoading(false));
  }, [token]);

  const save = async (review: Review, status = review.status) => {
    if (!token) return;
    const updated = await adminApi.moderateReview(review.id, { status, adminResponse: reply[review.id] ?? review.adminResponse ?? '' }, token);
    setReviews((rows) => rows.map((row) => row.id === updated.id ? updated : row));
  };

  if (loading) return <p className="admin-reviews__empty">Cargando reseñas…</p>;
  if (error) return <p className="admin-reviews__empty">{error}</p>;
  if (!reviews.length) return <p className="admin-reviews__empty">No hay reseñas todavía.</p>;
  return <section className="admin-reviews"><h2>Moderación de reseñas</h2><p>Oculta contenido inapropiado o deja una respuesta editorial.</p>{reviews.map((review) => <article key={review.id} className="admin-reviews__item"><div><strong>{review.user.nombre || 'Viajero'}</strong><span>{' · '}{review.rating}/5 · {review.status === 'hidden' ? 'Oculta' : 'Publicada'}</span><p>{review.comment}</p></div><textarea className="ui-input" rows={2} value={reply[review.id] ?? review.adminResponse ?? ''} placeholder="Respuesta editorial (opcional)" onChange={(event) => setReply((current) => ({ ...current, [review.id]: event.target.value }))} /><div className="admin-reviews__actions"><button type="button" className="btn-pill" onClick={() => save(review, 'published')}><MessageSquare className="icon-sm" /> Guardar respuesta</button><button type="button" className="btn-pill" onClick={() => save(review, review.status === 'hidden' ? 'published' : 'hidden')}>{review.status === 'hidden' ? <Eye className="icon-sm" /> : <EyeOff className="icon-sm" />}{review.status === 'hidden' ? ' Publicar' : ' Ocultar'}</button></div></article>)}</section>;
}
