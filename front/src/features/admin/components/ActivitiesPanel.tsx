import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { Activity } from '../../../types';
import { activityIconRegistry } from '../../activities/activities';
import { AdminToolbar } from './AdminToolbar';
import { EditorialStatusBadge, EditorialStatusFilter } from './EditorialStatusBadge';

type ActivitiesPanelProps = {
  activities: Activity[];
  query: string;
  onQueryChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
};

export function ActivitiesPanel({
  activities,
  query,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
}: ActivitiesPanelProps) {
  const [status, setStatus] = useState<Activity['editorialStatus'] | 'all'>('all');
  const visible = activities.filter(
    (activity) => status === 'all' || activity.editorialStatus === status,
  );
  return (
    <>
      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar actividad"
        resultCount={visible.length}
      >
        <Button onClick={onCreate}>
          <Plus /> Nueva actividad
        </Button>
      </AdminToolbar>
      <EditorialStatusFilter value={status} onChange={setStatus} />

      <div className="admin-list activity-admin-list">
        {visible.map((activity) => {
          const Icon = activityIconRegistry[activity.icon] || activityIconRegistry.Compass;
          return (
            <article key={activity.id}>
              <span className="activity-admin-list__icon" aria-hidden>
                <Icon />
              </span>
              <div>
                <EditorialStatusBadge status={activity.editorialStatus} />
                <span className={`activity-status ${activity.isActive ? 'is-active' : ''}`}>
                  {activity.isActive ? 'Visible' : 'Oculta'}
                </span>
                <h2>{activity.name}</h2>
                <p>
                  {activity.destinationsCount || 0}{' '}
                  {activity.destinationsCount === 1 ? 'destino asociado' : 'destinos asociados'}
                </p>
              </div>
              <div>
                <button onClick={() => onEdit(activity)} aria-label={`Editar ${activity.name}`}>
                  <Edit3 />
                </button>
                <button onClick={() => onDelete(activity)} aria-label={`Eliminar ${activity.name}`}>
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
