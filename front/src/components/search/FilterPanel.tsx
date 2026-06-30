import { X } from 'lucide-react';
import { SEARCH_FILTERS, SELECT_CLASS } from '../../constants/filters';

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
        <div className="border-t border-[var(--color-border)] mt-2 pt-5 px-4 pb-4">
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 items-end ${open ? 'filter-stagger' : ''}`}>
            {SEARCH_FILTERS.map(({ key, label, options }) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                  {label}
                </label>
                <select
                  className={SELECT_CLASS}
                  value={filters[key]}
                  onChange={(e) => onUpdateFilter(key, e.target.value)}
                >
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            ))}

            <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Acciones
              </span>
              <div className="flex gap-2 h-[46px]">
                <button
                  onClick={onReset}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-brand)]/30 transition-all duration-300 active:scale-[0.98]"
                >
                  <X className="w-4 h-4" />
                  Limpiar
                </button>
                <button
                  onClick={onApply}
                  className="flex-1 rounded-xl bg-[var(--color-brand)] text-[#0a0f0d] text-sm font-semibold hover:bg-[var(--color-accent-hover)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
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
