import { Search, SlidersHorizontal } from 'lucide-react';

interface Props {
  q: string;
  onQChange: (value: string) => void;
  onSearch: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeCount: number;
}

export default function SearchBar({
  q,
  onQChange,
  onSearch,
  filtersOpen,
  onToggleFilters,
  activeCount,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1 flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4">
        <Search className="w-5 h-5 text-[var(--color-muted)] shrink-0" />
        <input
          type="text"
          placeholder="¿A dónde quieres ir?"
          className="w-full bg-transparent text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none text-base sm:text-lg"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
      </div>
      <div className="flex gap-2 px-2 pb-2 sm:px-0 sm:pb-0">
        <button
          onClick={onToggleFilters}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl border font-medium text-sm transition-all duration-300 touch-target ${
            filtersOpen
              ? 'border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
              : 'border-[var(--color-border)] text-[var(--color-primary)] hover:border-[var(--color-brand)]/30'
          }`}
        >
          <SlidersHorizontal className={`w-4 h-4 transition-transform duration-300 ${filtersOpen ? 'rotate-180' : ''}`} />
          Filtros
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--color-brand)] text-[#0a0f0d] text-xs flex items-center justify-center font-semibold">
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={onSearch}
          className="flex-1 sm:flex-none px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-[var(--color-brand)] text-[#0a0f0d] font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[var(--color-brand)]/20 touch-target"
        >
          Buscar
        </button>
      </div>
    </div>
  );
}
