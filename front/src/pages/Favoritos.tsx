import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, LogIn } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import DestinationCard from '../components/destinations/DestinationCard';
import PageLoader from '../components/ui/PageLoader';
import ScrollReveal from '../components/ui/ScrollReveal';
import PageHero from '../components/layout/PageHero';
import ListToolbar from '../components/ui/ListToolbar';
import { Button, EmptyState } from '../components/ui/primitives';
import { useAuth } from '../context/AuthContext';
import { useAbortableFetch } from '../hooks/useAbortableFetch';
import { getFavoritos } from '../api/favoritos';
import type { Favorito } from '../types/user';

export default function Favoritos() {
  const { user, token, loading: authLoading } = useAuth();
  const { data, loading, error } = useAbortableFetch<Favorito[]>(
    (signal) => getFavoritos(token as string, signal),
    [token],
    { enabled: !authLoading && !!user && !!token, initialData: [] },
  );
  const favoritos = useMemo(() => data ?? [], [data]);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name'>('recent');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? favoritos.filter((f) => f.destino.nombre.toLowerCase().includes(q))
      : favoritos;

    if (sortBy === 'name') {
      return [...base].sort((a, b) => a.destino.nombre.localeCompare(b.destino.nombre, 'es'));
    }
    return base;
  }, [favoritos, query, sortBy]);

  if (authLoading || (user && loading)) {
    return <PageLoader label="Abriendo tus sitios…" />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
        <Header />
        <div className="pt-24 sm:pt-32 px-4 sm:px-6 pb-20 max-w-lg mx-auto">
          <EmptyState
            icon={<Heart className="w-10 h-10" />}
            title="Tus sitios"
            description="Entra y todo lo que marques con el corazón quedará guardado en un solo cajón."
            action={(
              <Link to="/auth">
                <Button>
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Button>
              </Link>
            )}
          />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />

      <PageHero
        eyebrow="Favoritos"
        icon={<Heart className="w-6 h-6 fill-[var(--color-brand)]" />}
        title="Tus sitios"
        description={
          filtered.length === 0
            ? 'Todo lo que marques con el corazón, en un solo cajón.'
            : `${filtered.length} destino${filtered.length === 1 ? '' : 's'} en el cajón`
        }
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-20">
        {error && (
          <p className="text-center text-[var(--color-danger)] mb-8">{error}</p>
        )}

        {favoritos.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            queryPlaceholder="Buscar en el cajón…"
            sortValue={sortBy}
            onSortChange={(value) => setSortBy(value as 'recent' | 'name')}
            sortOptions={[
              { value: 'recent', label: 'Más recientes' },
              { value: 'name', label: 'Nombre A-Z' },
            ]}
          />
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filtered.map((fav, index) => (
              <ScrollReveal key={fav.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
                <DestinationCard destino={fav.destino} index={index} enableCollection />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart className="w-10 h-10" />}
            title={favoritos.length > 0 ? 'Nada con ese nombre' : 'De momento, silencio'}
            description={
              favoritos.length > 0
                ? 'Prueba con otra palabra.'
                : 'Toca el corazón en cualquier destino y esto empieza a llenarse.'
            }
            action={(
              <Link to="/">
                <Button variant="secondary">Ver destinos</Button>
              </Link>
            )}
          />
        )}
      </section>

      <Footer />
    </div>
  );
}
