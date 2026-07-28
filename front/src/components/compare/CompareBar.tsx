import { Link, useLocation } from 'react-router-dom';
import { GitCompare, X } from 'lucide-react';
import { useCompare } from '../../context/CompareContext';

export default function CompareBar() {
  const { items, clearCompare } = useCompare();
  const location = useLocation();

  if (items.length === 0 || location.pathname === '/comparar') return null;

  const ready = items.length >= 2;

  return (
    <div className="compare-bar animate-fade-up">
      <div className="compare-bar__card">
        <GitCompare className="compare-bar__icon" aria-hidden />
        <div className="compare-bar__content">
          <p className="compare-bar__title">
            {items.length} destino{items.length === 1 ? '' : 's'} en el ring
          </p>
          <p className="compare-bar__items">
            {items.map((x) => x.nombre.trim()).join(' · ')}
          </p>
        </div>
        <Link
          to={`/comparar?ids=${items.map((x) => x.id).join(',')}`}
          className={`compare-bar__cta touch-target ${ready ? 'is-ready' : 'is-disabled'}`}
          aria-disabled={!ready}
        >
          Cara a cara
        </Link>
        <button
          type="button"
          onClick={clearCompare}
          className="compare-bar__clear touch-target"
          aria-label="Vaciar comparación"
        >
          <X aria-hidden />
        </button>
      </div>
    </div>
  );
}
