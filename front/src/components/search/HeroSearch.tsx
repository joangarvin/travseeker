import type { SearchFilters } from '../../api/destinos';
import { useSearchFilters } from '../../hooks/useSearchFilters';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';

interface Props {
  onSearch: (filters: SearchFilters) => void;
  activeFilterCount?: number;
}

export default function HeroSearch({ onSearch, activeFilterCount = 0 }: Props) {
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
  } = useSearchFilters();

  const handleApply = () => {
    onSearch(buildPayload());
    setFiltersOpen(false);
    document.getElementById('destinos')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleReset = () => {
    resetFilters();
    onSearch({ q: '', presupuesto: '', masificacion: '', ubicacion: '', tipoTurismo: '', actividades: '' });
  };

  const badgeCount = localActiveCount || activeFilterCount;

  return (
    <section id="buscar" className="relative overflow-hidden grain">
      {/* Línea de mapa decorativa de fondo */}
      <svg
        aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]"
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

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pt-24 sm:pt-28 pb-12 sm:pb-20 min-h-[78vh] sm:min-h-[88vh] flex items-center">
        <div className="w-full max-w-5xl mx-auto">
          <div className="animate-fade-up text-center">
            <p className="field-label text-[var(--color-muted)] mb-4 sm:mb-5">
              Guía de campo de la España tranquila
            </p>
            <h1 className="font-serif text-[2.7rem] leading-[1.03] sm:text-6xl md:text-[4.8rem] font-medium text-[var(--color-primary)] tracking-tight mb-5 sm:mb-6 max-w-[11ch] mx-auto">
              España, sin la cola para <span className="italic hand-underline">la foto</span>.
            </h1>
            <p className="text-[var(--color-primary-light)] text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Busca destinos por ambiente, presupuesto y masificación. Menos ruido, mejores decisiones,
              y planes que sí apetece guardar.
            </p>
          </div>

          <div className="mt-6 sm:mt-7 animate-fade-up animate-fade-up-delay-1">
            <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-center">
              <span className="field-label text-[var(--color-brand)]">Planifica con datos reales</span>
              <span className="text-xs text-[var(--color-muted)]">77 destinos revisados</span>
              <span className="hidden sm:inline text-[var(--color-border-strong)]">•</span>
              <span className="text-xs text-[var(--color-muted)]">0 patrocinados</span>
              <span className="hidden sm:inline text-[var(--color-border-strong)]">•</span>
              <span className="text-xs text-[var(--color-muted)]">Compara antes de decidir</span>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 animate-fade-up animate-fade-up-delay-1">
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
