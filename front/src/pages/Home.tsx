import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import HeroSearch from '../components/search/HeroSearch';
import TravelStyles from '../components/home/TravelStyles';
import MapStrip from '../components/home/MapStrip';
import HowItWorks from '../components/home/HowItWorks';
import CierreVerde from '../components/home/CierreVerde';
import FeaturedDestinations, { type SearchSort } from '../components/destinations/FeaturedDestinations';
import RecommendedForYou from '../components/home/RecommendedForYou';
import Footer from '../components/layout/Footer';
import ConnectionError from '../components/ui/ConnectionError';
import { useDestinos } from '../hooks/useDestinos';
import { filtersFromParams, filtersToParams } from '../hooks/useSearchFilters';
import type { SearchFilters } from '../api/destinos';

const SORTS = new Set<SearchSort>(['relevance', 'name', 'budget']);

function sortFromParams(params: URLSearchParams): SearchSort {
  const raw = params.get('sort');
  return raw && SORTS.has(raw as SearchSort) ? (raw as SearchSort) : 'relevance';
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const sort = useMemo(() => sortFromParams(searchParams), [searchParams]);
  const urlFilterKey = useMemo(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('sort');
    return next.toString();
  }, [searchParams]);

  const { destinos, loading, isSearching, activeFilterCount, connectionError, searchDestinos } =
    useDestinos(urlFilters);

  const handleSearch = useCallback((filters: SearchFilters) => {
    const next = filtersToParams(filters);
    setSearchParams(next, { replace: true });
    searchDestinos(filters);
  }, [searchDestinos, setSearchParams]);

  const handleSortChange = useCallback((nextSort: SearchSort) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (nextSort === 'relevance') next.delete('sort');
      else next.set('sort', nextSort);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return (
    <div className="page-shell">
      <Header />
      <HeroSearch
        key={urlFilterKey || 'home'}
        onSearch={handleSearch}
        activeFilterCount={activeFilterCount}
        initialFilters={urlFilters}
      />
      {connectionError && <ConnectionError />}
      <TravelStyles onSelect={(tipoTurismo) => handleSearch({ tipoTurismo })} />
      <MapStrip />
      <FeaturedDestinations
        destinos={destinos}
        loading={loading}
        title={isSearching ? 'Lo que ha salido de tu búsqueda' : 'Pocos destinos. Buenas razones.'}
        subtitle={
          isSearching
            ? `${destinos.length} resultado${destinos.length === 1 ? '' : 's'}. Si se queda corto, afloja algún filtro.`
            : 'Cada ficha lleva su trabajo: presupuesto real, gente en agosto y cuándo ir. Si un sitio está aquí, es por algo.'
        }
        totalCount={destinos.length}
        isSearching={isSearching}
        sort={sort}
        onSortChange={handleSortChange}
      />
      {!isSearching && <RecommendedForYou />}
      <HowItWorks />
      <CierreVerde />
      <Footer />
    </div>
  );
}
