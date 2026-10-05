import { t } from '../../../i18n';
import { AlertTriangle } from 'lucide-react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button } from '../../../components/ui';
import type { TourismType } from '../../../types';

export function TourismTypeDeleteDialog({
  type,
  isDeleting,
  onConfirm,
  onClose,
}: {
  type: TourismType;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <AdminModal title={t('Eliminar {0}', { 0: type.name })} onClose={onClose}>
      <div className="activity-delete-dialog">
        <AlertTriangle aria-hidden />
        <div>
          <p>
            {t('El tipo desaparecerá del catálogo y se retirará de')}{' '}
            <strong>
              {type.destinationsCount || 0} {t('destinos')}
            </strong>
            .
          </p>
          <p>{t('Los destinos que se queden sin ningún tipo deberán reclasificarse después.')}</p>
        </div>
      </div>
      <footer className="modal-actions">
        <Button data-autofocus variant="quiet" onClick={onClose}>
          {t('Conservar tipo')}
        </Button>
        <Button variant="danger" loading={isDeleting} onClick={onConfirm}>
          {t('Eliminar definitivamente')}
        </Button>
      </footer>
    </AdminModal>
  );
}
