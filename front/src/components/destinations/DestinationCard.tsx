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
  featured?: boolean;
}

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
    <span className="aforo-bar" aria-hidden>
      {[1, 2, 3, 4].map((n) => (
        <span
          key={n}
          className="aforo-bar__tick"
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
    <Link to={`/destino/${destino.id}`} className="dest-card-link">
      <div
        className="dest-card"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className={`dest-card__media ${featured ? 'dest-card__media--featured' : ''}`}>
          <img
            src={getImageUrl(destino.imagen, index)}
            alt={destino.nombre}
            className="dest-card__img"
            loading="lazy"
            decoding="async"
          />
          <div className="dest-card__gradient" />

          <div className="dest-card__open ink-chip card-actions-touch">
            <ArrowUpRight className="icon-sm" />
          </div>

          {enableCompare && (
            <button
              type="button"
              onClick={handleCompare}
              disabled={!inCompare && !canAdd}
              className={`dest-card__action dest-card__action--compare card-actions-touch ${inCompare ? 'is-active' : 'ink-chip'}`}
              aria-label={inCompare ? 'Quitar de comparación' : 'Añadir a comparación'}
            >
              <GitCompare className="icon-sm" />
            </button>
          )}
          {enableCollection && user && (
            <button
              type="button"
              onClick={openCollection}
              className="dest-card__action dest-card__action--collection ink-chip card-actions-touch"
              aria-label="Guardar en colección"
            >
              <Bookmark className="icon-sm" />
            </button>
          )}
        </div>

        <div className={`dest-card__body ${featured ? 'dest-card__body--featured' : ''}`}>
          <div className="dest-card__meta-top">
            <div className="dest-card__location field-label">
              <MapPin className="dest-card__location-icon" />
              <span>{ubicacion}</span>
            </div>
            <h3 className={`dest-card__title ${featured ? 'dest-card__title--featured' : ''}`}>
              {destino.nombre}
            </h3>
          </div>
          <div className="dest-card__footer">
            <span className="dest-card__stats field-label">
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
