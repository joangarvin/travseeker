import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import HeroSearch from '../components/search/HeroSearch';
import TravelStyles from '../components/home/TravelStyles';
import MapStrip from '../components/home/MapStrip';
import HowItWorks from '../components/home/HowItWorks';
import CierreVerde from '../components/home/CierreVerde';
import FeaturedDestinations from '../components/destinations/FeaturedDestinations';
import RecommendedForYou from '../components/home/RecommendedForYou';
import Footer from '../components/layout/Footer';
import ConnectionError from '../components/ui/ConnectionError';
import { useDestinos } from '../hooks/useDestinos';
import { filtersFromParams, filtersToParams } from '../hooks/useSearchFilters';
import type { SearchFilters } from '../api/destinos';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlFilters = useMemo(() => filtersFromParams(searchParams), [searchParams]);
  const urlFilterKey = searchParams.toString();

  const { destinos, loading, isSearching, activeFilterCount, connectionError, searchDestinos } =
    useDestinos(urlFilters);

  const handleSearch = useCallback((filters: SearchFilters) => {
    setSearchParams(filtersToParams(filters), { replace: true });
    searchDestinos(filters);
  }, [searchDestinos, setSearchParams]);

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
      />
      {!isSearching && <RecommendedForYou />}
      <HowItWorks />
      <CierreVerde />
      <Footer />
    </div>
  );
}
