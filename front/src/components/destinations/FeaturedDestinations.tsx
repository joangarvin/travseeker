import { memo, useEffect, useMemo, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Destino } from '../../types';
import DestinationCard from './DestinationCard';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import ScrollReveal from '../ui/ScrollReveal';
import { EmptyState } from '../ui/primitives';
import { parseJsonSafe } from '../../utils/parseJson';

export type SearchSort = 'relevance' | 'name' | 'budget';

interface Props {
  destinos: Destino[];
  title?: string;
  subtitle?: string;
  loading?: boolean;
  totalCount?: number;
  isSearching?: boolean;
  sort?: SearchSort;
  onSortChange?: (sort: SearchSort) => void;
}

const PAGE_SIZE = 12;

const BUDGET_RANK: Record<string, number> = { Bajo: 0, Medio: 1, Alto: 2 };

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
  sort = 'relevance',
  onSortChange,
}: Props) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [destinos, sort, isSearching]);

  const sorted = useMemo(() => {
    if (!isSearching || sort === 'relevance') return destinos;
    const copy = [...destinos];
    if (sort === 'name') {
      return copy.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    }
    return copy.sort((a, b) => {
      const ra = BUDGET_RANK[parseJsonSafe(a.presupuesto)] ?? 99;
      const rb = BUDGET_RANK[parseJsonSafe(b.presupuesto)] ?? 99;
      if (ra !== rb) return ra - rb;
      return a.nombre.localeCompare(b.nombre, 'es');
    });
  }, [destinos, isSearching, sort]);

  const shown = isSearching ? sorted.slice(0, visible) : sorted;
  const hasMore = isSearching && visible < sorted.length;
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
          {isSearching && !loading && destinos.length > 0 && onSortChange && (
            <div className="featured-dest__toolbar">
              <label className="featured-dest__sort">
                <span className="field-label">Orden</span>
                <select
                  value={sort}
                  onChange={(e) => onSortChange(e.target.value as SearchSort)}
                  aria-label="Ordenar resultados"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="name">Nombre A–Z</option>
                  <option value="budget">Presupuesto (bajo → alto)</option>
                </select>
              </label>
            </div>
          )}
        </div>
      </ScrollReveal>

      {loading ? (
        <LoadingSkeleton count={6} />
      ) : shown.length > 0 ? (
        <>
          <div className="featured-dest__grid">
            {shown.map((destino, i) => (
              <ScrollReveal
                key={destino.id}
                delay={((i % 3) + 1) as 1 | 2 | 3}
                className={`${OFFSET_CLASS[i % OFFSET_CLASS.length]} ${i === 0 ? 'featured-dest__item--hero' : ''}`}
              >
                <DestinationCard destino={destino} index={i} featured={i === 0 && shown.length > 2} />
              </ScrollReveal>
            ))}
          </div>
          {hasMore && (
            <div className="featured-dest__more">
              <button
                type="button"
                className="btn-cta btn-cta--lg"
                onClick={() => setVisible((n) => n + PAGE_SIZE)}
              >
                Cargar más ({sorted.length - visible} restantes)
              </button>
            </div>
          )}
        </>
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
