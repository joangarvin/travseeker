import { LocalizedField } from './LocalizedField';
import { t } from '../../../i18n';
import type { FormEvent } from 'react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Field } from '../../../components/ui';
import type { Municipio } from '../../../types';
import { plain } from '../../../utils';

type MunicipalityEditorModalProps = {
  form: Partial<Municipio>;
  isSaving: boolean;
  error?: string;
  onChange: (form: Partial<Municipio>) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
};

export function MunicipalityEditorModal({
  form,
  isSaving,
  error,
  onChange,
  onSubmit,
  onClose,
}: MunicipalityEditorModalProps) {
  return (
    <AdminModal
      draft={form}
      draftKey={`municipality:${form.id || 'new'}`}
      onRestore={onChange}
      busy={isSaving}
      error={error}
      title={form.id ? t('Editar municipio') : t('Nuevo municipio')}
      subtitle={t('Información práctica que se reutiliza en todos los destinos asociados.')}
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <LocalizedField
          resource="municipality"
          field="nombre"
          translations={form.translations}
          onTranslationsChange={(translations) => onChange({ ...form, translations })}
          label={t('Nombre')}
          htmlFor="mun-name"
        >
          <input
            id="mun-name"
            value={form.nombre || ''}
            onChange={(event) => onChange({ ...form, nombre: event.target.value })}
            required
          />
        </LocalizedField>
        <LocalizedField
          resource="municipality"
          field="precios"
          translations={form.translations}
          onTranslationsChange={(translations) => onChange({ ...form, translations })}
          label={t('Nivel de precios')}
          htmlFor="mun-price"
        >
          <input
            id="mun-price"
            value={plain(form.precios)}
            onChange={(event) => onChange({ ...form, precios: event.target.value })}
            placeholder={t('30–50 € por noche')}
          />
        </LocalizedField>
        <LocalizedField
          resource="municipality"
          field="conexiones"
          translations={form.translations}
          onTranslationsChange={(translations) => onChange({ ...form, translations })}
          label={t('Conexiones y transporte')}
          htmlFor="mun-conn"
        >
          <textarea
            id="mun-conn"
            value={plain(form.conexiones)}
            onChange={(event) => onChange({ ...form, conexiones: event.target.value })}
            placeholder={t('Autobús, tren, carretera y tiempos aproximados')}
          />
        </LocalizedField>
        <LocalizedField
          resource="municipality"
          field="tipoTurismo"
          translations={form.translations}
          onTranslationsChange={(translations) => onChange({ ...form, translations })}
          label={t('Tipo de turismo')}
          htmlFor="mun-type"
        >
          <input
            id="mun-type"
            value={plain(form.tipoTurismo)}
            onChange={(event) => onChange({ ...form, tipoTurismo: event.target.value })}
          />
        </LocalizedField>
        <div className="admin-form-grid admin-form-grid--two">
          <Field
            label={t('Latitud')}
            htmlFor="mun-latitude"
            hint={t('Opcional, pero mejora el cálculo de rutas.')}
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
          <Field label={t('Longitud')} htmlFor="mun-longitude">
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
          {t('Guardar municipio')}
        </Button>
      </form>
    </AdminModal>
  );
}
