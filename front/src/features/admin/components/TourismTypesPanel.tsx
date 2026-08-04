import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { TourismType } from '../../../types';
import { tourismColorStyle, tourismIconRegistry } from '../../tourism/tourism';
import { AdminToolbar } from './AdminToolbar';

export function TourismTypesPanel({
  types,
  query,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
}: {
  types: TourismType[];
  query: string;
  onQueryChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (type: TourismType) => void;
  onDelete: (type: TourismType) => void;
}) {
  return (
    <>
      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar tipo de viaje"
        resultCount={types.length}
      >
        <Button onClick={onCreate}>
          <Plus /> Nuevo tipo
        </Button>
      </AdminToolbar>
      <div className="admin-list activity-admin-list">
        {types.map((type) => {
          const Icon = tourismIconRegistry[type.icon] || tourismIconRegistry.Compass;
          return (
            <article key={type.id}>
              <span
                className={`activity-admin-list__icon tourism-type-icon tourism--${type.colorKey}`}
                style={tourismColorStyle(type.colorValue)}
                aria-hidden
              >
                <Icon />
              </span>
              <div>
                <span className={`activity-status ${type.isActive ? 'is-active' : ''}`}>
                  {type.isActive ? 'Visible' : 'Oculto'}
                </span>
                <h2>{type.name}</h2>
                <p>
                  {type.description || 'Sin descripción'} · {type.destinationsCount || 0} destinos
                </p>
              </div>
              <div>
                <button onClick={() => onEdit(type)} aria-label={`Editar ${type.name}`}>
                  <Edit3 />
                </button>
                <button onClick={() => onDelete(type)} aria-label={`Eliminar ${type.name}`}>
                  <Trash2 />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
