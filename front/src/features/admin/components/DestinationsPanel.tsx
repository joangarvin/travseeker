import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button, Loader } from '../../../components/ui';
import { TourismMark } from '../../tourism/tourism';
import type { Destino } from '../../../types';
import { plain } from '../../../utils';
import { AdminToolbar } from './AdminToolbar';

type DestinationsPanelProps = {
  destinations: Destino[];
  query: string;
  isEditorLoading: boolean;
  onQueryChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (destination: Destino) => void;
  onDelete: (id: string) => void;
};

export function DestinationsPanel({
  destinations,
  query,
  isEditorLoading,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
}: DestinationsPanelProps) {
  return (
    <>
      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar por nombre, zona o tipo"
        resultCount={destinations.length}
      >
        <Button onClick={onCreate}>
          <Plus /> Nuevo destino
        </Button>
      </AdminToolbar>

      {isEditorLoading && <Loader label="Abriendo todos los datos" />}

      <div className="admin-list">
        {destinations.map((destination) => (
          <article key={destination.id}>
            <div>
              <span>{plain(destination.ubicacion)}</span>
              <h2>{destination.nombre}</h2>
              <div className="admin-list__meta">
                <TourismMark value={destination.tipoTurismoPrincipal} compact />
                <small>
                  {plain(destination.presupuesto)} · {destination.municipios?.length || 0}{' '}
                  municipios{destination.latitud == null ? ' · Sin punto en mapa' : ''}
                </small>
              </div>
            </div>
            <div>
              <button
                onClick={() => onEdit(destination)}
                aria-label={`Editar ${destination.nombre}`}
              >
                <Edit3 />
              </button>
              <button
                onClick={() => onDelete(destination.id)}
                aria-label={`Eliminar ${destination.nombre}`}
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
