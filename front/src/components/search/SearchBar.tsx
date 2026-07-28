import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface Props {
  q: string;
  onQChange: (value: string) => void;
  onSearch: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeCount: number;
}

const SEARCH_MODES = [
  { id: 'all', label: 'Buscar todo', placeholder: 'Lugares que ver, pueblos bonitos, costas tranquilas...' },
  { id: 'coast', label: 'Costa', placeholder: 'Calas, pueblos marineros, costa tranquila...' },
  { id: 'villages', label: 'Pueblos', placeholder: 'Pueblos bonitos, escapadas con encanto...' },
  { id: 'nature', label: 'Naturaleza', placeholder: 'Bosques, montaña, rutas, lagos...' },
  { id: 'culture', label: 'Cultural', placeholder: 'Ciudades históricas, patrimonio, museos...' },
] as const;

export default function SearchBar({
  q,
  onQChange,
  onSearch,
  filtersOpen,
  onToggleFilters,
  activeCount,
}: Props) {
  const [mode, setMode] = useState<(typeof SEARCH_MODES)[number]['id']>('all');

  const currentMode = useMemo(
    () => SEARCH_MODES.find((item) => item.id === mode) ?? SEARCH_MODES[0],
    [mode],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[1.6rem] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-4 py-4 sm:px-5 sm:py-5 shadow-[0_18px_50px_-32px_rgba(0,0,0,0.22)]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[var(--color-border)] pb-3">
          {SEARCH_MODES.map((item) => {
            const isActive = item.id === currentMode.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`relative text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                {item.label}
                <span
                  aria-hidden
                  className={`absolute left-0 -bottom-[13px] h-0.5 rounded-full bg-[var(--color-primary)] transition-all ${
                    isActive ? 'w-full opacity-100' : 'w-0 opacity-0'
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <div className="flex items-center gap-3 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-secondary)] px-3 py-3 shadow-[0_8px_24px_-18px_rgba(0,0,0,0.18)]">
            <span className="w-10 h-10 rounded-full bg-[var(--color-surface-2)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-muted)] mb-0.5">
                {currentMode.label}
              </p>
              <input
                type="text"
                placeholder={currentMode.placeholder}
                className="w-full bg-transparent text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none text-[15px] sm:text-base"
                value={q}
                onChange={(e) => onQChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                aria-label="Buscar destinos"
              />
            </div>

            {q && (
              <button
                type="button"
                onClick={() => onQChange('')}
                className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full text-[var(--color-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] transition-colors"
                aria-label="Borrar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onSearch}
              className="px-5 sm:px-6 py-3 rounded-full bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-all duration-200 active:scale-[0.98] touch-target shrink-0"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <button
          onClick={onToggleFilters}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-all duration-200 touch-target sm:flex-none ${
            filtersOpen
              ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-dark)]'
              : 'border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-primary)] hover:border-[var(--color-primary-light)]'
          }`}
        >
          <SlidersHorizontal className={`w-4 h-4 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
          Todos los filtros
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--color-brand)] text-[var(--color-on-brand)] text-xs flex items-center justify-center font-semibold">
              {activeCount}
            </span>
          )}
        </button>

        <div className="flex items-center px-1 text-xs text-[var(--color-muted)]">
          {activeCount > 0
            ? `${activeCount} filtro${activeCount > 1 ? 's' : ''} activo${activeCount > 1 ? 's' : ''}`
            : 'Afina por presupuesto, masificación, ubicación o estilo de viaje'}
        </div>
      </div>
    </div>
  );
}
