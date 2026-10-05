import { LocalizedField } from './LocalizedField';
import { t } from '../../../i18n';
import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Field } from '../../../components/ui';
import type { Activity } from '../../../types';
import { activityIconChoices, activityIconRegistry } from '../../activities/activities';

type ActivityEditorModalProps = {
  initial: Partial<Activity>;
  isSaving: boolean;
  error?: string;
  onSave: (activity: Partial<Activity>) => Promise<void>;
  onClose: () => void;
};

export function ActivityEditorModal({
  initial,
  isSaving,
  error,
  onSave,
  onClose,
}: ActivityEditorModalProps) {
  const [form, setForm] = useState<Partial<Activity>>({
    icon: 'Compass',
    sortOrder: 0,
    isActive: true,
    ...initial,
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onSave(form);
  };

  return (
    <AdminModal
      draft={form}
      draftKey={`activity:${form.id || 'new'}`}
      onRestore={setForm}
      busy={isSaving}
      error={error}
      title={form.id ? t('Editar {0}', { 0: form.name }) : t('Crear una actividad')}
      subtitle={t('El nombre y el icono se utilizarán en filtros, destinos y comparaciones.')}
      onClose={onClose}
    >
      <form className="activity-editor" onSubmit={submit}>
        <LocalizedField
          resource="activity"
          field="name"
          translations={form.translations}
          onTranslationsChange={(translations) => setForm({ ...form, translations })}
          label={t('Nombre de la actividad')}
          htmlFor="activity-name"
        >
          <input
            id="activity-name"
            data-autofocus
            autoFocus
            value={form.name || ''}
            maxLength={80}
            required
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </LocalizedField>

        <fieldset className="activity-icon-picker">
          <legend>{t('Icono')}</legend>
          <p>{t('Elige el símbolo que mejor permita reconocer la actividad.')}</p>
          <div>
            {activityIconChoices.map(([iconName, label]) => {
              const Icon = activityIconRegistry[iconName];
              const selected = form.icon === iconName;
              return (
                <label className={selected ? 'is-selected' : ''} key={iconName}>
                  <input
                    className="sr-only"
                    type="radio"
                    name="activity-icon"
                    value={iconName}
                    checked={selected}
                    onChange={() => setForm({ ...form, icon: iconName })}
                  />
                  <Icon aria-hidden />
                  <span>{t(label)}</span>
                  {selected && <Check aria-hidden />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="form-grid">
          <Field
            label={t('Orden')}
            htmlFor="activity-order"
            hint={t('Los números menores aparecen primero.')}
          >
            <input
              id="activity-order"
              type="number"
              value={form.sortOrder ?? 0}
              onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}
            />
          </Field>
          <label className="activity-editor__status">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
            />
            <span>
              <b>{t('Actividad visible')}</b>
              <small>{t('Aparece en filtros y selectores públicos.')}</small>
            </span>
          </label>
        </div>

        <footer className="modal-actions">
          <Button type="button" variant="quiet" data-close-editor="true">
            {t('Cancelar')}
          </Button>
          <Button type="submit" loading={isSaving}>
            {form.id ? t('Guardar cambios') : t('Crear actividad')}
          </Button>
        </footer>
      </form>
    </AdminModal>
  );
}
