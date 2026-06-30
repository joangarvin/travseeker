import Header from '../components/layout/Header';
import HeroSearch from '../components/search/HeroSearch';
import StatsBar from '../components/home/StatsBar';
import TravelStyles from '../components/home/TravelStyles';
import HowItWorks from '../components/home/HowItWorks';
import FeaturedDestinations from '../components/destinations/FeaturedDestinations';
import RecommendedForYou from '../components/home/RecommendedForYou';
import Footer from '../components/layout/Footer';
import ConnectionError from '../components/ui/ConnectionError';
import { useDestinos } from '../hooks/useDestinos';

export default function Home() {
  const { destinos, loading, isSearching, activeFilterCount, connectionError, searchDestinos } = useDestinos();

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />
      <HeroSearch onSearch={searchDestinos} activeFilterCount={activeFilterCount} />
      <StatsBar />
      {connectionError && <ConnectionError />}
      <TravelStyles onSelect={(tipoTurismo) => searchDestinos({ tipoTurismo })} />
      <FeaturedDestinations
        destinos={destinos}
        loading={loading}
        title={isSearching ? 'Resultados de búsqueda' : 'Destinos seleccionados'}
        subtitle={
          isSearching
            ? 'Estos son los destinos que mejor encajan con tus criterios.'
            : 'Una selección curada de los rincones más especiales de España.'
        }
        totalCount={destinos.length}
      />
      {!isSearching && <RecommendedForYou />}
      <HowItWorks />
      <Footer />
    </div>
  );
}
