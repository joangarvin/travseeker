import { Building2, Edit3, Plus, Trash2 } from 'lucide-react';
import type { AdminMunicipio, MunicipioFormState } from '../../types/admin';
import ListToolbar from '../ui/ListToolbar';
import AdminField, { adminInputClass, adminTextareaClass } from './AdminField';
import AdminSectionCard from './AdminSectionCard';

interface ListProps {
  rows: AdminMunicipio[];
  loading: boolean;
  query: string;
  editingId: string | null;
  onQueryChange: (q: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, nombre: string, destinosCount: number) => void;
}

export function MunicipioCatalogList({
  rows,
  loading,
  query,
  editingId,
  onQueryChange,
  onCreate,
  onEdit,
  onDelete,
}: ListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-[var(--color-primary)]">Municipios</h2>
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] text-sm font-semibold touch-target"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nuevo</span>
        </button>
      </div>

      <p className="text-sm text-[var(--color-muted)]">
        Aquí creas y editas la ficha de cada municipio. Si la cambias, se actualiza en todos
        los destinos donde esté.
      </p>

      <ListToolbar query={query} onQueryChange={onQueryChange} queryPlaceholder="Buscar municipio…" />

      {loading ? (
        <p className="text-[var(--color-muted)] py-8 text-center">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] p-8 text-center space-y-3">
          <p className="text-[var(--color-muted)] text-sm">Aún no hay municipios en el catálogo.</p>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] text-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((m) => {
            const count = m.destinosCount ?? 0;
            return (
              <article
                key={m.id}
                className={`rounded-2xl border bg-[var(--color-surface)] p-4 flex items-start gap-3 ${
                  editingId === m.id
                    ? 'border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/20'
                    : 'border-[var(--color-border)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onEdit(m.id)}
                  className="flex-1 min-w-0 text-left"
                >
                  <h3 className="font-semibold text-[var(--color-primary)] truncate">{m.nombre}</h3>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {count === 0
                      ? 'Aún no está en ningún destino'
                      : `Usado en ${count} destino${count === 1 ? '' : 's'}`}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(m.id)}
                  className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-brand-dark)] hover:bg-[var(--color-brand)]/10 touch-target shrink-0"
                  aria-label={`Editar ${m.nombre}`}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(m.id, m.nombre, count)}
                  className="p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 touch-target shrink-0"
                  aria-label={`Eliminar ${m.nombre}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface FormProps {
  editingId: string | null;
  form: MunicipioFormState;
  saving: boolean;
  destinosCount?: number;
  onChange: (form: MunicipioFormState) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function MunicipioCatalogForm({
  editingId,
  form,
  saving,
  destinosCount = 0,
  onChange,
  onSave,
  onCancel,
}: FormProps) {
  const patch = (partial: Partial<MunicipioFormState>) => onChange({ ...form, ...partial });

  return (
    <div className="space-y-4 pb-24 lg:pb-4">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-primary)]">
          {editingId ? 'Editar municipio' : 'Nuevo municipio'}
        </h2>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Escribe con tus palabras. Los campos de precios y conexiones son los que verá el viajero.
        </p>
        {editingId && destinosCount > 0 && (
          <p className="text-sm text-[var(--color-brand-dark)] mt-2 rounded-xl bg-[var(--color-brand)]/10 px-3 py-2">
            Este municipio está en {destinosCount} destino{destinosCount === 1 ? '' : 's'}. Al
            guardar, todos se actualizan.
          </p>
        )}
      </div>

      <AdminSectionCard
        icon={Building2}
        title="Datos del municipio"
        description="Nombre y la información práctica de alojarte y llegar."
      >
        <div className="space-y-4">
          <AdminField label="Nombre" required hint="Ej: Marbella, Ronda, Torremolinos…">
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => patch({ nombre: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSave();
                }
              }}
              placeholder="Nombre del municipio"
              className={adminInputClass}
            />
          </AdminField>

          <AdminField
            label="Precios"
            hint="Rangos orientativos de hotel, comida, etc. Un párrafo por idea."
          >
            <textarea
              value={form.precios}
              onChange={(e) => patch({ precios: e.target.value })}
              rows={5}
              placeholder="Ej: Hotel 3* desde 80 €/noche. Menú del día 12–15 €…"
              className={adminTextareaClass}
            />
          </AdminField>

          <AdminField
            label="Conexiones"
            hint="Cómo llegar: aeropuerto, tren, coche, distancias…"
          >
            <textarea
              value={form.conexiones}
              onChange={(e) => patch({ conexiones: e.target.value })}
              rows={5}
              placeholder="Ej: Aeropuerto a 30 min. AVE hasta Málaga…"
              className={adminTextareaClass}
            />
          </AdminField>

          <AdminField label="Tipo de turismo" hint="Ej: Sol y playa, Cultural, Familiar…">
            <input
              type="text"
              value={form.tipoTurismo}
              onChange={(e) => patch({ tipoTurismo: e.target.value })}
              placeholder="Tipo de turismo"
              className={adminInputClass}
            />
          </AdminField>
        </div>
      </AdminSectionCard>

      <div className="hidden lg:flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-[var(--color-border-strong)] text-[var(--color-primary)] font-medium"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !form.nombre.trim()}
          className="px-6 py-2.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold disabled:opacity-50"
        >
          {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear municipio'}
        </button>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[4000] p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur safe-bottom">
        <div className="flex gap-2 max-w-lg mx-auto">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-[var(--color-border-strong)] font-medium text-[var(--color-primary)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !form.nombre.trim()}
            className="flex-[2] py-3 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
