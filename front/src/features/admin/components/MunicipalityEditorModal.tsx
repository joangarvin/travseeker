import type { FormEvent } from 'react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Field } from '../../../components/ui';
import type { Municipio } from '../../../types';
import { plain } from '../../../utils';

type MunicipalityEditorModalProps = {
  form: Partial<Municipio>;
  isSaving: boolean;
  onChange: (form: Partial<Municipio>) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
};

export function MunicipalityEditorModal({
  form,
  isSaving,
  onChange,
  onSubmit,
  onClose,
}: MunicipalityEditorModalProps) {
  return (
    <AdminModal
      title={form.id ? 'Editar municipio' : 'Nuevo municipio'}
      subtitle="Información práctica que se reutiliza en todos los destinos asociados."
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <Field label="Nombre" htmlFor="mun-name">
          <input
            id="mun-name"
            value={form.nombre || ''}
            onChange={(event) => onChange({ ...form, nombre: event.target.value })}
            required
          />
        </Field>
        <Field label="Nivel de precios" htmlFor="mun-price">
          <input
            id="mun-price"
            value={plain(form.precios)}
            onChange={(event) => onChange({ ...form, precios: event.target.value })}
            placeholder="30–50 € por noche"
          />
        </Field>
        <Field label="Conexiones y transporte" htmlFor="mun-conn">
          <textarea
            id="mun-conn"
            value={plain(form.conexiones)}
            onChange={(event) => onChange({ ...form, conexiones: event.target.value })}
            placeholder="Autobús, tren, carretera y tiempos aproximados"
          />
        </Field>
        <Field label="Tipo de turismo" htmlFor="mun-type">
          <input
            id="mun-type"
            value={plain(form.tipoTurismo)}
            onChange={(event) => onChange({ ...form, tipoTurismo: event.target.value })}
          />
        </Field>
        <div className="admin-form-grid admin-form-grid--two">
          <Field
            label="Latitud"
            htmlFor="mun-latitude"
            hint="Opcional, pero mejora el cálculo de rutas."
          >
            <input
              id="mun-latitude"
              type="number"
              step="any"
              min="-90"
              max="90"
              value={form.latitud ?? ''}
              onChange={(event) =>
                onChange({
                  ...form,
                  latitud: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </Field>
          <Field label="Longitud" htmlFor="mun-longitude">
            <input
              id="mun-longitude"
              type="number"
              step="any"
              min="-180"
              max="180"
              value={form.longitud ?? ''}
              onChange={(event) =>
                onChange({
                  ...form,
                  longitud: event.target.value ? Number(event.target.value) : null,
                })
              }
            />
          </Field>
        </div>
        <Button type="submit" loading={isSaving}>
          Guardar municipio
        </Button>
      </form>
    </AdminModal>
  );
}
