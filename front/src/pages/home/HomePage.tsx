import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CalendarDays, Map, Sparkles, Users } from 'lucide-react';
import { api } from '../../services/api';
import { imageUrl, queryString } from '../../utils';
import type { Destino, FilterOptions, SearchFilters } from '../../types';
import { Loader, MediaImage, Notice } from '../../components/ui';
import { Shell } from '../../components/layout';
import { DestinationCard } from '../../features/destinations/components/DestinationCard';
import { SearchBox } from '../../features/search/SearchBox';
import { HomeFilterPanel } from '../../features/search/HomeFilterPanel';
import { EmptyFilterState } from '../../features/search/EmptyFilterState';
import { tourismDefinition, tourismTypes, tourismColorStyle } from '../../features/tourism/tourism';
import { useTourismTypes } from '../../contexts';
import { activityTypes } from '../../features/activities/activities';
import {
  buildRelaxationCandidates,
  getActiveFilterChips,
  removeActiveFilter,
  type FallbackResult,
  type SearchFilterKey,
} from '../../utils/filterFallbackEngine';

const defaultFilterOptions: FilterOptions = {
  locations: ['Costa', 'Interior', 'Isla', 'Montaña'],
  activities: activityTypes.map((activity) => activity.label),
};

const PAGE_SIZE = 24;
type DestinationPage = { items: Destino[]; total: number; hasMore: boolean };

function pageQuery(filters: SearchFilters, offset = 0) {
  return queryString({
    ...filters,
    limit: String(PAGE_SIZE),
    offset: String(offset),
    meta: '1',
  });
}

