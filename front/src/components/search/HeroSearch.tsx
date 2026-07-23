import type { CSSProperties } from 'react';
import type { SearchFilters } from '../../api/destinos';
import { useSearchFilters } from '../../hooks/useSearchFilters';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';

interface Props {
  onSearch: (filters: SearchFilters) => void;
  activeFilterCount?: number;
}

function Sello() {
  return (
    <div
      aria-hidden
      className="hidden sm:flex absolute -top-8 -right-3 lg:-top-10 lg:-right-6 w-[5.5rem] h-[5.5rem] rounded-full border-[2.5px] border-[var(--color-teja)] text-[var(--color-teja)] items-center justify-center text-center rotate-[-12deg] hover:rotate-[-4deg] transition-transform duration-200 select-none z-20 bg-[var(--color-surface)]"
      style={{ boxShadow: '2px 2px 0 color-mix(in srgb, var(--color-teja) 35%, transparent)' }}
    >
      <span className="field-label leading-tight" style={{ fontSize: '0.55rem' }}>
        77 destinos
        <br />
        revisados
        <br />
        a mano
      </span>
    </div>
  );
}

function Grapa() {
  return (
    <svg
      aria-hidden
      className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[var(--color-primary-light)]"
      width="36"
      height="16"
      viewBox="0 0 36 16"
      fill="none"
    >
      <path d="M4 14V5a2.5 2.5 0 0 1 2.5-2.5h23A2.5 2.5 0 0 1 32 5v9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
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
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-10 items-center w-full">
          <div className="lg:col-span-7 animate-fade-up">
            <p className="field-label text-[var(--color-muted)] mb-4 sm:mb-5">
              Guía de campo de la España tranquila
            </p>
            <h1 className="font-serif text-[2.55rem] leading-[1.05] sm:text-6xl md:text-[4.5rem] font-medium text-[var(--color-primary)] tracking-tight mb-5 sm:mb-6 max-w-[13ch]">
              España, sin la cola para <span className="italic hand-underline">la foto</span>.
            </h1>
            <p className="text-[var(--color-primary-light)] text-base sm:text-lg max-w-md leading-relaxed">
              Medimos cada destino por lo que importa: cuánta gente hay, cuánto cuesta y cuándo
              merece la pena ir. Lo demás lo pone el viaje.
            </p>
          </div>

          <div className="lg:col-span-5 relative animate-fade-up animate-fade-up-delay-1">
            <Sello />
            <div
              className="ficha-tilt relative bg-[var(--color-surface-2)] border border-[var(--color-border-strong)] rounded-lg px-4 pt-7 pb-4 sm:px-5 sm:pb-5"
              style={{ '--tilt': '1.5deg', boxShadow: 'var(--shadow-card)' } as CSSProperties}
            >
              <Grapa />
              <p className="field-label text-[var(--color-muted)] mb-3">Buscar en el cuaderno</p>
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
      </div>
    </section>
  );
}
