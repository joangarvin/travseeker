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
        <span className="field-label text-[var(--color-teja)] mb-3 block">Cerca en el cuaderno</span>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--color-primary)] tracking-tight mb-2">
          Parecidos, no calcados
        </h2>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Misma zona o mismo humor de viaje. Por si quieres mirar de reojo.
        </p>
      </ScrollReveal>

      {loading ? (
        <LoadingSkeleton count={3} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
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
