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
    <div className="search-shell">
      <div className="search-shell__card">
        <div className="search-shell__tabs">
          {SEARCH_MODES.map((item) => {
            const isActive = item.id === currentMode.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`search-shell__tab ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
                <span aria-hidden className="search-shell__tab-indicator" />
              </button>
            );
          })}
        </div>

        <div className="search-shell__bar-wrap">
          <div className="search-shell__bar">
            <span className="search-shell__icon">
              <Search aria-hidden />
            </span>

            <div className="search-shell__input-wrap">
              <p className="search-shell__mode-label">
                {currentMode.label}
              </p>
              <input
                type="text"
                placeholder={currentMode.placeholder}
                className="search-shell__input"
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
                className="search-shell__clear"
                aria-label="Borrar búsqueda"
              >
                <X aria-hidden />
              </button>
            )}

            <button
              onClick={onSearch}
              className="search-shell__submit touch-target"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      <div className="search-shell__footer">
        <button
          onClick={onToggleFilters}
          className={`search-shell__filter-btn touch-target ${filtersOpen ? 'is-open' : ''}`}
        >
          <SlidersHorizontal className="search-shell__filter-icon" aria-hidden />
          Todos los filtros
          {activeCount > 0 && (
            <span className="search-shell__filter-count">
              {activeCount}
            </span>
          )}
        </button>

        <div className="search-shell__hint">
          {activeCount > 0
            ? `${activeCount} filtro${activeCount > 1 ? 's' : ''} activo${activeCount > 1 ? 's' : ''}`
            : 'Afina por presupuesto, masificación, ubicación o estilo de viaje'}
        </div>
      </div>
    </div>
  );
}
