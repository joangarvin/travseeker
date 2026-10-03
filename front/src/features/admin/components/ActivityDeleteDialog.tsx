import { t } from '../../../i18n';
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
    <AdminModal title={t('Eliminar {0}', { 0: activity.name })} onClose={onClose}>
      <div className="activity-delete-dialog">
        <AlertTriangle aria-hidden />
        <div>
          <p>
            {t('La actividad desaparecerá del catálogo y se retirará de')}{' '}
            <strong>
              {destinationsCount} {t('destinos')}
            </strong>
            .
          </p>
          <p>{t('Esta acción no se puede deshacer.')}</p>
        </div>
      </div>
      <footer className="modal-actions">
        <Button data-autofocus type="button" variant="quiet" onClick={onClose}>
          {t('Conservar actividad')}
        </Button>
        <Button type="button" variant="danger" loading={isDeleting} onClick={onConfirm}>
          {t('Eliminar definitivamente')}
        </Button>
      </footer>
    </AdminModal>
  );
}
