import type { SearchFilters } from '../../api/destinos';
import { useSearchFilters } from '../../hooks/useSearchFilters';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';

interface Props {
  onSearch: (filters: SearchFilters) => void;
  activeFilterCount?: number;
  initialFilters?: SearchFilters;
}

export default function HeroSearch({ onSearch, activeFilterCount = 0, initialFilters }: Props) {
  const {
    q,
    setQ,
    filters,
    filtersOpen,
    setFiltersOpen,
    updateFilter,
    resetFilters,
    buildPayload,
    localActiveCount,
  } = useSearchFilters(initialFilters);

  const handleApply = () => {
    onSearch(buildPayload());
    setFiltersOpen(false);
    document.getElementById('destinos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReset = () => {
    resetFilters();
    onSearch({ q: '', month: '', presupuesto: '', masificacion: '', ubicacion: '', tipoTurismo: '', actividades: '', avoidCrowds: '' });
  };

  const badgeCount = localActiveCount || activeFilterCount;

  return (
    <section id="buscar" className="hero-search">
      <svg
        aria-hidden
        className="hero-search__mapline"
        preserveAspectRatio="none"
      >
        <path
          d="M-20 70% C 20% 55%, 35% 80%, 55% 48% S 85% 30%, 110% 55%"
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth="1.5"
          strokeDasharray="2 10"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="hero-search__inner">
        <div className="hero-search__content">
          <div className="hero-search__heading animate-fade-up">
            <p className="hero-search__eyebrow field-label">
              Guía de campo de la España tranquila
            </p>
            <h1 className="hero-search__title">
              España, sin la cola para <span className="italic hand-underline">la foto</span>.
            </h1>
            <p className="hero-search__copy">
              Busca destinos por ambiente, presupuesto y masificación. Menos ruido, mejores decisiones,
              y planes que sí apetece guardar.
            </p>
          </div>

          <div className="hero-search__meta animate-fade-up animate-fade-up-delay-1">
            <div className="hero-search__meta-row">
              <span className="hero-search__meta-label field-label">Planifica con datos reales</span>
              <span className="hero-search__meta-item">77 destinos revisados</span>
              <span className="hero-search__meta-dot">•</span>
              <span className="hero-search__meta-item">0 patrocinados</span>
              <span className="hero-search__meta-dot">•</span>
              <span className="hero-search__meta-item">Compara antes de decidir</span>
            </div>
          </div>

          <div className="hero-search__search animate-fade-up animate-fade-up-delay-1">
            <SearchBar
              q={q}
              onQChange={setQ}
              onSearch={handleApply}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen(!filtersOpen)}
              activeCount={badgeCount}
            />

            <FilterPanel
              open={filtersOpen}
              filters={filters}
              onUpdateFilter={updateFilter}
              onReset={handleReset}
              onApply={handleApply}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
