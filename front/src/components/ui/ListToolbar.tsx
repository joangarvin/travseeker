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
    <div className="ui-card mb-6 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-md">
        <Search className="w-4 h-4 text-[var(--color-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={queryPlaceholder}
          className="ui-input !pl-10"
        />
      </div>
      {sortValue && onSortChange && sortOptions.length > 0 && (
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          className="ui-input sm:w-auto sm:min-w-[11rem] cursor-pointer"
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
