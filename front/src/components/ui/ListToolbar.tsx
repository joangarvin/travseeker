import { Search } from 'lucide-react';

interface SortOption {
  value: string;
  label: string;
}

interface ListToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder: string;
  sortValue?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: SortOption[];
}

export default function ListToolbar({
  query,
  onQueryChange,
  queryPlaceholder,
  sortValue,
  onSortChange,
  sortOptions = [],
}: ListToolbarProps) {
  return (
    <div className="mb-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between shadow-sm ring-1 ring-[var(--color-border)]/40">
      <div className="relative w-full sm:max-w-md">
        <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={queryPlaceholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border-strong)] text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)]"
        />
      </div>
      {sortValue && onSortChange && sortOptions.length > 0 && (
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 rounded-xl bg-[var(--color-secondary)] border border-[var(--color-border-strong)] text-sm text-[var(--color-primary)] focus:outline-none focus:border-[var(--color-brand)]"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
