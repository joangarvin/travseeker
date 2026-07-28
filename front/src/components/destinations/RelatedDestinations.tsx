import { useRelatedDestinos } from '../../hooks/useRelatedDestinos';
import DestinationCard from './DestinationCard';
import ScrollReveal from '../ui/ScrollReveal';
import LoadingSkeleton from '../ui/LoadingSkeleton';

interface Props {
  destinoId: string;
}

export default function RelatedDestinations({ destinoId }: Props) {
  const { relacionados, loading } = useRelatedDestinos(destinoId);

  if (!loading && relacionados.length === 0) return null;

  return (
    <section className="related-dest">
      <ScrollReveal>
        <span className="related-dest__eyebrow field-label">Cerca en el cuaderno</span>
        <h2 className="related-dest__title">
          Parecidos, no calcados
        </h2>
        <p className="related-dest__lead">
          Misma zona o mismo humor de viaje. Por si quieres mirar de reojo.
        </p>
      </ScrollReveal>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <div className="related-dest__grid">
          {relacionados.map((destino, i) => (
            <ScrollReveal key={destino.id} delay={(i + 1) as 1 | 2 | 3}>
              <DestinationCard destino={destino} index={i} />
            </ScrollReveal>
          ))}
        </div>
      )}
    </section>
  );
}
