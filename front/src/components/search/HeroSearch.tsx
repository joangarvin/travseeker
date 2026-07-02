import { Sparkles } from 'lucide-react';
import type { SearchFilters } from '../../api/destinos';
import { useSearchFilters } from '../../hooks/useSearchFilters';
import HeroBackground from './HeroBackground';
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
  };

  const handleReset = () => {
    resetFilters();
    onSearch({ q: '', presupuesto: '', masificacion: '', ubicacion: '', tipoTurismo: '', actividades: '' });
  };

  const badgeCount = localActiveCount || activeFilterCount;

  return (
    <section id="buscar" className="relative min-h-[100dvh] sm:min-h-[92vh] flex items-center justify-center overflow-hidden">
      <HeroBackground />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-24 sm:pt-28 pb-16 sm:pb-20">
        <div className="text-center mb-8 sm:mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-primary)] text-xs font-medium tracking-wide mb-4 sm:mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-brand)]" />
            Curado para viajeros exigentes
          </div>
          <h1 className="font-serif text-[2.35rem] leading-[1.12] sm:text-5xl md:text-7xl font-medium text-[var(--color-primary)] tracking-tight mb-4 sm:mb-5">
            Descubre tu
            <br />
            <span className="text-gradient-brand italic">destino ideal</span>
          </h1>
          <p className="text-[var(--color-muted)] text-base sm:text-lg max-w-xl mx-auto font-light px-2">
            Filtra por presupuesto, masificación y tipo de turismo para encontrar el lugar perfecto en España.
          </p>
        </div>

        <div className="animate-fade-up animate-fade-up-delay-1">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-xl p-1.5 shadow-sm">
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
