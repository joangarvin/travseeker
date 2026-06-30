import { Link } from 'react-router-dom';
import { Heart, LogIn } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import DestinationCard from '../components/destinations/DestinationCard';
import PageLoader from '../components/ui/PageLoader';
import ScrollReveal from '../components/ui/ScrollReveal';
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
  const favoritos = data ?? [];

  if (authLoading || (user && loading)) {
    return <PageLoader label="Cargando favoritos..." />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
        <Header />
        <div className="pt-24 sm:pt-32 px-4 sm:px-6 pb-20 max-w-lg mx-auto text-center">
          <div className="glass rounded-2xl border border-[var(--color-border)] p-10">
            <Heart className="w-12 h-12 text-[var(--color-brand)] mx-auto mb-4" />
            <h1 className="font-serif text-3xl text-[var(--color-primary)] mb-3">Tus favoritos</h1>
            <p className="text-[var(--color-muted)] mb-8">
              Inicia sesión para guardar destinos y acceder a ellos cuando quieras.
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-brand)] text-[#0a0f0d] font-semibold hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />

      <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 hero-mesh grain overflow-hidden">
        <div className="blob blob-2 opacity-40" />
        <div className="relative z-10 max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="w-6 h-6 text-[var(--color-brand)] fill-[var(--color-brand)]" />
              <h1 className="font-serif text-4xl md:text-5xl font-medium text-white tracking-tight">
                Mis favoritos
              </h1>
            </div>
            <p className="text-white/60 text-lg font-light">
              {favoritos.length === 0
                ? 'Aún no has guardado ningún destino.'
                : `${favoritos.length} destino${favoritos.length === 1 ? '' : 's'} guardado${favoritos.length === 1 ? '' : 's'}`}
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pb-20 -mt-4">
        {error && (
          <p className="text-center text-red-400 mb-8">{error}</p>
        )}

        {favoritos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favoritos.map((fav, index) => (
              <ScrollReveal key={fav.id} delay={(index % 4) as 0 | 1 | 2 | 3}>
                <DestinationCard destino={fav.destino} index={index} enableCollection />
              </ScrollReveal>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <Heart className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-4" />
            <p className="text-[var(--color-muted)] mb-6">
              Explora destinos y pulsa el corazón para guardarlos aquí.
            </p>
            <Link
              to="/"
              className="text-[var(--color-brand)] font-medium hover:underline"
            >
              Descubrir destinos
            </Link>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
