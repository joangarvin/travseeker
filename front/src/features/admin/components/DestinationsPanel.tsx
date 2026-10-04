import { t } from '../../../i18n';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button, Loader } from '../../../components/ui';
import { TourismMark } from '../../tourism/tourism';
import type { Destino } from '../../../types';
import { plain } from '../../../utils';
import { AdminToolbar } from './AdminToolbar';
import { EditorialStatusBadge, EditorialStatusFilter } from './EditorialStatusBadge';

type DestinationsPanelProps = {
  destinations: Destino[];
  total: number;
  status: string;
  onStatusChange: (value: string) => void;
  query: string;
  isEditorLoading: boolean;
  onQueryChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (destination: Destino) => void;
  onDelete: (id: string) => void;
};

export function DestinationsPanel({
  destinations,
  total,
  status,
  onStatusChange,
  query,
  isEditorLoading,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
}: DestinationsPanelProps) {
  const visible = destinations;
  return (
    <>
      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder={t('Buscar por nombre, zona o tipo')}
        resultCount={total}
      >
        <Button onClick={onCreate}>
          <Plus /> {t('Nuevo destino')}
        </Button>
      </AdminToolbar>
      <EditorialStatusFilter
        value={status as 'all' | Destino['editorialStatus']}
        onChange={onStatusChange}
      />

      {isEditorLoading && <Loader label={t('Abriendo todos los datos')} />}

      <div className="admin-list">
        {visible.map((destination) => (
          <article key={destination.id}>
            <div>
              <EditorialStatusBadge status={destination.editorialStatus} />
              <span>{plain(destination.ubicacion)}</span>
              <h2>{destination.nombre}</h2>
              <div className="admin-list__meta">
                <TourismMark value={destination.tipoTurismoPrincipal} compact />
                <small>
                  {t(plain(destination.presupuesto))} · {destination.municipios?.length || 0}{' '}
                  {t('municipios')}
                  {destination.latitud == null ? t(' · Sin punto en mapa') : ''}
                </small>
              </div>
            </div>
            <div>
              <button
                onClick={() => onEdit(destination)}
                aria-label={t('Editar {0}', { 0: destination.nombre })}
              >
                <Edit3 />
              </button>
              <button
                onClick={() => onDelete(destination.id)}
                aria-label={t('Eliminar {0}', { 0: destination.nombre })}
              >
                <Trash2 />
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
