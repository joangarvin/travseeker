import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { Activity } from '../../../types';
import { activityIconRegistry } from '../../activities/activities';
import { AdminToolbar } from './AdminToolbar';

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
  return (
    <>
      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder="Buscar actividad"
        resultCount={activities.length}
      >
        <Button onClick={onCreate}>
          <Plus /> Nueva actividad
        </Button>
      </AdminToolbar>

      <div className="admin-list activity-admin-list">
        {activities.map((activity) => {
          const Icon = activityIconRegistry[activity.icon] || activityIconRegistry.Compass;
          return (
            <article key={activity.id}>
              <span className="activity-admin-list__icon" aria-hidden>
                <Icon />
              </span>
              <div>
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
