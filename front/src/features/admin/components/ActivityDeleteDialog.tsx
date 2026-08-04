import { AlertTriangle } from 'lucide-react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button } from '../../../components/ui';
import type { Activity } from '../../../types';

export function ActivityDeleteDialog({
  activity,
  isDeleting,
  onConfirm,
  onClose,
}: {
  activity: Activity;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const destinationsCount = activity.destinationsCount || 0;
  return (
    <AdminModal title={`Eliminar ${activity.name}`} onClose={onClose}>
      <div className="activity-delete-dialog">
        <AlertTriangle aria-hidden />
        <div>
          <p>
            La actividad desaparecerá del catálogo y se retirará de{' '}
            <strong>{destinationsCount} destinos</strong>.
          </p>
          <p>Esta acción no se puede deshacer.</p>
        </div>
      </div>
      <footer className="modal-actions">
        <Button data-autofocus type="button" variant="quiet" onClick={onClose}>
          Conservar actividad
        </Button>
        <Button type="button" variant="danger" loading={isDeleting} onClick={onConfirm}>
          Eliminar definitivamente
        </Button>
      </footer>
    </AdminModal>
  );
}
