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
      className="group card-shine relative rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm hover:shadow-2xl hover:border-[var(--color-brand)]/20 transition-all duration-500 hover:-translate-y-1.5 block"
    >
      <div className="relative h-56 sm:h-72 md:h-80 overflow-hidden">
        <img
          src={getImageUrl(destino.imagen, index)}
          alt={destino.nombre}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080c0a] via-[#080c0a]/40 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 w-11 h-11 rounded-full glass flex items-center justify-center card-actions-touch opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <ArrowUpRight className="w-4 h-4 text-[var(--color-primary)]" />
        </div>
        {enableCompare && (
          <button
            type="button"
            onClick={handleCompare}
            disabled={!inCompare && !canAdd}
            className={`absolute top-3 left-3 sm:top-5 sm:left-5 w-11 h-11 rounded-full flex items-center justify-center card-actions-touch transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 disabled:opacity-40 ${
              inCompare
                ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)]'
                : 'glass-dark text-white/90 hover:bg-white/15'
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
            className="absolute top-3 left-14 sm:top-5 sm:left-16 w-11 h-11 rounded-full glass-dark flex items-center justify-center text-white/90 hover:bg-white/15 card-actions-touch transition-all duration-300 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0"
            aria-label="Guardar en colección"
          >
            <Bookmark className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-7">
        <div className="flex items-center gap-1.5 text-white/70 text-[11px] sm:text-xs font-medium mb-1.5 sm:mb-2 tracking-wide uppercase">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{ubicacion}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3 sm:mb-4 tracking-tight leading-tight line-clamp-2">
          {destino.nombre}
        </h3>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 border border-white/10">
            {presupuesto}
          </span>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 border border-white/10">
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
