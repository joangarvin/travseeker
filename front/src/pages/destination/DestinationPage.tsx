import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BedDouble,
  BookmarkPlus,
  Check,
  ExternalLink,
  GitCompare,
  Heart,
  Map,
  MapPin,
  Share2,
  Star,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth, useCompare } from '../../contexts';
import {
  distanceLabel,
  excerptAtWord,
  haversineDistanceKm,
  imageUrl,
  openStreetMapUrl,
  plain,
  safeExternalUrl,
  safeHtml,
  serializeJsonLd,
  validCoordinates,
} from '../../utils';
import type { CollectionSummary, Destino, EssentialItem, Review, ReviewStats } from '../../types';
import { Button, Field, Loader, MediaImage, Notice } from '../../components/ui';
import { BudgetEstimator } from '../../components/BudgetEstimator';
import { FormattedContent } from '../../components/FormattedContent';
import { PageMeta, Shell } from '../../components/layout';
import { DestinationCard } from '../../features/destinations/components/DestinationCard';
import { EssentialRoute } from '../../features/destinations/components/EssentialRoute';
import { DestinationTripDialog } from '../../features/destinations/components/DestinationTripDialog';
import { TourismMarks } from '../../features/tourism/tourism';
import { ActivityMarks, activityValues } from '../../features/activities/activities';
import { ClimateSection } from '../../features/climate/components/ClimateSection';

const monthNames = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

const reviewDateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function DestinationSchema({ destino }: { destino: Destino }) {
  const coordinates = validCoordinates(destino.latitud, destino.longitud);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: destino.nombre.trim(),
    description: plain(destino.descripcion),
    image: destino.imagen ? imageUrl(destino.imagen) : undefined,
    geo: coordinates
      ? {
          '@type': 'GeoCoordinates',
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        }
      : undefined,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

function reviewAuthor(review: Review) {
  return (
    [review.user?.nombre, review.user?.apellidos].filter(Boolean).join(' ').trim() ||
    'Viajero de TravSeeker'
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toLocaleUpperCase('es');
}

export default function DestinationPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const compare = useCompare();
  const [destino, setDestino] = useState<Destino | null>(null);
  const [related, setRelated] = useState<Destino[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats>({});
  const [favorite, setFavorite] = useState(false);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [tripDialogItem, setTripDialogItem] = useState<EssentialItem | null | undefined>(undefined);
  const [selectedBaseMunicipioId, setSelectedBaseMunicipioId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState('');
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [collectionsError, setCollectionsError] = useState('');
  const [favoritePending, setFavoritePending] = useState(false);
  const [favoriteError, setFavoriteError] = useState('');
  const [favoriteFeedback, setFavoriteFeedback] = useState('');
  const [tripFeedback, setTripFeedback] = useState('');
  const [compareError, setCompareError] = useState('');
  const [sharePending, setSharePending] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewPending, setReviewPending] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewConfirmation, setReviewConfirmation] = useState('');
  const [visibleReviewCount, setVisibleReviewCount] = useState(3);
  const [basesExpanded, setBasesExpanded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    window.scrollTo(0, 0);
    setLoading(true);
    setError('');
    setDestino(null);
    setSelectedBaseMunicipioId(undefined);
    setBasesExpanded(false);
    void api<Destino>(`/destinos/${id}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setDestino(data);
          setSelectedBaseMunicipioId(data.municipios?.[0]?.id);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : 'No se pudo abrir este destino');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id]);

  const loadRelated = async (signal?: AbortSignal) => {
    setRelatedLoading(true);
    setRelatedError('');
    try {
      const data = await api<Destino[]>(`/destinos/${id}/relacionados`, { signal });
      if (!signal?.aborted) setRelated(data.slice(0, 3));
    } catch (cause) {
      if (!signal?.aborted) {
        setRelatedError(
          cause instanceof Error ? cause.message : 'No se pudieron cargar las recomendaciones',
        );
      }
    } finally {
      if (!signal?.aborted) setRelatedLoading(false);
    }
  };

  const loadReviews = async (signal?: AbortSignal) => {
    setReviewsLoading(true);
    setReviewsError('');
    try {
      const data = await api<{ reviews: Review[]; stats: ReviewStats }>(`/destinos/${id}/reviews`, {
        signal,
      });
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
  };

  const loadCollections = async (signal?: AbortSignal) => {
    if (!token) return;
    setCollectionsLoading(true);
    setCollectionsError('');
    try {
      const data = await api<CollectionSummary[]>('/colecciones', { signal }, token);
      if (!signal?.aborted) setCollections(data);
    } catch (cause) {
      if (!signal?.aborted) {
        setCollectionsError(
          cause instanceof Error ? cause.message : 'No se pudieron cargar tus viajes',
        );
      }
    } finally {
      if (!signal?.aborted) setCollectionsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setRelated([]);
    setReviews([]);
    setReviewStats({});
    setVisibleReviewCount(3);
    void loadRelated(controller.signal);
    void loadReviews(controller.signal);
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    setCollections([]);
    setFavorite(false);
    setCollectionsError('');
    setFavoriteError('');
    if (!token) return () => controller.abort();

    void loadCollections(controller.signal);
    void api<{ isFavorite: boolean }>(
      `/favoritos/check/${id}`,
      { signal: controller.signal },
      token,
    )
      .then((data) => {
        if (!controller.signal.aborted) setFavorite(data.isFavorite);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setFavoriteError(
            cause instanceof Error ? cause.message : 'No se pudo comprobar el guardado',
          );
        }
      });
    return () => controller.abort();
  }, [id, token]);

  const toggleFavorite = async () => {
    if (!token) return;
    setFavoritePending(true);
    setFavoriteError('');
    setFavoriteFeedback('');
    try {
      await api(`/favoritos/${id}`, { method: favorite ? 'DELETE' : 'POST' }, token);
      setFavorite((value) => !value);
      setFavoriteFeedback(favorite ? 'Destino retirado de guardados.' : 'Destino guardado.');
    } catch (cause) {
      setFavoriteError(
        cause instanceof Error ? cause.message : 'No se pudo actualizar el guardado',
      );
    } finally {
      setFavoritePending(false);
    }
  };

  const toggleComparison = () => {
    setCompareError('');
    if (!compare.toggle(id)) setCompareError('Puedes comparar un máximo de cuatro destinos.');
  };

  const shareDestination = async () => {
    setSharePending(true);
    setShareError('');
    setShareFeedback('');
    const url = window.location.href;
    const shareData = {
      title: destino?.nombre.trim() || 'TravSeeker',
      text: destino ? `Descubre ${destino.nombre.trim()} en TravSeeker` : undefined,
      url,
    };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setShareFeedback('Destino compartido.');
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback('Enlace copiado.');
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback('Enlace copiado.');
      } catch {
        setShareError('No se pudo compartir. Copia la dirección desde el navegador.');
      }
    } finally {
      setSharePending(false);
    }
  };

  const submitReview = async (event: React.FormEvent) => {
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

  const returnToDiscovery = () => {
    const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
    if (returnTo?.startsWith('/')) {
      navigate(returnTo);
    } else if (Number(window.history.state?.idx) > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <Shell>
        <Loader label="Abriendo el destino" />
      </Shell>
    );
  }

  if (!destino || error) {
    return (
      <Shell>
        <section className="status-page">
          <div>
            <h1>Destino no disponible</h1>
            <Notice tone="error">{error || 'Este destino no existe'}</Notice>
            <Button variant="secondary" onClick={returnToDiscovery}>
              <ArrowLeft aria-hidden="true" /> Volver
            </Button>
          </div>
        </section>
      </Shell>
    );
  }

  const coordinates = validCoordinates(destino.latitud, destino.longitud);
  const lead =
    excerptAtWord(plain(destino.descripcion), 190) ||
    `Información práctica para decidir si ${destino.nombre.trim()} encaja en tu viaje.`;
  const budget = plain(destino.presupuesto) || 'Consulta las bases disponibles';
  const crowd = plain(destino.masificacion) || 'Sin estimación publicada';
  const tripType = plain(destino.tipoTurismoPrincipal) || 'Sin clasificar';
  const hasReviews = (reviewStats.count || reviews.length) > 0;
  const reviewCount = reviewStats.count || reviews.length;
  const average = reviewStats.average || 0;
  const destinationMapUrl = coordinates ? openStreetMapUrl(coordinates) : null;
  const loginState = { returnTo: location.pathname + location.search };
  const selectedBase =
    destino.municipios?.find((municipio) => municipio.id === selectedBaseMunicipioId) ||
    destino.municipios?.[0];
  const alternativeBases = destino.municipios?.filter(
    (municipio) => municipio.id !== selectedBase?.id,
  );
  const visibleAlternativeBases = basesExpanded ? alternativeBases : alternativeBases?.slice(0, 3);

  return (
    <Shell>
      <DestinationSchema destino={destino} />
      <PageMeta title={`${destino.nombre.trim()} — TravSeeker`} description={lead} />

      <header className="destination-cover">
        <div className="destination-cover__composition">
          <div className="destination-cover__media">
            <MediaImage
              src={imageUrl(destino.imagen)}
              alt={`Vista principal de ${destino.nombre.trim()}`}
              fetchPriority="high"
              loading="eager"
              sizes="100vw"
              width={1920}
              height={1080}
            />
            <div className="destination-cover__shade" aria-hidden="true" />
            <div className="destination-cover__topline">
              <button type="button" className="destination-cover__back" onClick={returnToDiscovery}>
                <ArrowLeft aria-hidden="true" /> Volver a descubrir
              </button>
              <nav aria-label="Migas de pan">
                <Link to="/">Descubrir</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{destino.nombre.trim()}</span>
              </nav>
            </div>
            <div className="destination-cover__content">
              <p className="destination-cover__location">
                <MapPin aria-hidden="true" /> {plain(destino.ubicacion) || 'España'}
              </p>
              <h1>{destino.nombre.trim()}</h1>
              <p className="destination-cover__lead">{lead}</p>
              {hasReviews && (
                <a className="destination-cover__rating" href="#opiniones">
                  <Star aria-hidden="true" />{' '}
                  {average.toLocaleString('es-ES', { maximumFractionDigits: 1 })} de 5 ·{' '}
                  {reviewCount} {reviewCount === 1 ? 'opinión' : 'opiniones'}
                </a>
              )}
            </div>
          </div>

          <div className="departure-card">
            <dl aria-label="Datos clave para decidir">
              <div>
                <dt>Presupuesto</dt>
                <dd>{budget}</dd>
              </div>
              <div>
                <dt>Afluencia</dt>
                <dd>{crowd}</dd>
              </div>
              <div>
                <dt>Tipo de viaje</dt>
                <dd>{tripType}</dd>
              </div>
            </dl>
            <div className="departure-card__planning">
              {user ? (
                <Button onClick={() => setTripDialogItem(null)}>
                  <BookmarkPlus aria-hidden="true" /> Añadir a un viaje
                </Button>
              ) : (
                <Link className="button button--primary" to="/auth" state={loginState}>
                  <BookmarkPlus aria-hidden="true" /> Añadir a un viaje
                </Link>
              )}
              <div className="departure-card__secondary" aria-label="Otras acciones">
                {user ? (
                  <Button
                    variant="secondary"
                    loading={favoritePending}
                    onClick={() => void toggleFavorite()}
                  >
                    {favorite ? <Check aria-hidden="true" /> : <Heart aria-hidden="true" />}
                    {favorite ? 'Guardado' : 'Guardar'}
                  </Button>
                ) : (
                  <Link className="button button--secondary" to="/auth" state={loginState}>
                    <Heart aria-hidden="true" /> Guardar
                  </Link>
                )}
                <Button
                  variant="secondary"
                  aria-pressed={compare.ids.includes(id)}
                  onClick={toggleComparison}
                >
                  <GitCompare aria-hidden="true" />
                  {compare.ids.includes(id) ? 'Comparando' : 'Comparar'}
                </Button>
                <Button
                  variant="secondary"
                  loading={sharePending}
                  onClick={() => void shareDestination()}
                >
                  <Share2 aria-hidden="true" /> Compartir
                </Button>
              </div>
            </div>
            <div className="departure-card__feedback" aria-live="polite">
              {favoriteError && <Notice tone="error">{favoriteError}</Notice>}
              {favoriteFeedback && <Notice tone="success">{favoriteFeedback}</Notice>}
              {tripFeedback && <Notice tone="success">{tripFeedback}</Notice>}
              {compareError && <Notice tone="error">{compareError}</Notice>}
              {shareError && <Notice tone="error">{shareError}</Notice>}
              {shareFeedback && <Notice tone="success">{shareFeedback}</Notice>}
            </div>
          </div>
        </div>
      </header>

      <nav className="destination-nav" aria-label="En esta guía">
        <div>
          <a href="#resumen">Resumen</a>
          <a href="#cuando-ir">Cuándo ir</a>
          {(destino.essentialGroups?.some((group) => group.items?.length) ||
            plain(destino.imprescindibles)) && <a href="#imprescindibles">Imprescindibles</a>}
          {!!destino.municipios?.length && <a href="#bases">Bases</a>}
          <a href="#opiniones">Opiniones</a>
        </div>
      </nav>

      <main className="destination-guide">
        <section id="resumen" className="destination-summary" aria-labelledby="summary-title">
          <div className="destination-section-heading">
            <p className="kicker">La decisión rápida</p>
            <h2 id="summary-title">¿Encaja contigo?</h2>
          </div>
          <div className="destination-summary__layout">
            <div className="destination-summary__story">
              <h3>La experiencia</h3>
              {plain(destino.descripcion) ? (
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: safeHtml(destino.descripcion) }}
                />
              ) : (
                <p className="destination-empty-copy">
                  La descripción editorial todavía no está disponible. Usa las señales prácticas y
                  el clima para decidir.
                </p>
              )}
            </div>
            <aside className="destination-summary__decision" aria-label="Señales para decidir">
              <p className="destination-summary__decision-title">Tu trip brief</p>
              <dl>
                <div>
                  <dt>Encaja si buscas</dt>
                  <dd>
                    <TourismMarks value={destino.tipoTurismoPrincipal} compact />
                  </dd>
                </div>
                <div>
                  <dt>El plan toma forma con</dt>
                  <dd>
                    {activityValues(destino.tipoTurismoSecundario).length ? (
                      <ActivityMarks value={destino.tipoTurismoSecundario} />
                    ) : (
                      'La guía aún no ha clasificado actividades concretas.'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Ritmo y gasto</dt>
                  <dd>
                    {crowd} · {budget}
                  </dd>
                </div>
                <div>
                  <dt>Cómo organizarlo</dt>
                  <dd>
                    {destino.municipios?.length
                      ? `${destino.municipios.length} ${destino.municipios.length === 1 ? 'base disponible' : 'bases para elegir y comparar'}`
                      : 'Explora el destino sin una base publicada todavía.'}
                  </dd>
                </div>
              </dl>
              {destinationMapUrl && (
                <a href={destinationMapUrl} target="_blank" rel="noreferrer">
                  <Map aria-hidden="true" /> Situar el destino en el mapa
                </a>
              )}
            </aside>
          </div>
        </section>

        <section id="cuando-ir" className="season-section" aria-labelledby="when-to-go-heading">
          <ClimateSection destinationId={destino.id} hasValidCoordinates={Boolean(coordinates)} />
        </section>

        <div id="imprescindibles" className="destination-anchor">
          <EssentialRoute
            groups={destino.essentialGroups}
            legacyHtml={destino.imprescindibles}
            authenticated={Boolean(user)}
            onAddToTrip={(item) => setTripDialogItem(item)}
          />
        </div>

        {!!destino.municipios?.length && (
          <section id="bases" className="municipalities" aria-labelledby="bases-title">
            <div className="destination-section-heading">
              <p className="kicker">Dónde hacer base</p>
              <h2 id="bases-title">Elige una base práctica</h2>
              <p>
                Compara el coste orientativo y las conexiones. La base elegida se aplica al cálculo
                de presupuesto.
              </p>
            </div>
            <div className="planning-workbench">
              <div className="municipalities__chooser">
                <label htmlFor="destination-base-selector">Base del viaje</label>
                <select
                  id="destination-base-selector"
                  value={selectedBase?.id}
                  onChange={(event) => setSelectedBaseMunicipioId(event.target.value)}
                >
                  {destino.municipios.map((municipio) => (
                    <option key={municipio.id} value={municipio.id}>
                      {municipio.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {selectedBase &&
                (() => {
                  const municipioCoordinates = validCoordinates(
                    selectedBase.latitud,
                    selectedBase.longitud,
                  );
                  return (
                    <article className="municipalities__selected-base">
                      <div className="municipalities__selected-heading">
                        <div>
                          <p>
                            <Check aria-hidden="true" /> Base seleccionada
                          </p>
                          <h3>{selectedBase.nombre}</h3>
                        </div>
                        {municipioCoordinates && (
                          <a
                            href={openStreetMapUrl(municipioCoordinates, 14)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Ver en el mapa <ExternalLink aria-hidden="true" />
                          </a>
                        )}
                      </div>
                      <dl>
                        <div>
                          <dt>
                            <BedDouble aria-hidden="true" /> Precio orientativo/noche
                          </dt>
                          <dd>
                            {plain(selectedBase.precios) ? (
                              <FormattedContent content={selectedBase.precios} asPlaintext />
                            ) : (
                              'Sin precio publicado'
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>
                            <MapPin aria-hidden="true" /> Conexiones
                          </dt>
                          <dd>
                            {plain(selectedBase.conexiones) ? (
                              <FormattedContent content={selectedBase.conexiones} asPlaintext />
                            ) : (
                              'Sin detalle de conexiones'
                            )}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  );
                })()}

              {!!visibleAlternativeBases?.length && (
                <div className="municipalities__alternatives">
                  <p>Otras bases</p>
                  <ul>
                    {visibleAlternativeBases.map((municipio) => (
                      <li key={municipio.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedBaseMunicipioId(municipio.id)}
                        >
                          <span>{municipio.nombre}</span>
                          <small>
                            {excerptAtWord(plain(municipio.precios), 62) || 'Precio por confirmar'}
                          </small>
                          <span aria-hidden="true">Elegir</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {(alternativeBases?.length || 0) > 3 && (
                    <Button variant="secondary" onClick={() => setBasesExpanded((value) => !value)}>
                      {basesExpanded
                        ? 'Ver menos bases'
                        : `Ver las ${alternativeBases?.length} alternativas`}
                    </Button>
                  )}
                </div>
              )}

              <BudgetEstimator
                municipios={destino.municipios}
                defaultMunicipioId={selectedBaseMunicipioId}
                showMunicipioControl={false}
              />
            </div>
          </section>
        )}

        {!!destino.places?.length && (
          <section className="nearby" aria-labelledby="nearby-title">
            <div className="destination-section-heading">
              <p className="kicker">Amplía el viaje</p>
              <h2 id="nearby-title">Lugares alrededor</h2>
            </div>
            <div className="nearby__list">
              {destino.places.map((place) => {
                const placeCoordinates = validCoordinates(place.latitud, place.longitud);
                const website = safeExternalUrl(place.website);
                const distance =
                  coordinates && placeCoordinates
                    ? haversineDistanceKm(coordinates, placeCoordinates)
                    : null;
                return (
                  <article id={`place-${place.id}`} key={place.id}>
                    <div className="nearby__meta">
                      <span>{place.categoria}</span>
                      {distance != null && <span>A {distanceLabel(distance)} en línea recta</span>}
                    </div>
                    <div>
                      <h3>{place.nombre}</h3>
                      {place.descripcion && <p>{place.descripcion}</p>}
                    </div>
                    <div className="nearby__actions">
                      {placeCoordinates && (
                        <a
                          href={openStreetMapUrl(placeCoordinates, 15)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Ver en el mapa <Map aria-hidden="true" />
                        </a>
                      )}
                      {website && (
                        <a href={website} target="_blank" rel="noreferrer">
                          Web oficial <ExternalLink aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section id="opiniones" className="reviews" aria-labelledby="reviews-title">
          <header className="reviews__heading">
            <div className="destination-section-heading">
              <p className="kicker">Experiencias reales</p>
              <h2 id="reviews-title">Opiniones de viajeros</h2>
            </div>
            {hasReviews ? (
              <div
                className="reviews__score"
                aria-label={`${average} de 5, ${reviewCount} ${reviewCount === 1 ? 'opinión' : 'opiniones'}`}
              >
                <Star aria-hidden="true" />
                <strong>
                  {average.toLocaleString('es-ES', { maximumFractionDigits: 1 })} de 5
                </strong>
                <span>
                  {reviewCount} {reviewCount === 1 ? 'opinión publicada' : 'opiniones publicadas'}
                </span>
              </div>
            ) : (
              <p className="reviews__no-score">Todavía no hay una valoración pública.</p>
            )}
          </header>

          {hasReviews && reviewStats.distribution && (
            <div className="reviews__distribution" aria-label="Distribución de valoraciones">
              {[5, 4, 3, 2, 1].map((value) => {
                const count = reviewStats.distribution?.[value as 1 | 2 | 3 | 4 | 5] || 0;
                return (
                  <div key={value}>
                    <span>{value} estrellas</span>
                    <progress
                      max={reviewCount}
                      value={count}
                      aria-label={`${value} estrellas: ${count} opiniones`}
                    />
                    <b>{count}</b>
                  </div>
                );
              })}
            </div>
          )}

          {reviewsError ? (
            <Notice
              tone="error"
              action={
                <button type="button" onClick={() => void loadReviews()}>
                  Reintentar
                </button>
              }
            >
              {reviewsError}
            </Notice>
          ) : reviewsLoading ? (
            <Loader label="Cargando opiniones" />
          ) : reviews.length ? (
            <>
              <div className="reviews__list">
                {reviews.slice(0, visibleReviewCount).map((review) => {
                  const author = reviewAuthor(review);
                  return (
                    <article className="review" key={review.id}>
                      <header>
                        {review.user?.avatarUrl ? (
                          <MediaImage
                            className="review__avatar"
                            src={imageUrl(review.user.avatarUrl)}
                            alt=""
                            loading="lazy"
                          />
                        ) : (
                          <span className="review__avatar-fallback" aria-hidden="true">
                            {initials(author)}
                          </span>
                        )}
                        <div>
                          <h3>{author}</h3>
                          <p>
                            <time dateTime={review.createdAt}>
                              {reviewDateFormatter.format(new Date(review.createdAt))}
                            </time>
                            {review.visitMonth &&
                              ` · Viajó en ${monthNames[review.visitMonth - 1]}`}
                          </p>
                        </div>
                        <span
                          className="review__rating"
                          aria-label={`${review.rating} de 5 estrellas`}
                        >
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={index}
                              className={index < review.rating ? 'is-filled' : ''}
                              aria-hidden="true"
                            />
                          ))}
                        </span>
                      </header>
                      <p className="review__comment">
                        {review.comment || 'Valoración sin comentario.'}
                      </p>
                      {review.adminResponse && (
                        <aside
                          className="review__response"
                          aria-label="Respuesta oficial de TravSeeker"
                        >
                          <strong>Respuesta oficial</strong>
                          <p>{review.adminResponse}</p>
                        </aside>
                      )}
                    </article>
                  );
                })}
              </div>
              {visibleReviewCount < reviews.length && (
                <Button
                  className="reviews__more"
                  variant="secondary"
                  onClick={() => setVisibleReviewCount((value) => value + 3)}
                >
                  Ver más opiniones
                </Button>
              )}
            </>
          ) : (
            <div className="reviews__empty">
              <h3>Sé la primera persona en contarlo</h3>
              <p>Una experiencia concreta puede ayudar a otra persona a decidir mejor.</p>
            </div>
          )}

          {user ? (
            <form className="review-form" onSubmit={submitReview}>
              <div>
                <h3>Cuenta cómo fue</h3>
                <p>
                  Revisamos cada reseña antes de publicarla. Tu envío quedará pendiente y no
                  cambiará la valoración pública inmediatamente.
                </p>
              </div>
              <fieldset className="review-rating">
                <legend>Tu puntuación</legend>
                <div>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="rating"
                        value={value}
                        checked={rating === value}
                        onChange={() => setRating(value)}
                      />
                      <Star aria-hidden="true" />
                      <span className="sr-only">
                        {value} {value === 1 ? 'estrella' : 'estrellas'}
                      </span>
                    </label>
                  ))}
                </div>
                <p aria-live="polite">{rating} de 5 estrellas</p>
              </fieldset>
              <Field label="Tu experiencia" htmlFor="review">
                <textarea
                  id="review"
                  value={comment}
                  onChange={(event) => {
                    setComment(event.target.value);
                    setReviewError('');
                    setReviewConfirmation('');
                  }}
                  minLength={20}
                  maxLength={1000}
                  required
                  placeholder="¿Qué te ayudó a disfrutar el destino y qué conviene saber antes de ir?"
                  aria-describedby="review-counter"
                />
              </Field>
              <p id="review-counter" className="review-form__counter">
                {comment.length}/1000 caracteres · mínimo 20
              </p>
              {reviewError && <Notice tone="error">{reviewError}</Notice>}
              {reviewConfirmation && <Notice tone="success">{reviewConfirmation}</Notice>}
              <Button type="submit" loading={reviewPending}>
                Enviar para revisión
              </Button>
            </form>
          ) : (
            <p className="reviews__login">
              <Link to="/auth" state={loginState}>
                Entra para compartir tu experiencia
              </Link>
              . La reseña se revisará antes de publicarse.
            </p>
          )}
        </section>

        <section className="related" aria-labelledby="related-title">
          <div className="destination-section-heading">
            <p className="kicker">Sigue explorando</p>
            <h2 id="related-title">Otros destinos que pueden encajar</h2>
          </div>
          {relatedError ? (
            <Notice
              tone="error"
              action={
                <button type="button" onClick={() => void loadRelated()}>
                  Reintentar
                </button>
              }
            >
              {relatedError}
            </Notice>
          ) : relatedLoading ? (
            <Loader label="Buscando destinos relacionados" />
          ) : related.length ? (
            <div className="destination-list">
              {related.slice(0, 3).map((item, index) => (
                <DestinationCard key={item.id} destino={item} index={index} imageLoading="eager" />
              ))}
            </div>
          ) : (
            <p className="destination-empty-copy">
              No hay recomendaciones relacionadas publicadas por ahora.
            </p>
          )}
        </section>
      </main>

      {tripDialogItem !== undefined && token && (
        <DestinationTripDialog
          destination={destino}
          collections={collections}
          collectionsLoading={collectionsLoading}
          collectionsError={collectionsError}
          token={token}
          plannedItem={tripDialogItem}
          defaultMunicipioId={selectedBaseMunicipioId}
          onRetryCollections={() => void loadCollections()}
          onClose={() => setTripDialogItem(undefined)}
          onAdded={(message) => {
            setTripFeedback(message);
            void loadCollections();
          }}
        />
      )}
    </Shell>
  );
}
