import { memo } from 'react';
import { MapPin } from 'lucide-react';
import type { Destino } from '../../types';
import DestinationCard from './DestinationCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import ScrollReveal from '../ui/ScrollReveal';
import { EmptyState } from '../ui/primitives';

interface Props {
  destinos: Destino[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  totalCount?: number;
}

const OFFSETS = ['', 'md:mt-4', 'md:mt-2', 'md:mt-5', 'md:mt-1', 'md:mt-3'];

function FeaturedDestinations({
  destinos,
  title = 'Pocos destinos. Buenas razones.',
  subtitle,
  loading = false,
  totalCount,
}: Props) {
  const count = totalCount ?? destinos.length;

  return (
    <section id="destinos" className="py-14 sm:py-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto scroll-mt-20">
      <ScrollReveal>
        <div className="mb-8 sm:mb-12 max-w-2xl">
          <span className="field-label text-[var(--color-teja)] mb-3 block">
            {loading ? 'Cargando…' : `Escogidos a mano · ${count} destino${count !== 1 ? 's' : ''}`}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-primary)] tracking-tight mb-3 sm:mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[var(--color-muted)] text-base sm:text-lg leading-relaxed">{subtitle}</p>
          )}
        </div>
      </ScrollReveal>

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : destinos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-7 items-start">
          {destinos.map((destino, i) => (
            <ScrollReveal
              key={destino.id}
              delay={((i % 3) + 1) as 1 | 2 | 3}
              className={`${OFFSETS[i % OFFSETS.length]} ${i === 0 ? 'md:col-span-2 lg:col-span-1 lg:row-span-1' : ''}`}
            >
              <DestinationCard destino={destino} index={i} featured={i === 0 && destinos.length > 2} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <ScrollReveal>
          <EmptyState
            icon={<MapPin className="w-10 h-10" />}
            title="Nada por aquí con esos filtros"
            description="Afloja el presupuesto o cambia de zona: España es más grande de lo que parece."
          />
        </ScrollReveal>
      )}
    </section>
  );
}

export default memo(FeaturedDestinations);
