import { memo } from 'react';
import { MapPin } from 'lucide-react';
import type { Destino } from '../../types';
import DestinationCard from './DestinationCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import ScrollReveal from '../ui/ScrollReveal';

interface Props {
  destinos: Destino[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  totalCount?: number;
}

function FeaturedDestinations({
  destinos,
  title = 'Nuestros destacados',
  subtitle,
  loading = false,
  totalCount,
}: Props) {
  const count = totalCount ?? destinos.length;

  return (
    <section id="destinos" className="py-24 px-6 md:px-8 max-w-7xl mx-auto">
      <ScrollReveal>
        <div className="text-center mb-16">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-brand)] mb-3 block">
            {loading ? 'Cargando...' : `${count} destino${count !== 1 ? 's' : ''}`}
          </span>
          <h2 className="text-4xl md:text-5xl font-semibold text-[var(--color-primary)] tracking-tight mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[var(--color-muted)] text-lg max-w-2xl mx-auto font-light">{subtitle}</p>
          )}
        </div>
      </ScrollReveal>

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : destinos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinos.map((destino, i) => (
            <ScrollReveal key={destino.id} delay={(i % 3 + 1) as 1 | 2 | 3}>
              <DestinationCard destino={destino} index={i} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <ScrollReveal>
          <div className="text-center py-20 px-8 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <MapPin className="w-10 h-10 text-[var(--color-muted)] mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-semibold text-[var(--color-primary)] mb-2">Sin resultados</h3>
            <p className="text-[var(--color-muted)] max-w-md mx-auto">
              No hemos encontrado destinos con esos criterios. Prueba a ampliar los filtros o buscar otro nombre.
            </p>
          </div>
        </ScrollReveal>
      )}
    </section>
  );
}

export default memo(FeaturedDestinations);
