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

export default function Home() {
  const { destinos, loading, isSearching, activeFilterCount, connectionError, searchDestinos } = useDestinos();

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />
      <HeroSearch onSearch={searchDestinos} activeFilterCount={activeFilterCount} />
      {connectionError && <ConnectionError />}
      <TravelStyles onSelect={(tipoTurismo) => searchDestinos({ tipoTurismo })} />
      <MapStrip />
      <FeaturedDestinations
        destinos={destinos}
        loading={loading}
        title={isSearching ? 'Lo que ha salido de tu búsqueda' : 'Pocos destinos. Buenas razones.'}
        subtitle={
          isSearching
            ? 'Estos son los que encajan con tus criterios. Si se queda corto, afloja algún filtro.'
            : 'Cada ficha lleva su trabajo: presupuesto real, gente en agosto y cuándo ir. Si un sitio está aquí, es por algo.'
        }
        totalCount={destinos.length}
      />
      {!isSearching && <RecommendedForYou />}
      <HowItWorks />
      <CierreVerde />
      <Footer />
    </div>
  );
}
