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
      <div className="page-shell">
        <Header />
        <div className="page-guest">
          <EmptyState
            icon={<Heart className="icon-lg" />}
            title="Tus sitios"
            description="Entra y todo lo que marques con el corazón quedará guardado en un solo cajón."
            action={(
              <Link to="/auth">
                <Button>
                  <LogIn className="icon-sm" />
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
    <div className="page-shell">
      <Header />

      <PageHero
        eyebrow="Favoritos"
        icon={<Heart className="icon-md icon-heart-filled" style={{ color: 'var(--color-brand)' }} />}
        title="Tus sitios"
        description={
          filtered.length === 0
            ? 'Todo lo que marques con el corazón, en un solo cajón.'
            : `${filtered.length} destino${filtered.length === 1 ? '' : 's'} en el cajón`
        }
      />

      <div className="page-wrap">
        <section className="page-section">
          {error && (
            <p className="page-error-banner">{error}</p>
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
            <div className="dest-grid">
              {filtered.map((fav, index) => (
                <ScrollReveal key={fav.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
                  <DestinationCard destino={fav.destino} index={index} enableCollection />
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Heart className="icon-lg" />}
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
    </div>
  );
}
