import { t, locale, languageUrl } from '../../i18n';
import { DestinationReviews } from '../../features/destinations/components/DestinationReviews';
import { useDestinationReviews } from '../../features/destinations/hooks/useDestinationReviews';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookmarkPlus,
  ExternalLink,
  GitCompare,
  Heart,
  Map,
  Share2,
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
  serializeJsonLd,
  validCoordinates,
} from '../../utils';
import type { CollectionSummary, Destino, EssentialItem } from '../../types';
import { Button, Loader, Notice } from '../../components/ui';
import { PageMeta, Shell } from '../../components/layout';
import { RelatedDestinations } from '../../features/destinations/components/RelatedDestinations';
import { DestinationNav } from '../../features/destinations/components/DestinationNav';
import {
  ALL_ESSENTIALS,
  EssentialRoute,
} from '../../features/destinations/components/EssentialRoute';
import { DestinationSummary } from '../../features/destinations/components/DestinationSummary';
import { DestinationTripDialog } from '../../features/destinations/components/DestinationTripDialog';
import { DestinationHero } from '../../features/destinations/components/DestinationHero';
import { DestinationPlanningSection } from '../../features/destinations/components/DestinationPlanningSection';
import { recommendedBaseId } from '../../features/destinations/baseInsights';
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
  const [essentialFilter, setEssentialFilter] = useState(ALL_ESSENTIALS);
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
  const [addedTripUrl, setAddedTripUrl] = useState<string | undefined>();
  const [compareError, setCompareError] = useState('');
  const [sharePending, setSharePending] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    window.scrollTo(0, 0);
    setLoading(true);
    setError('');
    setDestino(null);
    setSelectedBaseMunicipioId(undefined);
    setEssentialFilter(ALL_ESSENTIALS);
    void api<Destino>(`/destinos/${id}`, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setDestino(data);
          setSelectedBaseMunicipioId(recommendedBaseId(data));
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
  const hasReviews = (reviewStats.count || reviews.length) > 0;
  const reviewCount = reviewStats.count || reviews.length;
  const average = reviewStats.average || 0;
  const destinationMapUrl = coordinates ? openStreetMapUrl(coordinates) : null;
  const loginState = { returnTo: location.pathname + location.search };
  const exploreEssentials = (groupKeys: string[]) => {
    setEssentialFilter(groupKeys.length === 1 ? groupKeys[0] : ALL_ESSENTIALS);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document
      .getElementById('imprescindibles')
      ?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <Shell>
      <DestinationSchema destino={destino} />
      <PageMeta title={`${destino.nombre.trim()} — TravSeeker`} description={lead} />

      <DestinationHero
        destination={destino}
        rating={hasReviews ? { average, count: reviewCount } : undefined}
        onBack={returnToDiscovery}
        actions={
          <>
            {user ? (
              <Button onClick={() => setTripDialogItem(null)}>
                <BookmarkPlus aria-hidden="true" /> {t('Añadir a un viaje')}
              </Button>
            ) : (
              <Link className="button button--primary" to="/auth" state={loginState}>
                <BookmarkPlus aria-hidden="true" /> {t('Añadir a un viaje')}
              </Link>
            )}
            {user ? (
              <Button
                variant="secondary"
                className="dest-hero__icon"
                aria-label={favorite ? t('Guardado') : t('Guardar')}
                aria-pressed={favorite}
                title={favorite ? t('Guardado') : t('Guardar')}
                loading={favoritePending}
                onClick={() => void toggleFavorite()}
              >
                <Heart aria-hidden="true" />
              </Button>
            ) : (
              <Link
                className="button button--secondary dest-hero__icon"
                to="/auth"
                state={loginState}
                aria-label={t('Guardar')}
                title={t('Guardar')}
              >
                <Heart aria-hidden="true" />
              </Link>
            )}
            <Button
              variant="secondary"
              className="dest-hero__icon"
              aria-label={compare.ids.includes(id) ? t('Comparando') : t('Comparar')}
              aria-pressed={compare.ids.includes(id)}
              title={compare.ids.includes(id) ? t('Comparando') : t('Comparar')}
              data-tour="compare-destination"
              onClick={toggleComparison}
            >
              <GitCompare aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              className="dest-hero__icon"
              aria-label={t('Compartir')}
              title={t('Compartir')}
              loading={sharePending}
              onClick={() => void shareDestination()}
            >
              <Share2 aria-hidden="true" />
            </Button>
          </>
        }
        feedback={
          <>
            {favoriteError && <Notice tone="error">{favoriteError}</Notice>}
            {favoriteFeedback && <Notice tone="success">{favoriteFeedback}</Notice>}
            {tripFeedback && (
              <Notice tone="success">
                {tripFeedback}{' '}
                {addedTripUrl && <Link to={addedTripUrl}>{t('Ver el día en tu viaje')}</Link>}
              </Notice>
            )}
            {compareError && <Notice tone="error">{compareError}</Notice>}
            {shareError && <Notice tone="error">{shareError}</Notice>}
            {shareFeedback && <Notice tone="success">{shareFeedback}</Notice>}
          </>
        }
      />

      <DestinationNav key={id} destination={destino} />

      <div className="destination-guide">
        <DestinationSummary
          destination={destino}
          mapUrl={destinationMapUrl}
          onExplore={exploreEssentials}
        />

        <section
          id="cuando-ir"
          className="season-section"
          aria-labelledby="when-to-go-heading"
          data-reveal
        >
          <ClimateSection destinationId={destino.id} hasValidCoordinates={Boolean(coordinates)} />
        </section>

        <div id="imprescindibles" data-tour="essentials" className="destination-anchor">
          <EssentialRoute
            groups={destino.essentialGroups}
            activityTarget={
              new URLSearchParams(location.hash.slice(1)).get('actividad') || undefined
            }
            activityFallback={
              destino.activities?.some(
                (activity) =>
                  activity.id === new URLSearchParams(location.hash.slice(1)).get('actividad'),
              )
                ? 'resumen'
                : 'imprescindibles'
            }
            filter={essentialFilter}
            onFilterChange={setEssentialFilter}
            legacyHtml={destino.imprescindibles}
            coverImage={destino.imagen}
            coverAlt={t('Vista principal de {0}', { 0: destino.nombre.trim() })}
            authenticated={Boolean(user)}
            loginState={loginState}
            onAddToTrip={(item) => setTripDialogItem(item)}
          />
        </div>

        <DestinationPlanningSection
          destination={destino}
          selectedMunicipioId={selectedBaseMunicipioId}
          onSelectMunicipio={setSelectedBaseMunicipioId}
        />

        {!!destino.places?.length && (
          <section id="alrededor" className="nearby" aria-labelledby="nearby-title" data-reveal>
            <div className="destination-section-heading">
              <p className="kicker">{t('Amplía el viaje')}</p>
              <h2 id="nearby-title">{t('Lugares alrededor')}</h2>
              <p>{t('Paradas cercanas para alargar el viaje sin cambiar de base.')}</p>
            </div>
            <div className="nearby__grid">
              {destino.places.map((place) => {
                const placeCoordinates = validCoordinates(place.latitud, place.longitud);
                const website = safeExternalUrl(place.website);
                const distance =
                  coordinates && placeCoordinates
                    ? haversineDistanceKm(coordinates, placeCoordinates)
                    : null;
                return (
                  <article className="nearby-card" id={`place-${place.id}`} key={place.id}>
                    <div className="nearby-card__meta">
                      <span>{t(place.categoria)}</span>
                      {distance != null && (
                        <span>
                          {t('A')} {distanceLabel(distance)} {t('en línea recta')}
                        </span>
                      )}
                    </div>
                    <h3>{place.nombre}</h3>
                    {place.descripcion && <p>{place.descripcion}</p>}
                    <div className="nearby-card__actions">
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
          key={`${id}:${user?.id || 'guest'}`}
          destinationName={destino.nombre.trim()}
          reviewState={reviewState}
          authenticated={Boolean(user)}
          emailVerified={Boolean(user?.emailVerified)}
          loginState={loginState}
        />

        <RelatedDestinations
          destination={destino}
          items={related}
          loading={relatedLoading}
          error={relatedError}
          onRetry={() => void loadRelated()}
        />
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
          onAdded={(message, tripUrl) => {
            setTripFeedback(message);
            setAddedTripUrl(tripUrl);
            void loadCollections();
          }}
        />
      )}
    </Shell>
  );
}
