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
    <div className="list-toolbar ui-card">
      <div className="list-toolbar__search">
        <Search className="list-toolbar__search-icon" aria-hidden />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={queryPlaceholder}
          className="list-toolbar__input ui-input"
        />
      </div>
      {sortValue && onSortChange && sortOptions.length > 0 && (
        <select
          value={sortValue}
          onChange={(e) => onSortChange(e.target.value)}
          className="list-toolbar__select ui-input"
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
