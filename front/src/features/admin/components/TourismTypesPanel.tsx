import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { TourismType } from '../../../types';
import { tourismColorStyle, tourismIconRegistry } from '../../tourism/tourism';
import { AdminToolbar } from './AdminToolbar';
import { EditorialStatusBadge, EditorialStatusFilter } from './EditorialStatusBadge';

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
  const [status, setStatus] = useState<TourismType['editorialStatus'] | 'all'>('all');
  const visible = types.filter((type) => status === 'all' || type.editorialStatus === status);
  return (
    <>
      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar tipo de viaje"
        resultCount={visible.length}
      >
        <Button onClick={onCreate}>
          <Plus /> Nuevo tipo
        </Button>
      </AdminToolbar>
      <EditorialStatusFilter value={status} onChange={setStatus} />
      <div className="admin-list activity-admin-list">
        {visible.map((type) => {
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
                <EditorialStatusBadge status={type.editorialStatus} />
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
import { useState } from 'react';
