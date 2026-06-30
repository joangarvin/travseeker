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
    <section className="mt-8">
      <ScrollReveal>
        <h2 className="text-2xl font-semibold text-[var(--color-primary)] tracking-tight mb-2">
          Destinos relacionados
        </h2>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Otros lugares que podrían interesarte por ubicación o tipo de turismo
        </p>
      </ScrollReveal>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
