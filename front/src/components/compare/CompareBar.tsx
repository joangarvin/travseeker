import { Link, useLocation } from 'react-router-dom';
import { GitCompare, X } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';

export default function CompareBar() {
  const { items, clearCompare } = useCompare();
  const location = useLocation();

  if (items.length === 0 || location.pathname === '/comparar') return null;

  const ready = items.length >= 2;

  return (
    <div className="fixed bottom-0 sm:bottom-6 left-0 right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 z-[1500] w-full sm:w-[min(100%,36rem)] px-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0 animate-fade-up">
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 rounded-2xl sm:rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-2xl backdrop-blur-md">
        <GitCompare className="w-5 h-5 text-[var(--color-brand-dark)] shrink-0 hidden sm:block" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--color-primary)] truncate">
            {items.length} destino{items.length === 1 ? '' : 's'}
          </p>
          <p className="text-xs text-[var(--color-muted)] truncate hidden sm:block">
            {items.map((x) => x.nombre.trim()).join(' · ')}
          </p>
        </div>
        <Link
          to={`/comparar?ids=${items.map((x) => x.id).join(',')}`}
          className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all touch-target ${
            ready
              ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)] hover:brightness-105'
              : 'bg-[var(--color-secondary)] text-[var(--color-muted)] pointer-events-none'
          }`}
          aria-disabled={!ready}
        >
          Comparar
        </Link>
        <button
          type="button"
          onClick={clearCompare}
          className="shrink-0 w-10 h-10 rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary)] flex items-center justify-center transition-colors touch-target"
          aria-label="Vaciar comparación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
