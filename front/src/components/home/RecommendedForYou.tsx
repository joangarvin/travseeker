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
    <section className="home-recs">
      <ScrollReveal>
        <span className="home-recs__eyebrow field-label">Apuntes para ti</span>
        <h2 className="home-recs__title">
          Cosas que te pueden cuadrar
        </h2>
        <p className="home-recs__copy">
          Sacado de lo que ya tienes en el cajón. Sin magia, con gustos.
        </p>
      </ScrollReveal>

      {loading ? (
        <div className="home-recs__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-recs__skeleton" />
          ))}
        </div>
      ) : (
        <div className="home-recs__grid">
          {recs.map((rec, i) => (
            <ScrollReveal key={rec.destino.id} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <div>
                <DestinationCard destino={rec.destino} index={i} />
                <p className="home-recs__item-reason field-label">
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
