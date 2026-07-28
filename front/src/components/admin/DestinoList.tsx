import { Plus } from 'lucide-react';
import type { AdminDestinoRow } from '../../types/admin';
import ListToolbar from '../ui/ListToolbar';
import DestinoListEmpty from './DestinoListEmpty';
import DestinoListItem from './DestinoListItem';

interface Props {
  rows: AdminDestinoRow[];
  loading: boolean;
  query: string;
  editingId: string | null;
  hiddenOnMobile: boolean;
  onQueryChange: (q: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, nombre: string) => void;
  onUnlinkMunicipio: (destinoId: string, municipioId: string, nombre: string) => void;
}

export default function DestinoList({
  rows,
  loading,
  query,
  editingId,
  hiddenOnMobile,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
  onUnlinkMunicipio,
}: Props) {
  return (
    <div className={`admin-list${hiddenOnMobile ? ' admin-list--desktop-only' : ''}`}>
      <div className="admin-list__header">
        <h2 className="admin-list__title">Destinos</h2>
        <button
          type="button"
          onClick={onCreate}
          className="ui-btn ui-btn--primary admin-btn-new touch-target"
        >
          <Plus className="icon-sm" />
          <span className="admin-btn-new__label">Nuevo</span>
        </button>
      </div>

      <ListToolbar query={query} onQueryChange={onQueryChange} queryPlaceholder="Buscar destino…" />

      {loading ? (
        <p className="admin-list__loading">Cargando…</p>
      ) : rows.length === 0 ? (
        <DestinoListEmpty onCreate={onCreate} />
      ) : (
        <div className="admin-list__items">
          {rows.map((row) => (
            <DestinoListItem
              key={row.id}
              row={row}
              active={editingId === row.id}
              onEdit={onEdit}
              onDelete={onDelete}
              onUnlinkMunicipio={onUnlinkMunicipio}
            />
          ))}
        </div>
      )}
    </div>
  );
}
