import type { FormEvent } from 'react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { CoordinatePicker } from '../../../components/admin/CoordinatePicker';
import { Button, Field } from '../../../components/ui';
import type { Place } from '../../../types';

const PLACE_CATEGORIES = [
  'Mirador',
  'Patrimonio',
  'Naturaleza',
  'Playa',
  'Museo',
  'Gastronomía',
  'Actividad',
  'Alojamiento',
  'Otro',
];

type PlaceEditorModalProps = {
  form: Partial<Place>;
  isSaving: boolean;
  onChange: (form: Partial<Place>) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
};

export function PlaceEditorModal({
  form,
  isSaving,
  onChange,
  onSubmit,
  onClose,
}: PlaceEditorModalProps) {
  return (
    <AdminModal
      wide
      title={form.id ? 'Editar lugar' : 'Nuevo lugar'}
      subtitle="Un punto concreto que ayuda a recorrer el destino."
      onClose={onClose}
    >
      <form onSubmit={onSubmit} className="place-editor">
        <div className="form-grid">
          <Field label="Nombre" htmlFor="place-name">
            <input
              id="place-name"
              value={form.nombre || ''}
              onChange={(event) => onChange({ ...form, nombre: event.target.value })}
              required
            />
          </Field>
          <Field label="Categoría" htmlFor="place-category">
            <select
              id="place-category"
              value={form.categoria || ''}
              onChange={(event) => onChange({ ...form, categoria: event.target.value })}
              required
            >
              <option value="">Elige una categoría</option>
              {PLACE_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Descripción" htmlFor="place-description">
          <textarea
            id="place-description"
            value={form.descripcion || ''}
            onChange={(event) => onChange({ ...form, descripcion: event.target.value })}
          />
        </Field>

        <div className="form-grid">
          <Field label="Sitio web" htmlFor="place-web">
            <input
              id="place-web"
              type="url"
              value={form.website || ''}
              onChange={(event) => onChange({ ...form, website: event.target.value })}
              placeholder="https://"
            />
          </Field>
          <Field label="Orden" htmlFor="place-order">
            <input
              id="place-order"
              type="number"
              min="0"
              max="9999"
              value={form.sortOrder || 0}
              onChange={(event) => onChange({ ...form, sortOrder: Number(event.target.value) })}
            />
          </Field>
        </div>

        <label className="setting-row">
          <span>
            <b>Visible en la ficha pública</b>
            <small>Desactívalo para conservarlo sin mostrarlo.</small>
          </span>
          <input
            type="checkbox"
            checked={form.isActive !== false}
            onChange={(event) => onChange({ ...form, isActive: event.target.checked })}
          />
        </label>

        <CoordinatePicker
          compact
          latitude={form.latitud}
          longitude={form.longitud}
          onChange={(latitud, longitud) => onChange({ ...form, latitud, longitud })}
        />

        <div className="form-grid">
          <Field label="Latitud" htmlFor="place-lat">
            <input
              id="place-lat"
              type="number"
              step="any"
              value={form.latitud ?? ''}
              onChange={(event) => onChange({ ...form, latitud: Number(event.target.value) })}
              required
            />
          </Field>
          <Field label="Longitud" htmlFor="place-lng">
            <input
              id="place-lng"
              type="number"
              step="any"
              value={form.longitud ?? ''}
              onChange={(event) => onChange({ ...form, longitud: Number(event.target.value) })}
              required
            />
          </Field>
        </div>

        <Button type="submit" loading={isSaving}>
          Guardar lugar
        </Button>
      </form>
    </AdminModal>
  );
}
