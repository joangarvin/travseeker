import type { ReactNode } from 'react';
import { Search } from 'lucide-react';

type AdminToolbarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
  resultCount: number;
  children?: ReactNode;
};

export function AdminToolbar({
  query,
  onQueryChange,
  placeholder,
  resultCount,
  children,
}: AdminToolbarProps) {
  return (
    <header className="admin-workspace__head">
      <div>
        <label className="admin-search">
          <Search />
          <span className="sr-only">{placeholder}</span>
          <input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={placeholder}
          />
        </label>
        <small>{resultCount} resultados</small>
      </div>
      {children}
    </header>
  );
}
