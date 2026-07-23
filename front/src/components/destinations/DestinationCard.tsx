import { memo, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
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
  featured?: boolean;
}

const TILTS = ['-0.8deg', '0.7deg', '-0.5deg', '0.9deg', '-0.6deg', '0.5deg'];

function aforoLevel(masificacion: string): number {
  const m = masificacion.toLowerCase();
  if (m.startsWith('nul')) return 1;
  if (m.startsWith('lev') || m.startsWith('baj')) return 2;
  if (m.startsWith('med')) return 3;
  if (m.startsWith('alt')) return 4;
  return 0;
}

function AforoBar({ level }: { level: number }) {
  if (!level) return null;
  const color = level >= 4 ? 'var(--color-teja)' : 'var(--color-mostaza)';
  return (
    <span className="flex items-center gap-0.5 shrink-0" aria-hidden>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className="w-1.5 h-3 rounded-[1px]"
          style={{ background: n <= level ? color : 'var(--color-surface-2)' }}
        />
      ))}
    </span>
  );
}

function DestinationCard({
  destino,
  index = 0,
  enableCollection = false,
  enableCompare = true,
  featured = false,
}: Props) {
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
    <Link to={`/destino/${destino.id}`} className="group block h-full">
      <div
        className="ficha-tilt relative rounded-lg overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border-strong)] group-hover:border-[var(--color-primary-light)]/60 transition-colors duration-200 flex flex-col h-full"
        style={{ '--tilt': TILTS[index % TILTS.length], boxShadow: 'var(--shadow-card)' } as CSSProperties}
      >
        <div className={`relative overflow-hidden shrink-0 ${featured ? 'h-56 sm:h-72' : 'h-48 sm:h-56'}`}>
          <img
            src={getImageUrl(destino.imagen, index)}
            alt={destino.nombre}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/35 via-transparent to-transparent pointer-events-none" />

          <div className="absolute top-3 right-3 w-9 h-9 rounded-lg ink-chip flex items-center justify-center card-actions-touch opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ArrowUpRight className="w-4 h-4" />
          </div>

          {enableCompare && (
            <button
              type="button"
              onClick={handleCompare}
              disabled={!inCompare && !canAdd}
              className={`absolute top-3 left-3 w-9 h-9 rounded-lg flex items-center justify-center card-actions-touch transition-all duration-200 opacity-0 group-hover:opacity-100 disabled:opacity-40 ${
                inCompare
                  ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)] border border-transparent'
                  : 'ink-chip'
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
              className="absolute top-3 left-13 w-9 h-9 rounded-lg ink-chip flex items-center justify-center card-actions-touch transition-opacity duration-200 opacity-0 group-hover:opacity-100"
              aria-label="Guardar en colección"
            >
              <Bookmark className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className={`flex-1 flex flex-col justify-between ${featured ? 'p-5 sm:p-6' : 'p-4 sm:p-5'}`}>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[var(--color-muted)] field-label">
              <MapPin className="w-3.5 h-3.5 text-[var(--color-brand)] shrink-0" />
              <span className="truncate">{ubicacion}</span>
            </div>
            <h3 className={`font-serif font-medium text-[var(--color-primary)] tracking-tight leading-snug line-clamp-2 min-h-[2.6em] group-hover:text-[var(--color-brand-dark)] transition-colors ${featured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
              {destino.nombre}
            </h3>
          </div>
          <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-[var(--color-border)]">
            <span className="field-label text-[var(--color-primary-light)] truncate">
              {presupuesto} · {masificacion}
            </span>
            <AforoBar level={aforoLevel(masificacion)} />
          </div>
        </div>

        {collectionOpen && (
          <AddToCollectionModal
            destinoId={destino.id}
            destinoNombre={destino.nombre}
            onClose={() => setCollectionOpen(false)}
          />
        )}
      </div>
    </Link>
  );
}

export default memo(DestinationCard);
