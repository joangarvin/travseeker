import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Field } from '../../../components/ui';
import type { Activity } from '../../../types';
import { activityIconChoices, activityIconRegistry } from '../../activities/activities';

type ActivityEditorModalProps = {
  initial: Partial<Activity>;
  isSaving: boolean;
  onSave: (activity: Partial<Activity>) => Promise<void>;
  onClose: () => void;
};

export function ActivityEditorModal({
  initial,
  isSaving,
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
      title={form.id ? `Editar ${form.name}` : 'Crear una actividad'}
      subtitle="El nombre y el icono se utilizarán en filtros, destinos y comparaciones."
      onClose={onClose}
    >
      <form className="activity-editor" onSubmit={submit}>
        <Field label="Nombre de la actividad" htmlFor="activity-name">
          <input
            id="activity-name"
            data-autofocus
            autoFocus
            value={form.name || ''}
            maxLength={80}
            required
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </Field>

        <fieldset className="activity-icon-picker">
          <legend>Icono</legend>
          <p>Elige el símbolo que mejor permita reconocer la actividad.</p>
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
                  <span>{label}</span>
                  {selected && <Check aria-hidden />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="form-grid">
          <Field
            label="Orden"
            htmlFor="activity-order"
            hint="Los números menores aparecen primero."
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
              <b>Actividad visible</b>
              <small>Aparece en filtros y selectores públicos.</small>
            </span>
          </label>
        </div>

        <footer className="modal-actions">
          <Button type="button" variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSaving}>
            {form.id ? 'Guardar cambios' : 'Crear actividad'}
          </Button>
        </footer>
      </form>
    </AdminModal>
  );
}
