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
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-secondary)]/50 focus-within:border-[var(--color-brand)] transition-colors">
        <Search className="w-5 h-5 text-[var(--color-muted)] shrink-0" />
        <input
          type="text"
          placeholder="Costa, monte, pueblo con castillo…"
          className="w-full bg-transparent text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none text-base"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        />
      </div>
      <div className="flex gap-2.5">
        <button
          onClick={onToggleFilters}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border font-medium text-sm transition-all duration-200 touch-target ${
            filtersOpen
              ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand-dark)]'
              : 'border-[var(--color-border-strong)] text-[var(--color-primary)] hover:border-[var(--color-primary-light)]'
          }`}
        >
          <SlidersHorizontal className={`w-4 h-4 transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
          Afinar filtros
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[var(--color-brand)] text-[var(--color-on-brand)] text-xs flex items-center justify-center font-semibold">
              {activeCount}
            </span>
          )}
        </button>
        <button
          onClick={onSearch}
          className="flex-1 px-5 py-3 rounded-lg bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold text-sm hover:bg-[var(--color-accent-hover)] transition-all duration-200 active:scale-[0.98] touch-target"
        >
          Enséñame sitios
        </button>
      </div>
    </div>
  );
}
