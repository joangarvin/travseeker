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
    <div className="admin-list">
      <div className="admin-list__header">
        <h2 className="admin-list__title">Municipios</h2>
        <button
          type="button"
          onClick={onCreate}
          className="ui-btn ui-btn--primary admin-btn-new touch-target"
        >
          <Plus className="icon-sm" />
          <span className="admin-btn-new__label">Nuevo</span>
        </button>
      </div>

      <p className="admin-list__intro">
        Aquí creas y editas la ficha de cada municipio. Si la cambias, se actualiza en todos
        los destinos donde esté.
      </p>

      <ListToolbar query={query} onQueryChange={onQueryChange} queryPlaceholder="Buscar municipio…" />

      {loading ? (
        <p className="admin-list__loading">Cargando…</p>
      ) : rows.length === 0 ? (
        <div className="admin-empty">
          <p className="admin-empty__text admin-empty__text--sm">Aún no hay municipios en el catálogo.</p>
          <button type="button" onClick={onCreate} className="ui-btn ui-btn--primary admin-btn-new">
            <Plus className="icon-sm" />
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="admin-list__items admin-list__items--tight">
          {rows.map((m) => {
            const count = m.destinosCount ?? 0;
            return (
              <article
                key={m.id}
                className={`admin-muni-row${editingId === m.id ? ' admin-muni-row--active' : ''}`}
              >
                <button type="button" onClick={() => onEdit(m.id)} className="admin-muni-row__main">
                  <h3 className="admin-muni-row__name">{m.nombre}</h3>
                  <p className="admin-muni-row__meta">
                    {count === 0
                      ? 'Aún no está en ningún destino'
                      : `Usado en ${count} destino${count === 1 ? '' : 's'}`}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(m.id)}
                  className="admin-icon-btn touch-target"
                  aria-label={`Editar ${m.nombre}`}
                >
                  <Edit3 className="icon-sm" />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(m.id, m.nombre, count)}
                  className="admin-icon-btn admin-icon-btn--danger touch-target"
                  aria-label={`Eliminar ${m.nombre}`}
                >
                  <Trash2 className="icon-sm" />
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
    <div className="admin-form">
      <div>
        <h2 className="admin-form__title">
          {editingId ? 'Editar municipio' : 'Nuevo municipio'}
        </h2>
        <p className="admin-form__subtitle">
          Escribe con tus palabras. Los campos de precios y conexiones son los que verá el viajero.
        </p>
        {editingId && destinosCount > 0 && (
          <p className="admin-form__notice">
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
        <div className="admin-form__stack">
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

      <div className="admin-form__actions">
        <button type="button" onClick={onCancel} className="ui-btn ui-btn--secondary">
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !form.nombre.trim()}
          className="ui-btn ui-btn--primary"
        >
          {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear municipio'}
        </button>
      </div>

      <div className="admin-form__actions-mobile safe-bottom">
        <div className="admin-form__actions-row">
          <button type="button" onClick={onCancel} className="ui-btn ui-btn--secondary ui-btn--full">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !form.nombre.trim()}
            className="ui-btn ui-btn--primary ui-btn--primary-grow"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
