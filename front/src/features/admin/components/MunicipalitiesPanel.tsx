import { t } from '../../../i18n';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui';
import type { Municipio } from '../../../types';
import { plain } from '../../../utils';
import { AdminToolbar } from './AdminToolbar';
import { EditorialStatusBadge, EditorialStatusFilter } from './EditorialStatusBadge';

type MunicipalitiesPanelProps = {
  municipalities: Municipio[];
  total: number;
  status: string;
  onStatusChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  onCreate: () => void;
  onEdit: (municipality: Municipio) => void;
  onDelete: (id: string) => void;
};

export function MunicipalitiesPanel({
  municipalities,
  total,
  status,
  onStatusChange,
  query,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
}: MunicipalitiesPanelProps) {
  const visible = municipalities;
  return (
    <>
      <AdminToolbar
        query={query}
        onQueryChange={onQueryChange}
        placeholder={t('Buscar municipio, tipo o conexión')}
        resultCount={total}
      >
        <Button onClick={onCreate}>
          <Plus /> {t('Nuevo municipio')}
        </Button>
      </AdminToolbar>
      <EditorialStatusFilter
        value={status as 'all' | Municipio['editorialStatus']}
        onChange={onStatusChange}
      />

      <div className="admin-list">
        {visible.map((municipality) => (
          <article key={municipality.id}>
            <div>
              <EditorialStatusBadge status={municipality.editorialStatus} />
              <span>
                {municipality.destinosCount || 0} {t('destinos asociados')}
              </span>
              <h2>{municipality.nombre}</h2>
              <p>
                {plain(municipality.tipoTurismo) || t('Sin tipo')} ·{' '}
                {plain(municipality.precios) || t('Precios sin indicar')}
              </p>
            </div>
            <div>
              <button
                onClick={() => onEdit(municipality)}
                aria-label={t('Editar {0}', { 0: municipality.nombre })}
              >
                <Edit3 />
              </button>
              <button
                onClick={() => onDelete(municipality.id)}
                aria-label={t('Eliminar {0}', { 0: municipality.nombre })}
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
