import { t, intlLocale, locale, languageUrl, catalogName } from '../../i18n';
import { DestinationReviews } from '../../features/destinations/components/DestinationReviews';
import { useDestinationReviews } from '../../features/destinations/hooks/useDestinationReviews';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookmarkPlus,
  Check,
  Compass,
  ExternalLink,
  Gauge,
  GitCompare,
  Heart,
  Map,
  MapPin,
  Share2,
  Star,
  WalletCards,
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
import type { CollectionSummary, Destino, EssentialItem } from '../../types';
import { Button, Loader, MediaImage, Notice } from '../../components/ui';
import { PageMeta, Shell } from '../../components/layout';
import { DestinationCard } from '../../features/destinations/components/DestinationCard';
import { EssentialRoute } from '../../features/destinations/components/EssentialRoute';
import { DestinationTripDialog } from '../../features/destinations/components/DestinationTripDialog';
import { DestinationPlanningSection } from '../../features/destinations/components/DestinationPlanningSection';
import { TourismMarks } from '../../features/tourism/tourism';
import { ActivityMarks, activityValues } from '../../features/activities/activities';
import { ClimateSection } from '../../features/climate/components/ClimateSection';

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

export default function DestinationPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const compare = useCompare();
  const reviewState = useDestinationReviews(id, token);
  const { reviews, reviewStats } = reviewState;
  const [destino, setDestino] = useState<Destino | null>(null);
  const [related, setRelated] = useState<Destino[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [collections, setCollections] = useState<CollectionSummary[]>([]);
  const [tripDialogItem, setTripDialogItem] = useState<EssentialItem | null | undefined>(undefined);
  const [selectedBaseMunicipioId, setSelectedBaseMunicipioId] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState('');
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
          setError(cause instanceof Error ? cause.message : t('No se pudo abrir este destino'));
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
          cause instanceof Error ? cause.message : t('No se pudieron cargar las recomendaciones'),
        );
      }
    } finally {
      if (!signal?.aborted) setRelatedLoading(false);
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
          cause instanceof Error ? cause.message : t('No se pudieron cargar tus viajes'),
        );
      }
    } finally {
      if (!signal?.aborted) setCollectionsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setRelated([]);
    void loadRelated(controller.signal);
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
            cause instanceof Error ? cause.message : t('No se pudo comprobar el guardado'),
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
      setFavoriteFeedback(favorite ? t('Destino retirado de guardados.') : t('Destino guardado.'));
    } catch (cause) {
      setFavoriteError(
        cause instanceof Error ? cause.message : t('No se pudo actualizar el guardado'),
      );
    } finally {
      setFavoritePending(false);
    }
  };

  const toggleComparison = () => {
    setCompareError('');
    if (!compare.toggle(id)) setCompareError(t('Puedes comparar un máximo de cuatro destinos.'));
  };

  const shareDestination = async () => {
    setSharePending(true);
    setShareError('');
    setShareFeedback('');
    const url = languageUrl(locale);
    const shareData = {
      title: destino?.nombre.trim() || 'TravSeeker',
      text: destino ? t('Descubre {0} en TravSeeker', { 0: destino.nombre.trim() }) : undefined,
      url,
    };
    try {
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setShareFeedback(t('Destino compartido.'));
      } else {
        await navigator.clipboard.writeText(url);
        setShareFeedback(t('Enlace copiado.'));
      }
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      try {
        await navigator.clipboard.writeText(url);
        setShareFeedback(t('Enlace copiado.'));
      } catch {
        setShareError(t('No se pudo compartir. Copia la dirección desde el navegador.'));
      }
    } finally {
      setSharePending(false);
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
        <Loader label={t('Abriendo el destino')} />
      </Shell>
    );
  }

  if (!destino || error) {
    return (
      <Shell>
        <section className="status-page">
          <div>
            <h1>{t('Destino no disponible')}</h1>
            <Notice tone="error">{error || t('Este destino no existe')}</Notice>
            <Button variant="secondary" onClick={returnToDiscovery}>
              <ArrowLeft aria-hidden="true" /> {t('Volver')}
            </Button>
          </div>
        </section>
      </Shell>
    );
  }

  const coordinates = validCoordinates(destino.latitud, destino.longitud);
  const lead =
    excerptAtWord(plain(destino.descripcion), 190) ||
    t('Información práctica para decidir si {0} encaja en tu viaje.', { 0: destino.nombre.trim() });
  const budget = plain(destino.presupuesto) || t('Consulta las bases disponibles');
  const crowd = plain(destino.masificacion) || t('Sin estimación publicada');
  const tripType =
    (destino.tourismTypes?.length
      ? destino.tourismTypes.map(catalogName).join(', ')
      : plain(destino.tipoTurismoPrincipal)
          .split(', ')
          .map((name) => t(name))
          .join(', ')) || t('Sin clasificar');
  const hasReviews = (reviewStats.count || reviews.length) > 0;
  const reviewCount = reviewStats.count || reviews.length;
  const average = reviewStats.average || 0;
  const destinationMapUrl = coordinates ? openStreetMapUrl(coordinates) : null;
  const loginState = { returnTo: location.pathname + location.search };
  const destinationNameLength = destino.nombre.trim().length;
  const titleSizeClass =
    destinationNameLength > 34
      ? 'destination-cover__content--title-xl'
      : destinationNameLength > 20
        ? 'destination-cover__content--title-long'
        : '';

  return (
    <Shell>
      <DestinationSchema destino={destino} />
      <PageMeta title={`${destino.nombre.trim()} — TravSeeker`} description={lead} />

      <header className="destination-cover">
        <div className="destination-cover__composition">
          <div className="destination-cover__media">
            <MediaImage
              src={imageUrl(destino.imagen)}
              alt={t('Vista principal de {0}', { 0: destino.nombre.trim() })}
              fetchPriority="high"
              loading="eager"
              sizes="100vw"
              width={1920}
              height={1080}
            />
            <div className="destination-cover__shade" aria-hidden="true" />
            <div className="destination-cover__topline">
              <button type="button" className="destination-cover__back" onClick={returnToDiscovery}>
                <ArrowLeft aria-hidden="true" /> {t('Volver a descubrir')}
              </button>
              <nav aria-label={t('Migas de pan')}>
                <Link to="/">{t('Descubrir')}</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{destino.nombre.trim()}</span>
              </nav>
            </div>
            <div className={`destination-cover__content ${titleSizeClass}`.trim()}>
              <p className="destination-cover__location">
                <MapPin aria-hidden="true" /> {plain(destino.ubicacion) || t('España')}
              </p>
              <h1>{destino.nombre.trim()}</h1>
              <p className="destination-cover__lead">{lead}</p>
              {hasReviews && (
                <a className="destination-cover__rating" href="#opiniones">
                  <Star aria-hidden="true" />{' '}
                  {average.toLocaleString(intlLocale, { maximumFractionDigits: 1 })} {t('de 5 ·')}{' '}
                  {reviewCount} {reviewCount === 1 ? t('opinión') : t('opiniones')}
                </a>
              )}
            </div>
          </div>

          <div className="departure-card">
            <dl aria-label={t('Datos clave para decidir')}>
              <div>
                <dt>{t('Presupuesto')}</dt>
                <dd>{t(budget)}</dd>
              </div>
              <div>
                <dt>{t('Afluencia')}</dt>
                <dd>{t(crowd)}</dd>
              </div>
              <div>
                <dt>{t('Tipo de viaje')}</dt>
                <dd>{t(tripType)}</dd>
              </div>
            </dl>
            <div className="departure-card__planning">
              {user ? (
                <Button onClick={() => setTripDialogItem(null)}>
                  <BookmarkPlus aria-hidden="true" /> {t('Añadir a un viaje')}
                </Button>
              ) : (
                <Link className="button button--primary" to="/auth" state={loginState}>
                  <BookmarkPlus aria-hidden="true" /> {t('Añadir a un viaje')}
                </Link>
              )}
              <div className="departure-card__secondary" aria-label={t('Otras acciones')}>
                {user ? (
                  <Button
                    variant="secondary"
                    loading={favoritePending}
                    onClick={() => void toggleFavorite()}
                  >
                    {favorite ? <Check aria-hidden="true" /> : <Heart aria-hidden="true" />}
                    {favorite ? t('Guardado') : t('Guardar')}
                  </Button>
                ) : (
                  <Link className="button button--secondary" to="/auth" state={loginState}>
                    <Heart aria-hidden="true" /> {t('Guardar')}
                  </Link>
                )}
                <Button
                  variant="secondary"
                  aria-pressed={compare.ids.includes(id)}
                  onClick={toggleComparison}
                >
                  <GitCompare aria-hidden="true" />
                  {compare.ids.includes(id) ? t('Comparando') : t('Comparar')}
                </Button>
                <Button
                  variant="secondary"
                  loading={sharePending}
                  onClick={() => void shareDestination()}
                >
                  <Share2 aria-hidden="true" /> {t('Compartir')}
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

      <nav className="destination-nav" aria-label={t('En esta guía')}>
        <div>
          <a href="#resumen">{t('Resumen')}</a>
          <a href="#cuando-ir">{t('Cuándo ir')}</a>
          {(destino.essentialGroups?.some((group) => group.items?.length) ||
            plain(destino.imprescindibles)) && (
            <a href="#imprescindibles">{t('Imprescindibles')}</a>
          )}
          {!!destino.municipios?.length && <a href="#bases">{t('Bases')}</a>}
          <a href="#opiniones">{t('Opiniones')}</a>
        </div>
      </nav>

      <div className="destination-guide">
        <section
          id="resumen"
          className="destination-summary"
          aria-labelledby="summary-title"
          data-reveal
        >
          <div className="destination-section-heading">
            <p className="kicker">{t('La decisión rápida')}</p>
            <h2 id="summary-title">{t('¿Encaja contigo?')}</h2>
          </div>
          <div className="destination-summary__layout">
            <div className="destination-summary__story">
              <h3>{t('La experiencia')}</h3>
              {plain(destino.descripcion) ? (
                <div
                  className="prose"
                  dangerouslySetInnerHTML={{ __html: safeHtml(destino.descripcion) }}
                />
              ) : (
                <p className="destination-empty-copy">
                  {t(
                    'La descripción editorial todavía no está disponible. Usa las señales prácticas y el clima para decidir.',
                  )}
                </p>
              )}
            </div>
            <aside className="destination-summary__decision" aria-label={t('Señales para decidir')}>
              <p className="destination-summary__decision-title">{t('Tu trip brief')}</p>
              <h3>{t('Buena elección si…')}</h3>
              <dl>
                <div>
                  <span className="destination-summary__signal-icon" aria-hidden="true">
                    <Compass />
                  </span>
                  <dt>{t('Encaja si buscas')}</dt>
                  <dd>
                    <TourismMarks value={destino.tipoTurismoPrincipal} compact />
                  </dd>
                </div>
                <div>
                  <span className="destination-summary__signal-icon" aria-hidden="true">
                    <Map />
                  </span>
                  <dt>{t('El plan toma forma con')}</dt>
                  <dd>
                    {activityValues(destino.tipoTurismoSecundario).length ? (
                      <ActivityMarks value={destino.tipoTurismoSecundario} />
                    ) : (
                      t('La guía aún no ha clasificado actividades concretas.')
                    )}
                  </dd>
                </div>
                <div>
                  <span className="destination-summary__signal-icon" aria-hidden="true">
                    <Gauge />
                  </span>
                  <dt>{t('Ritmo y gasto')}</dt>
                  <dd>
                    {t(crowd)} · {t(budget)}
                  </dd>
                </div>
                <div>
                  <span className="destination-summary__signal-icon" aria-hidden="true">
                    <WalletCards />
                  </span>
                  <dt>{t('Cómo organizarlo')}</dt>
                  <dd>
                    {destino.municipios?.length
                      ? `${destino.municipios.length} ${destino.municipios.length === 1 ? t('base disponible') : t('bases para elegir y comparar')}`
                      : t('Explora el destino sin una base publicada todavía.')}
                  </dd>
                </div>
              </dl>
              {destinationMapUrl && (
                <a href={destinationMapUrl} target="_blank" rel="noreferrer">
                  <Map aria-hidden="true" /> {t('Situar el destino en el mapa')}
                </a>
              )}
            </aside>
          </div>
        </section>

        <section
          id="cuando-ir"
          className="season-section"
          aria-labelledby="when-to-go-heading"
          data-reveal
        >
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

        <DestinationPlanningSection
          destination={destino}
          selectedMunicipioId={selectedBaseMunicipioId}
          alternativesExpanded={basesExpanded}
          onSelectMunicipio={setSelectedBaseMunicipioId}
          onToggleAlternatives={() => setBasesExpanded((value) => !value)}
        />

        {!!destino.places?.length && (
          <section className="nearby" aria-labelledby="nearby-title" data-reveal>
            <div className="destination-section-heading">
              <p className="kicker">{t('Amplía el viaje')}</p>
              <h2 id="nearby-title">{t('Lugares alrededor')}</h2>
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
                      <span>{t(place.categoria)}</span>
                      {distance != null && (
                        <span>
                          {t('A')} {distanceLabel(distance)} {t('en línea recta')}
                        </span>
                      )}
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
                          {t('Ver en el mapa')} <Map aria-hidden="true" />
                        </a>
                      )}
                      {website && (
                        <a href={website} target="_blank" rel="noreferrer">
                          {t('Web oficial')} <ExternalLink aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <DestinationReviews
          reviewState={reviewState}
          authenticated={Boolean(user)}
          loginState={loginState}
        />

        <section className="related" aria-labelledby="related-title">
          <div className="destination-section-heading">
            <p className="kicker">{t('Sigue explorando')}</p>
            <h2 id="related-title">{t('Otros destinos que pueden encajar')}</h2>
          </div>
          {relatedError ? (
            <Notice
              tone="error"
              action={
                <button type="button" onClick={() => void loadRelated()}>
                  {t('Reintentar')}
                </button>
              }
            >
              {relatedError}
            </Notice>
          ) : relatedLoading ? (
            <Loader label={t('Buscando destinos relacionados')} />
          ) : related.length ? (
            <div className="destination-list">
              {related.slice(0, 3).map((item, index) => (
                <DestinationCard key={item.id} destino={item} index={index} imageLoading="lazy" />
              ))}
            </div>
          ) : (
            <p className="destination-empty-copy">
              {t('No hay recomendaciones relacionadas publicadas por ahora.')}
            </p>
          )}
        </section>
      </div>

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