export default function Home() {
  const { tourismTypes: catalog } = useTourismTypes();
  const [params, setParams] = useSearchParams();
  const [featured, setFeatured] = useState<Destino[]>([]);
  const [results, setResults] = useState<Destino[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [resultsTotal, setResultsTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(defaultFilterOptions);
  const [filters, setFilters] = useState<SearchFilters>(() => Object.fromEntries(params.entries()));
  const [appliedFilters, setAppliedFilters] = useState<SearchFilters>(() =>
    Object.fromEntries(params.entries()),
  );
  const [fallbackResult, setFallbackResult] = useState<FallbackResult | null>(null);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const initialListAbort = useRef<AbortController | null>(null);
  const mainSearchAbort = useRef<AbortController | null>(null);
  const fallbackAbort = useRef<AbortController | null>(null);

  const search = async (next = filters) => {
    mainSearchAbort.current?.abort();
    initialListAbort.current?.abort();
    fallbackAbort.current?.abort();
    const controller = new AbortController();
    mainSearchAbort.current = controller;
    const nextParams = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
    });
    setFilters(next);
    setAppliedFilters(next);
    setParams(nextParams, { replace: true });
    setLoading(true);
    setError('');
    setResults([]);
    setResultsTotal(0);
    setHasMore(false);
    setFallbackResult(null);
    setFallbackLoading(false);
    try {
      const data = await api<DestinationPage>(`/destinos${pageQuery(next)}`, {
        signal: controller.signal,
      });
      if (mainSearchAbort.current !== controller) return;
      setResults(data.items);
      setResultsTotal(data.total);
      setHasMore(data.hasMore);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los destinos');
    } finally {
      if (mainSearchAbort.current === controller) setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const data = await api<DestinationPage>(
        `/destinos${pageQuery(appliedFilters, results.length)}`,
      );
      setResults((current) => {
        const known = new Set(current.map((destination) => destination.id));
        return [...current, ...data.items.filter((destination) => !known.has(destination.id))];
      });
      setResultsTotal(data.total);
      setHasMore(data.hasMore);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar más destinos');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const listController = new AbortController();
    initialListAbort.current = listController;
    const initialFilters = Object.fromEntries(params.entries());
    const initialQuery = { ...initialFilters, limit: String(PAGE_SIZE), offset: '0', meta: '1' };
    Promise.allSettled([
      api<Destino[]>('/destacados?limit=5'),
      api<DestinationPage>(`/destinos${queryString(initialQuery)}`, {
        signal: listController.signal,
      }),
      api<FilterOptions>('/destinos/filter-options'),
    ])
      .then(([hero, list, options]) => {
        if (hero.status === 'fulfilled') setFeatured(hero.value);
        if (list.status === 'fulfilled') {
          setResults(list.value.items);
          setResultsTotal(list.value.total);
          setHasMore(list.value.hasMore);
        } else if (!listController.signal.aborted) {
          setError('No se pudieron cargar los destinos. Revisa la conexión e inténtalo de nuevo.');
        }
        if (options.status === 'fulfilled') setFilterOptions(options.value);
      })
      .finally(() => {
        if (!listController.signal.aborted) setLoading(false);
      });

    return () => {
      listController.abort();
      mainSearchAbort.current?.abort();
      fallbackAbort.current?.abort();
    };
  }, []);

  const draftActiveCount = useMemo(() => getActiveFilterChips(filters).length, [filters]);
  const activeChips = useMemo(() => getActiveFilterChips(appliedFilters), [appliedFilters]);
  const activeCount = activeChips.length;
  const visibleResults = results;
  const resultCount = resultsTotal || results.length;
  const moodOptions = catalog.length
    ? catalog.map((type) => tourismDefinition(type.name, catalog))
    : tourismTypes;
  const update = (key: keyof SearchFilters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    fallbackAbort.current?.abort();
    setFallbackResult(null);

    if (loading || error || resultCount > 0 || activeChips.length === 0) {
      setFallbackLoading(false);
      return;
    }

    const controller = new AbortController();
    fallbackAbort.current = controller;
    setFallbackLoading(true);

    void (async () => {
      try {
        for (const candidate of buildRelaxationCandidates(appliedFilters)) {
          const data = await api<DestinationPage>(
            `/destinos${queryString({
              ...candidate.filters,
              limit: '6',
              offset: '0',
              meta: '1',
            })}`,
            { signal: controller.signal },
          );
          if (controller.signal.aborted) return;
          if (data.total > 0) {
            setFallbackResult({
              ...candidate,
              total: data.total,
              suggestedDestinations: data.items.slice(0, 6),
            });
            return;
          }
        }
      } catch {
        if (!controller.signal.aborted) setFallbackResult(null);
      } finally {
        if (fallbackAbort.current === controller) setFallbackLoading(false);
      }
    })();

    return () => controller.abort();
  }, [activeChips.length, appliedFilters, error, loading, resultCount]);

  const removeFilter = (key: SearchFilterKey, value?: string) => {
    const next = removeActiveFilter(appliedFilters, key, value);
    void search(next);
  };

  const resetFilters = () => {
    setFiltersOpen(false);
    void search({});
  };

  const submitMainSearch = async () => {
    await search();
    document.getElementById('results')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  return (
    <Shell>
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="kicker">Guía de viajeros</p>
          <h1>
            TravSeeker,
            <br />
            <em>
              <span className="home-hero__accent">Donde empieza tu viaje. </span>
            </em>
          </h1>
          <p className="home-hero__lead">
            Compara afluencia, presupuesto y mejor momento. El viaje empieza tomando una buena
            decisión.
          </p>
          <SearchBox
            value={filters.q || ''}
            onChange={(value) => update('q', value)}
            onSubmit={() => void submitMainSearch()}
          />
          <HomeFilterPanel
            filters={filters}
            isOpen={filtersOpen}
            activeCount={draftActiveCount}
            locations={filterOptions.locations}
            activities={filterOptions.activities}
            onToggle={() => setFiltersOpen((currentValue) => !currentValue)}
            onUpdate={update}
            onClear={() => {
              resetFilters();
            }}
            onApply={() => {
              setFiltersOpen(false);
              void search();
            }}
          />
        </div>
        <div className="image-wall" aria-label="Destinos destacados">
          {featured.slice(0, 3).map((destino, index) => (
            <Link
              key={destino.id}
              to={`/destino/${destino.id}`}
              className={`image-wall__panel image-wall__panel--${index + 1}`}
            >
              <MediaImage
                src={imageUrl(destino.imagen)}
                alt={destino.nombre}
                fetchPriority={index === 0 ? 'high' : 'auto'}
              />
              <span>
                <b>{String(index + 1).padStart(2, '0')}</b>
                {destino.nombre}
              </span>
            </Link>
          ))}
          {featured.length === 0 && (
            <div className="image-wall__fallback">
              <Sparkles />
              <span>Tu próxima historia empieza aquí</span>
            </div>
          )}
        </div>
      </section>

      <section className="trip-moods">
        <div>
          <h2>¿Qué quieres que pase?</h2>
        </div>
        <div className="trip-moods__list">
          {moodOptions.map((mode) => (
            <button
              type="button"
              className={`tourism--${mode.key}`}
              style={tourismColorStyle(mode.colorValue)}
              key={mode.key}
              onClick={() => {
                const next = { ...filters, tipoTurismo: mode.label };
                void search(next);
                document.getElementById('results')?.scrollIntoView({
                  behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
                    ? 'auto'
                    : 'smooth',
                });
              }}
            >
              <span className="trip-moods__icon">
                <mode.Icon />
              </span>
              <span className="trip-moods__copy">
                <b>{mode.label}</b>
                <small>{mode.description}</small>
              </span>
              <ArrowRight />
            </button>
          ))}
        </div>
      </section>

      <section id="results" className="results-section">
        <header className="section-head">
          <div>
            <p className="kicker" role="status" aria-live="polite">
              {activeCount ? 'Tu búsqueda' : 'La selección completa'}
            </p>
            <h2>
              {activeCount
                ? resultCount === 1
                  ? '1 lugar encaja'
                  : `${resultCount} lugares encajan`
                : 'Sitios que merecen el viaje'}
            </h2>
          </div>
          <Link to={`/mapa${queryString(appliedFilters)}`}>
            Abrir en el mapa <Map />
          </Link>
        </header>
        {error && (
          <Notice
            tone="error"
            action={
              <button
                className="button button--quiet"
                type="button"
                onClick={() => void (results.length && hasMore ? loadMore() : search())}
              >
                Reintentar
              </button>
            }
          >
            {error}. Revisa la conexión e inténtalo de nuevo.
          </Notice>
        )}
        {loading ? (
          <Loader label="Buscando lugares" />
        ) : (
          <>
            {visibleResults.length ? (
              <div className="destination-list">
                {visibleResults.map((destino, index) => (
                  <DestinationCard key={destino.id} destino={destino} index={index} />
                ))}
              </div>
            ) : (
              <EmptyFilterState
                activeChips={activeChips}
                fallbackResult={fallbackResult}
                fallbackLoading={fallbackLoading}
                onRemoveFilter={removeFilter}
                onResetAll={resetFilters}
                onApplySuggestion={(suggestion) => void search(suggestion.filters)}
              />
            )}
            {hasMore && (
              <button
                className="button button--secondary results-section__load-more"
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                aria-busy={loadingMore}
              >
                {loadingMore
                  ? 'Cargando más destinos…'
                  : `Mostrar más destinos (${Math.max(resultCount - visibleResults.length, 0)} restantes)`}
              </button>
            )}
          </>
        )}
      </section>

      <section className="decision-band" aria-labelledby="decision-band-title">
        <header>
          <p className="kicker">La brújula de TravSeeker</p>
          <h2 id="decision-band-title">Tres señales antes de elegir</h2>
        </header>
        <div>
          <CalendarDays />
          <span>Cuándo ir</span>
          <b>Temporadas comparadas</b>
          <p>Lectura mes a mes para encontrar el momento adecuado.</p>
        </div>
        <div>
          <Users />
          <span>Cuánta gente</span>
          <b>Afluencia estimada</b>
          <p>Una escala comprensible para anticipar los periodos con más presión.</p>
        </div>
        <div>
          <Sparkles />
          <span>Por qué merece la pena</span>
          <b>Selección independiente</b>
          <p>Los resultados no dependen de posiciones pagadas.</p>
        </div>
      </section>
    </Shell>
  );
}
