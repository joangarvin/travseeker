import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  BookmarkPlus,
  Check,
  ExternalLink,
  GitCompare,
  Heart,
  MapPin,
  Star,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth, useCompare } from '../../contexts';
import { imageUrl, plain, safeHtml } from '../../utils';
import type { CollectionSummary, Destino, Review } from '../../types';
import { Button, Field, Loader, MediaImage, Notice } from '../../components/ui';
import { BudgetEstimator } from '../../components/BudgetEstimator';
import { FormattedContent } from '../../components/FormattedContent';
import { PageMeta, Shell } from '../../components/layout';
import { DestinationCard } from '../../features/destinations/components/DestinationCard';
import { EssentialRoute } from '../../features/destinations/components/EssentialRoute';
import { TourismMark, TourismMarks } from '../../features/tourism/tourism';
import { ActivityMarks, activityValues } from '../../features/activities/activities';

function DestinationSchema({ destino }: { destino: Destino }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destino.nombre.trim(),
    description: plain(destino.descripcion),
    image: destino.imagen ? imageUrl(destino.imagen) : undefined,
    geo: destino.latitud != null && destino.longitud != null
      ? { '@type': 'GeoCoordinates', latitude: destino.latitud, longitude: destino.longitud }
      : undefined,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

export default function DestinationPage() {
  const { id = '' } = useParams();
  const { user, token } = useAuth();
  const compare = useCompare();
  const [destino, setDestino] = useState<Destino | null>(null);
  const [related, setRelated] = useState<Destino[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<{ average?: number; count?: number }>({});
  const [favorite, setFavorite] = useState(false);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [data, rel, reviewData] = await Promise.all([
        api<Destino>(`/destinos/${id}`),
        api<Destino[]>(`/destinos/${id}/relacionados`),
        api<{ reviews: Review[]; stats: { average?: number; count?: number } }>(
          `/destinos/${id}/reviews`,
        ),
      ]);
      setDestino(data);
      setRelated(rel);
      setReviews(reviewData.reviews);
      setReviewStats(reviewData.stats);
      if (token) {
        const [fav, cols] = await Promise.all([
          api<{ isFavorite: boolean }>(`/favoritos/check/${id}`, {}, token),
          api<CollectionSummary[]>('/colecciones', {}, token),
        ]);
        setFavorite(fav.isFavorite);
        setCollections(cols);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo abrir este destino');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    window.scrollTo(0, 0);
    void load();
  }, [id, token]);

  const season = useMemo(
    () =>
      destino
        ? ([
            ['Noviembre — abril', destino.mesesNovAbril],
            ['Mayo — junio / septiembre — octubre', destino.mesesMayJunSeptOct],
            ['Julio — agosto', destino.mesesJulioAgosto],
          ] as const)
        : [],
    [destino],
  );

  const toggleFavorite = async () => {
    if (!token) return;
    setActionPending(true);
    setActionError('');
    try {
      await api(`/favoritos/${id}`, { method: favorite ? 'DELETE' : 'POST' }, token);
      setFavorite((value) => !value);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'No se pudo actualizar el guardado');
    } finally {
      setActionPending(false);
    }
  };
  const addToCollection = async (collectionId: string) => {
    if (!token) return;
    setActionPending(true);
    setActionError('');
    try {
      await api(
        `/colecciones/${collectionId}/items`,
        { method: 'POST', body: JSON.stringify({ destinoId: id }) },
        token,
      );
      setCollectionOpen(false);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'No se pudo añadir al viaje');
    } finally {
      setActionPending(false);
    }
  };
  const submitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    setActionPending(true);
    setActionError('');
    try {
      await api(
        `/destinos/${id}/reviews`,
        { method: 'POST', body: JSON.stringify({ rating, comment }) },
        token,
      );
      setComment('');
      await load();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'No se pudo publicar la reseña');
    } finally {
      setActionPending(false);
    }
  };

  if (loading)
    return (
      <Shell>
        <Loader label="Abriendo el destino" />
      </Shell>
    );
  if (!destino || error)
    return (
      <Shell>
        <section className="status-page">
          <div>
            <h1>Destino no disponible</h1>
            <Notice tone="error">{error || 'Este destino no existe'}</Notice>
            <Link className="button button--secondary" to="/">
              <ArrowLeft /> Volver
            </Link>
          </div>
        </section>
      </Shell>
    );

  return (
    <Shell>
      <DestinationSchema destino={destino} />
      <PageMeta
        title={`${destino.nombre.trim()} — TravSeeker`}
        description={plain(destino.descripcion) || `Descubre ${destino.nombre.trim()} con información práctica para decidir tu viaje.`}
      />
      <section className="destination-hero">
        <MediaImage src={imageUrl(destino.imagen)} alt={destino.nombre} fetchPriority="high" />
        <div className="destination-hero__shade" />
        <Link className="destination-hero__back" to="/">
          <ArrowLeft /> Volver a descubrir
        </Link>
        <div className="destination-hero__content">
          <p>{plain(destino.ubicacion)}</p>
          <h1>{destino.nombre.trim()}</h1>
          <div>
            <span>{plain(destino.presupuesto)}</span>
            <span>{plain(destino.masificacion)}</span>
            <TourismMark value={destino.tipoTurismoPrincipal} />
          </div>
        </div>
      </section>

      <div className="destination-actions">
        {user ? (
          <Button
            variant={favorite ? 'primary' : 'secondary'}
            loading={actionPending}
            onClick={() => void toggleFavorite()}
          >
            {favorite ? <Check /> : <Heart />} {favorite ? 'Guardado' : 'Guardar'}
          </Button>
        ) : (
          <Link className="button button--secondary" to="/auth">
            <Heart /> Guardar
          </Link>
        )}
        <Button
          variant={compare.ids.includes(id) ? 'primary' : 'secondary'}
          onClick={() => {
            if (!compare.toggle(id)) setActionError('Puedes comparar un máximo de cuatro destinos');
          }}
        >
          <GitCompare /> {compare.ids.includes(id) ? 'En comparación' : 'Comparar'}
        </Button>
        {user && (
          <Button variant="secondary" disabled={actionPending} onClick={() => setCollectionOpen(true)}>
            <BookmarkPlus /> Añadir a un viaje
          </Button>
        )}
      </div>
      {actionError && <div className="destination-action-feedback"><Notice tone="error">{actionError}</Notice></div>}

      <article className="destination-story">
        <aside className="destination-story__summary">
          <p className="kicker">La decisión rápida</p>
          <dl>
            <div>
              <dt>Presupuesto</dt>
              <dd>{plain(destino.presupuesto)}</dd>
            </div>
            <div>
              <dt>Afluencia</dt>
              <dd>{plain(destino.masificacion)}</dd>
            </div>
            <div>
              <dt>Tipos de viaje</dt>
              <dd>
                <TourismMarks value={destino.tipoTurismoPrincipal} compact />
              </dd>
            </div>
            {activityValues(destino.tipoTurismoSecundario).length > 0 && (
              <div>
                <dt>Actividades</dt>
                <dd>
                  <ActivityMarks value={destino.tipoTurismoSecundario} />
                </dd>
              </div>
            )}
            <div>
              <dt>Municipios</dt>
              <dd>{destino.municipios?.length || 0}</dd>
            </div>
          </dl>
        </aside>
        <div className="destination-story__body">
          <p className="kicker">Por qué ir</p>
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: safeHtml(destino.descripcion) }}
          />
        </div>
      </article>

      <section className="season-section">
        <header>
          <p className="kicker">El momento importa</p>
          <h2>Cuándo encontrarás el destino que buscas</h2>
        </header>
        <div className="season-bars">
          {season.map(([label, value]) => (
            <div key={label}>
              <div>
                <span>{label}</span>
                <b>{value}% de afluencia</b>
              </div>
              <progress value={value} max="100" aria-label={`${label}: ${value}% de afluencia`} />
            </div>
          ))}
        </div>
      </section>

      <EssentialRoute groups={destino.essentialGroups} legacyHtml={destino.imprescindibles} />

      {!!destino.municipios?.length && (
        <section className="municipalities">
          <header>
            <p className="kicker">Dónde hacer base</p>
            <h2>Municipios y conexiones</h2>
          </header>
          <div>
            {destino.municipios.map((municipio, index) => (
              <article key={municipio.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{municipio.nombre}</h3>
                  <p>
                    <BedDouble /> <FormattedContent content={municipio.precios} asPlaintext />
                  </p>
                  <p>
                    <MapPin /> <FormattedContent content={municipio.conexiones} asPlaintext />
                  </p>
                </div>
              </article>
            ))}
          </div>
          <BudgetEstimator municipios={destino.municipios} />
        </section>
      )}

      {!!destino.places?.length && (
        <section className="nearby">
          <header>
            <p className="kicker">Amplía el viaje</p>
            <h2>Lugares cerca</h2>
          </header>
          <div>
            {destino.places.map((place) => (
              <article id={`place-${place.id}`} key={place.id}>
                <span>{place.categoria}</span>
                <h3>{place.nombre}</h3>
                {place.descripcion && <p>{place.descripcion}</p>}
                {place.website && (
                  <a href={place.website} target="_blank" rel="noreferrer">
                    Más información <ExternalLink />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="reviews">
        <header>
          <div>
            <h2>Lo que cuentan quienes fueron</h2>
          </div>
          <div className="reviews__score">
            <Star /> <strong>{reviewStats.average || '—'}</strong>
            <span>{reviewStats.count || reviews.length} reseñas</span>
          </div>
        </header>
        <div className="reviews__grid">
          {reviews.map((review) => (
            <blockquote key={review.id}>
              <div>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={i < review.rating ? 'is-filled' : ''} />
                ))}
              </div>
              <p>{review.comment || 'Valoración sin comentario.'}</p>
              <cite>{review.user?.nombre || 'Viajero de TravSeeker'}</cite>
              {review.adminResponse && <small>Respuesta del equipo: {review.adminResponse}</small>}
            </blockquote>
          ))}
        </div>
        {user ? (
          <form className="review-form" onSubmit={submitReview}>
            <h3>Cuenta cómo fue</h3>
            <Field label="Puntuación" htmlFor="rating">
              <select
                id="rating"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>
                    {value} estrellas
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tu experiencia" htmlFor="review">
              <textarea
                id="review"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
              />
            </Field>
            <Button type="submit" loading={actionPending}>Publicar reseña</Button>
          </form>
        ) : (
          <p className="reviews__login">
            <Link to="/auth">Entra para dejar tu reseña</Link>
          </p>
        )}
      </section>

      {!!related.length && (
        <section className="related">
          <header>
            <p className="kicker">Sigue mirando</p>
            <h2>Puede que también encajen</h2>
          </header>
          <div className="destination-list">
            {related.map((item, index) => (
              <DestinationCard key={item.id} destino={item} index={index} />
            ))}
          </div>
        </section>
      )}

      {collectionOpen && (
        <div className="modal-backdrop" onMouseDown={() => setCollectionOpen(false)}>
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="collection-modal-title"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              className="modal__close"
              onClick={() => setCollectionOpen(false)}
              aria-label="Cerrar"
            >
              <ArrowLeft />
            </button>
            <h2 id="collection-modal-title">Añadir a un viaje</h2>
            {collections.length ? (
              <div className="modal__list">
                {collections.map((collection) => (
                  <button key={collection.id} onClick={() => void addToCollection(collection.id)}>
                    <span>{collection.nombre}</span>
                    <small>{collection.count} destinos</small>
                  </button>
                ))}
              </div>
            ) : (
              <p>Aún no tienes viajes. Créalo desde la sección Viajes.</p>
            )}
          </section>
        </div>
      )}
    </Shell>
  );
}
