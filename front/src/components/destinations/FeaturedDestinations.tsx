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
  isSearching?: boolean;
}

const OFFSET_CLASS = [
  'featured-dest__item--offset-0',
  'featured-dest__item--offset-1',
  'featured-dest__item--offset-2',
  'featured-dest__item--offset-3',
  'featured-dest__item--offset-4',
  'featured-dest__item--offset-5',
];

function FeaturedDestinations({
  destinos,
  title = 'Pocos destinos. Buenas razones.',
  subtitle,
  loading = false,
  totalCount,
  isSearching = false,
}: Props) {
  const count = totalCount ?? destinos.length;

  return (
    <section id="destinos" className="featured-dest">
      <ScrollReveal>
        <div className="featured-dest__header">
          <span className="featured-dest__eyebrow field-label">
            {loading
              ? 'Cargando…'
              : isSearching
                ? `${count} resultado${count !== 1 ? 's' : ''}`
                : `Escogidos a mano · ${count} destino${count !== 1 ? 's' : ''}`}
          </span>
          <h2 className="featured-dest__title">
            {title}
          </h2>
          {subtitle && (
            <p className="featured-dest__subtitle">{subtitle}</p>
          )}
        </div>
      </ScrollReveal>

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : destinos.length > 0 ? (
        <div className="featured-dest__grid">
          {destinos.map((destino, i) => (
            <ScrollReveal
              key={destino.id}
              delay={((i % 3) + 1) as 1 | 2 | 3}
              className={`${OFFSET_CLASS[i % OFFSET_CLASS.length]} ${i === 0 ? 'featured-dest__item--hero' : ''}`}
            >
              <DestinationCard destino={destino} index={i} featured={i === 0 && destinos.length > 2} />
            </ScrollReveal>
          ))}
        </div>
      ) : (
        <ScrollReveal>
          <EmptyState
            icon={<MapPin className="icon-lg" />}
            title="Nada por aquí con esos filtros"
            description="Afloja el presupuesto o cambia de zona: España es más grande de lo que parece."
          />
        </ScrollReveal>
      )}
    </section>
  );
}

export default memo(FeaturedDestinations);
