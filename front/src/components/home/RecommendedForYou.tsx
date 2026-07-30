import { AlertTriangle, Compass, RotateCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAbortableFetch } from '../../hooks/useAbortableFetch';
import { getRecommendations } from '../../api/recommendations';
import DestinationCard from '../destinations/DestinationCard';
import ScrollReveal from '../ui/ScrollReveal';
import type { Recommendation } from '../../types';
import TravelerProfileEditor from './TravelerProfileEditor';

export default function RecommendedForYou() {
  const { user, token, favoriteIds } = useAuth();
  const preferenceKey = JSON.stringify(user?.preferences?.travel ?? {});
  const favoriteKey = [...favoriteIds].sort().join(',');
  const { data, loading, error, reload } = useAbortableFetch<Recommendation[]>(
    (signal) => getRecommendations(token as string, signal),
    [token, preferenceKey, favoriteKey],
    { enabled: !!user && !!token, initialData: [] },
  );

  if (!user) return null;
  const recs = (data ?? []).slice(0, 4);

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

      <TravelerProfileEditor onSaved={reload} />

      {error ? <div className="home-recs__error"><AlertTriangle className="icon-sm" /><span><strong>No hemos podido preparar tus destinos.</strong><small>{error}</small></span><button type="button" onClick={reload}><RotateCcw className="icon-sm" /> Reintentar</button></div> : loading ? (
        <div className="home-recs__grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="home-recs__skeleton" />
          ))}
        </div>
      ) : recs.length > 0 ? (
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
      ) : (
        <ScrollReveal>
          <div className="home-recs__empty">
            <Compass className="home-recs__empty-icon" aria-hidden />
            <p className="home-recs__empty-title">Aún no hay pistas para ti</p>
            <p className="home-recs__empty-text">
              Guarda favoritos o marca estilos en tu perfil y aquí aparecerán destinos que te cuadran.
            </p>
          </div>
        </ScrollReveal>
      )}
    </section>
  );
}
