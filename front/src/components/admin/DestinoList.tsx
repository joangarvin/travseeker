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
  municipioText: Record<string, string>;
  hiddenOnMobile: boolean;
  onQueryChange: (q: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, nombre: string) => void;
  onMunicipioDraftChange: (destinoId: string, value: string) => void;
  onAddMunicipio: (destinoId: string) => void;
  onRemoveMunicipio: (id: string) => void;
}

export default function DestinoList({
  rows,
  loading,
  query,
  editingId,
  municipioText,
  hiddenOnMobile,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
  onMunicipioDraftChange,
  onAddMunicipio,
  onRemoveMunicipio,
}: Props) {
  return (
    <div className={`space-y-4 ${hiddenOnMobile ? 'hidden lg:block' : ''}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-[var(--color-primary)]">Destinos</h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] text-sm font-semibold touch-target"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      <ListToolbar query={query} onQueryChange={onQueryChange} queryPlaceholder="Buscar destino…" />

      {loading ? (
        <p className="text-[var(--color-muted)] py-8 text-center">Cargando…</p>
      ) : rows.length === 0 ? (
        <DestinoListEmpty onCreate={onCreate} />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <DestinoListItem
              key={row.id}
              row={row}
              active={editingId === row.id}
              municipioDraft={municipioText[row.id] || ''}
              onEdit={onEdit}
              onDelete={onDelete}
              onMunicipioDraftChange={onMunicipioDraftChange}
              onAddMunicipio={onAddMunicipio}
              onRemoveMunicipio={onRemoveMunicipio}
            />
          ))}
        </div>
      )}
    </div>
  );
}
