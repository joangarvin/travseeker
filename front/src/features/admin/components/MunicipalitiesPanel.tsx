import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { Municipio } from '../../../types';
import { plain } from '../../../utils';
import { AdminToolbar } from './AdminToolbar';

type MunicipalitiesPanelProps = {
  municipalities: Municipio[];
  query: string;
  onQueryChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (municipality: Municipio) => void;
  onDelete: (id: string) => void;
};

const MAX_VISIBLE_MUNICIPALITIES = 100;

export function MunicipalitiesPanel({
  municipalities,
  query,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
}: MunicipalitiesPanelProps) {
  return (
    <>
      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar municipio, tipo o conexión"
        resultCount={municipalities.length}
      >
        <Button onClick={onCreate}>
          <Plus /> Nuevo municipio
        </Button>
      </AdminToolbar>

      {municipalities.length > MAX_VISIBLE_MUNICIPALITIES && (
        <p className="admin-result-hint">
          Mostrando los primeros 100. Escribe un nombre, tipo o conexión para acotar la lista.
        </p>
      )}

      <div className="admin-list">
        {municipalities.slice(0, MAX_VISIBLE_MUNICIPALITIES).map((municipality) => (
          <article key={municipality.id}>
            <div>
              <span>{municipality.destinosCount || 0} destinos asociados</span>
              <h2>{municipality.nombre}</h2>
              <p>
                {plain(municipality.tipoTurismo) || 'Sin tipo'} ·{' '}
                {plain(municipality.precios) || 'Precios sin indicar'}
              </p>
            </div>
            <div>
              <button
                onClick={() => onEdit(municipality)}
                aria-label={`Editar ${municipality.nombre}`}
              >
                <Edit3 />
              </button>
              <button
                onClick={() => onDelete(municipality.id)}
                aria-label={`Eliminar ${municipality.nombre}`}
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
