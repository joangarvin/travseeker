import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { MunicipalityCatalogEditor } from './MunicipalityCatalogEditor';
import { ImageUploader, Notice } from '../../../components/ui';
import { LocalizedField } from './LocalizedField';
import { t } from '../../../i18n';
import type { FormEvent } from 'react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Field } from '../../../components/ui';
import type { Municipio } from '../../../types';
import { plain } from '../../../utils';

type MunicipalityEditorModalProps = {
  token: string;
  form: Partial<Municipio>;
  isSaving: boolean;
  error?: string;
  onChange: (form: Partial<Municipio>) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
};

export function MunicipalityEditorModal({
  token,
  form,
  isSaving,
  error,
  onChange,
  onSubmit,
  onClose,
}: MunicipalityEditorModalProps) {
  const [section, setSection] = useState('informacion');
  const [catalogEditing, setCatalogEditing] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [detailVersion, setDetailVersion] = useState(0);
  const [detailRetry, setDetailRetry] = useState(0);
  const [detailReady, setDetailReady] = useState(!form.id || !!form.actividadesIds);
  useEffect(() => {
    if (!form.id || form.actividadesIds) return;
    setDetailError('');
    const controller = new AbortController();
    api<Municipio>(`/admin/municipios/${form.id}`, { signal: controller.signal }, token)
      .then((record) => {
        onChange(record);
        setDetailReady(true);
        setDetailVersion((value) => value + 1);
      })
      .catch((cause) => {
        if (!controller.signal.aborted)
          setDetailError(cause instanceof Error ? cause.message : 'No se pudo cargar la ficha');
      });
    return () => controller.abort();
    // Load once for this editor; subsequent changes belong to the user's draft.
  }, [form.id, token, detailRetry]);
  return (
    <AdminModal
      savedVersion={detailVersion}
      draft={form}
      draftKey={`municipality:${form.id || 'new'}`}
      onRestore={onChange}
      busy={isSaving || catalogEditing}
      error={detailError || error}
      title={form.id ? t('Editar municipio') : t('Nuevo municipio')}
      subtitle={t('Información práctica que se reutiliza en todos los destinos asociados.')}
      onClose={onClose}
    >
      <nav className="municipality-editor-nav" aria-label="Secciones de la ficha">
        {['informacion', 'actividades', 'hoteles', 'restaurantes'].map((value) => (
          <button
            type="button"
            key={value}
            aria-pressed={section === value}
            disabled={
              catalogEditing || !detailReady || (value !== 'informacion' && !form.nombre?.trim())
            }
            onClick={() => setSection(value)}
          >
            {value === 'informacion'
              ? 'Información y foto'
              : value === 'actividades'
                ? 'Actividades'
                : value === 'hoteles'
                  ? 'Hoteles'
                  : 'Restaurantes'}
          </button>
        ))}
      </nav>
      {detailError && (
        <Notice
          tone="error"
          action={
            <Button
              type="button"
              variant="quiet"
              onClick={() => setDetailRetry((value) => value + 1)}
            >
              Reintentar carga
            </Button>
          }
        >
          {detailError}
        </Notice>
      )}
      <form
        onSubmit={(event) => {
          if (catalogEditing || !detailReady) {
            event.preventDefault();
            return;
          }
          onSubmit(event);
        }}
      >
        <fieldset className="municipality-guide-fields" disabled={!detailReady || isSaving}>
          <div hidden={section !== 'informacion'}>
            <ImageUploader
              id="municipio-photo"
              token={token}
              endpoint="/upload/municipio"
              label="Foto del municipio"
              value={form.imagen}
              onChange={(imagen) =>
                onChange({
                  ...form,
                  imagen,
                  ...(imagen !== form.imagen ? { imageAttribution: {} } : {}),
                })
              }
              onRemove={() => onChange({ ...form, imagen: '', imageAttribution: {} })}
            />
            <div className="municipality-image-credit-fields">
              <h3>Atribución de la foto</h3>
              <p>Indica autoría, fuente y licencia de la imagen de portada.</p>
              {(['author', 'title', 'sourceUrl', 'license', 'licenseUrl', 'changes'] as const).map(
                (field) => {
                  const labels = {
                    author: 'Autor',
                    title: 'Título de la imagen',
                    sourceUrl: 'Enlace a la fuente',
                    license: 'Licencia',
                    licenseUrl: 'Enlace a la licencia',
                    changes: 'Cambios realizados',
                  };
                  const value = form.imageAttribution?.[field] || '';
                  return (
                    <Field key={field} label={labels[field]} htmlFor={`mun-credit-${field}`}>
                      <input
                        id={`mun-credit-${field}`}
                        type={field === 'sourceUrl' || field === 'licenseUrl' ? 'url' : 'text'}
                        value={value}
                        onChange={(event) =>
                          onChange({
                            ...form,
                            imageAttribution: {
                              ...form.imageAttribution,
                              [field]: event.target.value,
                            },
                          })
                        }
                      />
                    </Field>
                  );
                },
              )}
            </div>
            {(['descripcion', 'imagenAlt', 'ubicacion', 'mejorEpoca', 'consejos'] as const).map(
              (field) => (
                <LocalizedField
                  key={field}
                  resource="municipality"
                  field={field}
                  translations={form.translations}
                  onTranslationsChange={(translations) => onChange({ ...form, translations })}
                  label={
                    {
                      descripcion: 'Descripción',
                      imagenAlt: 'Texto alternativo de la foto',
                      ubicacion: 'Provincia o ubicación',
                      mejorEpoca: 'Mejor época',
                      consejos: 'Consejos prácticos',
                    }[field]
                  }
                  htmlFor={`mun-${field}`}
                >
                  <textarea
                    id={`mun-${field}`}
                    rows={field === 'descripcion' ? 5 : 2}
                    value={form[field] || ''}
                    onChange={(event) => onChange({ ...form, [field]: event.target.value })}
                  />
                </LocalizedField>
              ),
            )}
            <Field label="Web oficial" htmlFor="mun-website">
              <input
                id="mun-website"
                type="url"
                value={form.website || ''}
                onChange={(event) => onChange({ ...form, website: event.target.value })}
              />
            </Field>
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
          </div>
          {(['actividades', 'hoteles', 'restaurantes'] as const).map((kind) => (
            <div hidden={section !== kind} key={kind}>
              <MunicipalityCatalogEditor
                kind={kind}
                token={token}
                ids={form[`${kind}Ids`] || form[kind]?.map((row) => row.id) || []}
                initialRecords={form[kind]}
                onChange={(ids) => onChange({ ...form, [`${kind}Ids`]: ids })}
                onEditingChange={setCatalogEditing}
              />
            </div>
          ))}
          <p>
            Guarda el municipio para confirmar sus datos, asociaciones y orden. Su publicación se
            gestiona en Revisión editorial.
          </p>
          <Button type="submit" disabled={catalogEditing || !detailReady} loading={isSaving}>
            {t('Guardar municipio')}
          </Button>
        </fieldset>
      </form>
    </AdminModal>
  );
}
