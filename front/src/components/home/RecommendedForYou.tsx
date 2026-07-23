import { useAuth } from '../../context/AuthContext';
import { useAbortableFetch } from '../../hooks/useAbortableFetch';
import { getRecommendations } from '../../api/recommendations';
import DestinationCard from '../destinations/DestinationCard';
import ScrollReveal from '../ui/ScrollReveal';
import type { Recommendation } from '../../types';

export default function RecommendedForYou() {
  const { user, token } = useAuth();
  const { data, loading } = useAbortableFetch<Recommendation[]>(
    (signal) => getRecommendations(token as string, signal),
    [token],
    { enabled: !!user && !!token, initialData: [] },
  );

  if (!user) return null;
  const recs = (data ?? []).slice(0, 4);
  if (!loading && recs.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 sm:py-14">
      <ScrollReveal>
        <span className="field-label text-[var(--color-teja)] mb-3 block">Apuntes para ti</span>
        <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[var(--color-primary)] tracking-tight mb-2">
          Cosas que te pueden cuadrar
        </h2>
        <p className="text-[var(--color-muted)] text-sm sm:text-base mb-6 sm:mb-8 max-w-xl">
          Sacado de lo que ya tienes en el cajón. Sin magia, con gustos.
        </p>
      </ScrollReveal>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recs.map((rec, i) => (
            <ScrollReveal key={rec.destino.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="space-y-2">
                <DestinationCard destino={rec.destino} index={i} />
                <p className="field-label text-[var(--color-brand-dark)] px-1" style={{ textTransform: 'none', letterSpacing: '0.02em', fontSize: '0.75rem' }}>
                  {rec.reason}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      )}
    </section>
  );
}
