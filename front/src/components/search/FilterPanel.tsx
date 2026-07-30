import { X } from 'lucide-react';
import { SEARCH_FILTERS } from '../../constants/filters';

interface Props {
  open: boolean;
  filters: Record<string, string>;
  onUpdateFilter: (key: string, value: string) => void;
  onReset: () => void;
  onApply: () => void;
}

export default function FilterPanel({ open, filters, onUpdateFilter, onReset, onApply }: Props) {
  return (
    <div className={`filters-panel ${open ? 'open' : ''}`}>
      <div className="filters-panel-inner">
        <div className={`filter-panel ${open ? 'filter-stagger' : ''}`}>
          <div className="filter-panel__grid">
            {SEARCH_FILTERS.map(({ key, label, options }) => (
              <div key={key} className="filter-panel__field">
                <label className="filter-panel__label field-label">
                  {label}
                </label>
                <select
                  className="filter-panel__select"
                  value={filters[key]}
                  onChange={(e) => onUpdateFilter(key, e.target.value)}
                >
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="filter-panel__field">
              <label className="filter-panel__label field-label" htmlFor="avoid-crowds">
                Prioridad
              </label>
              <label className="filter-panel__checkbox" htmlFor="avoid-crowds">
                <input
                  id="avoid-crowds"
                  type="checkbox"
                  checked={filters.avoidCrowds === 'true'}
                  onChange={(e) => onUpdateFilter('avoidCrowds', e.target.checked ? 'true' : '')}
                />
                Quiero evitar aglomeraciones
              </label>
            </div>

            <div className="filter-panel__actions-wrap">
              <span className="filter-panel__label field-label">
                Acciones
              </span>
              <div className="filter-panel__actions">
                <button
                  onClick={onReset}
                  className="filter-panel__action"
                >
                  <X aria-hidden />
                  Limpiar
                </button>
                <button
                  onClick={onApply}
                  className="filter-panel__action filter-panel__action--primary"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
