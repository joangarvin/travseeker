import { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Bookmark, GitCompare, MapPin } from 'lucide-react';
import type { Destino } from '../../types';
import { getImageUrl } from '../../utils/images';
import { parseJsonSafe } from '../../utils/parseJson';
import { useAuth } from '../../context/AuthContext';
import { useCompare } from '../../context/CompareContext';
import AddToCollectionModal from '../collections/AddToCollectionModal';

interface Props {
  destino: Destino;
  index?: number;
  enableCollection?: boolean;
  enableCompare?: boolean;
}

function DestinationCard({ destino, index = 0, enableCollection = false, enableCompare = true }: Props) {
  const { user } = useAuth();
  const { isInCompare, toggleCompare, canAdd } = useCompare();
  const [collectionOpen, setCollectionOpen] = useState(false);

  const inCompare = isInCompare(destino.id);

  const { ubicacion, presupuesto, masificacion } = useMemo(() => ({
    ubicacion: parseJsonSafe(destino.ubicacion),
    presupuesto: parseJsonSafe(destino.presupuesto),
    masificacion: parseJsonSafe(destino.masificacion),
  }), [destino.ubicacion, destino.presupuesto, destino.masificacion]);

  const openCollection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCollectionOpen(true);
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCompare && !canAdd) return;
    toggleCompare({ id: destino.id, nombre: destino.nombre });
  };

  return (
    <Link
      to={`/destino/${destino.id}`}
      className="group relative rounded-xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border-strong)] hover:border-[var(--color-brand)]/40 hover:bg-[var(--color-surface-2)]/30 hover:shadow-md transition-all duration-300 flex flex-col h-full shadow-sm"
    >
      <div className="relative h-48 sm:h-56 overflow-hidden shrink-0">
        <img
          src={getImageUrl(destino.imagen, index)}
          alt={destino.nombre}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-black/30 backdrop-blur-md border border-white/15 flex items-center justify-center card-actions-touch opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
          <ArrowUpRight className="w-4 h-4 text-white" />
        </div>
        {enableCompare && (
          <button
            type="button"
            onClick={handleCompare}
            disabled={!inCompare && !canAdd}
            className={`absolute top-3 left-3 sm:top-4 sm:left-4 w-9 h-9 rounded-full flex items-center justify-center card-actions-touch transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 disabled:opacity-45 ${
              inCompare
                ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)]'
                : 'bg-black/35 backdrop-blur-md border border-white/15 text-white/90 hover:bg-black/50'
            }`}
            aria-label={inCompare ? 'Quitar de comparación' : 'Añadir a comparación'}
          >
            <GitCompare className="w-4 h-4" />
          </button>
        )}
        {enableCollection && user && (
          <button
            type="button"
            onClick={openCollection}
            className="absolute top-3 left-13 sm:top-4 sm:left-14 w-9 h-9 rounded-full bg-black/35 backdrop-blur-md border border-white/15 flex items-center justify-center text-white/90 hover:bg-black/50 card-actions-touch transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0"
            aria-label="Guardar en colección"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[var(--color-muted)] text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
            <MapPin className="w-3.5 h-3.5 text-[var(--color-brand-dark)] shrink-0" />
            <span className="truncate">{ubicacion}</span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-primary)] tracking-tight leading-snug line-clamp-2 group-hover:text-[var(--color-brand-dark)] transition-colors">
            {destino.nombre}
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-[var(--color-border)]">
          <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-primary-light)] border border-[var(--color-border)]">
            {presupuesto}
          </span>
          <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-[var(--color-surface-2)] text-[var(--color-primary-light)] border border-[var(--color-border)]">
            {masificacion}
          </span>
        </div>
      </div>

      {collectionOpen && (
        <AddToCollectionModal
          destinoId={destino.id}
          destinoNombre={destino.nombre}
          onClose={() => setCollectionOpen(false)}
        />
      )}
    </Link>
  );
}

export default memo(DestinationCard);
