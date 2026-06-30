import { Sparkles } from 'lucide-react';
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
    <section className="max-w-7xl mx-auto px-6 md:px-10 py-16">
      <ScrollReveal>
        <div className="flex items-center gap-2.5 mb-2">
          <Sparkles className="w-5 h-5 text-[var(--color-brand-dark)]" />
          <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-primary)] tracking-tight">Para ti</h2>
        </div>
        <p className="text-[var(--color-muted)] mb-8">Recomendaciones basadas en tus favoritos y preferencias de viaje.</p>
      </ScrollReveal>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recs.map((rec, i) => (
            <ScrollReveal key={rec.destino.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div className="space-y-2.5">
                <DestinationCard destino={rec.destino} index={i} />
                <p className="flex items-center gap-1.5 text-xs text-[var(--color-brand-dark)] font-medium px-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
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
