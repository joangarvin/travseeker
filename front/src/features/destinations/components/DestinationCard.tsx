import { t, serverMessage } from '../../../i18n';
import { Link } from 'react-router-dom';
import { GitCompare, Search } from 'lucide-react';
import { MediaImage } from '../../../components/ui';
import { useCompare } from '../../../contexts';
import type { Destino } from '../../../types';
import { imageUrl, plain } from '../../../utils';
import { TourismMark } from '../../tourism/tourism';

type DestinationCardProps = {
  destino: Destino;
  index?: number;
  imageLoading?: 'eager' | 'lazy';
};

export function DestinationCard({
  destino,
  index = 0,
  imageLoading = 'lazy',
}: DestinationCardProps) {
  const { ids, toggle } = useCompare();
  const isCompared = ids.includes(destino.id);

  return (
    <article className="destination-card">
      <Link to={`/destino/${destino.id}`} className="destination-card__image">
        <MediaImage src={imageUrl(destino.imagen)} alt="" loading={imageLoading} />
        <span>{String(index + 1).padStart(2, '0')}</span>
      </Link>

      <div className="destination-card__body">
        {destino.searchMatch && (
          <p className="destination-card__match">
            <Search aria-hidden />
            {serverMessage(destino.searchMatch.label)}
          </p>
        )}
        <div className="destination-card__eyebrow">
          <p className="destination-card__location">{plain(destino.ubicacion)}</p>
          <TourismMark value={destino.tipoTurismoPrincipal} compact />
        </div>
        <h3>
          <Link to={`/destino/${destino.id}`}>{destino.nombre.trim()}</Link>
        </h3>
        <div className="destination-card__facts">
          <span>{t(plain(destino.presupuesto))}</span>
          <span>{t(plain(destino.masificacion))}</span>
        </div>
      </div>

      <button
        className={`destination-card__compare ${isCompared ? 'is-active' : ''}`}
        onClick={() => toggle(destino.id)}
        aria-label={
          isCompared
            ? t('Quitar {0} de la comparación', { 0: destino.nombre })
            : t('Comparar {0}', { 0: destino.nombre })
        }
      >
        <GitCompare />
        <span>{isCompared ? t('Añadido') : t('Comparar')}</span>
      </button>
    </article>
  );
}
