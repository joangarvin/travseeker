import { useState, type FormEvent } from 'react';
import { Check } from 'lucide-react';
import { AdminModal } from '../../../components/admin/AdminModal';
import { Button, Field } from '../../../components/ui';
import type { TourismType } from '../../../types';
import {
  tourismColorChoices,
  tourismColorStyle,
  tourismIconChoices,
  tourismIconRegistry,
} from '../../tourism/tourism';

export function TourismTypeEditorModal({
  initial,
  isSaving,
  onSave,
  onClose,
}: {
  initial: Partial<TourismType>;
  isSaving: boolean;
  onSave: (type: Partial<TourismType>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<TourismType>>({
    icon: 'Compass',
    colorKey: 'otro',
    colorValue: '#5f6470',
    description: '',
    sortOrder: 0,
    isActive: true,
    ...initial,
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void onSave(form);
  };
  const currentColor = /^#[0-9a-f]{6}$/i.test(form.colorValue || '') ? form.colorValue! : '#5f6470';
  const PreviewIcon = tourismIconRegistry[form.icon || 'Compass'] || tourismIconRegistry.Compass;
  return (
    <AdminModal
      title={form.id ? `Editar ${form.name}` : 'Crear un tipo de viaje'}
      subtitle="Define cómo se reconoce este tipo en tarjetas, filtros, mapas y comparaciones."
      onClose={onClose}
    >
      <form className="activity-editor" onSubmit={submit}>
        <Field label="Nombre" htmlFor="tourism-type-name">
          <input
            id="tourism-type-name"
            data-autofocus
            autoFocus
            required
            maxLength={80}
            value={form.name || ''}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </Field>
        <Field
          label="Descripción breve"
          htmlFor="tourism-type-description"
          hint="Explica qué experiencia reúne, sin lenguaje publicitario."
        >
          <input
            id="tourism-type-description"
            maxLength={180}
            value={form.description || ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </Field>

        <fieldset className="activity-icon-picker tourism-icon-picker">
          <legend>Icono</legend>
          <div>
            {tourismIconChoices.map(([iconName, label]) => {
              const Icon = tourismIconRegistry[iconName];
              const selected = form.icon === iconName;
              return (
                <label className={selected ? 'is-selected' : ''} key={iconName}>
                  <input
                    className="sr-only"
                    type="radio"
                    name="tourism-icon"
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

        <fieldset className="tourism-color-picker">
          <legend>Color identificativo</legend>
          <p>Escoge un color visualmente o escribe su código hexadecimal.</p>
          <div className="tourism-color-picker__custom">
            <label className="tourism-color-picker__well">
              <span className="sr-only">Abrir paleta de color</span>
              <input
                type="color"
                value={currentColor}
                onChange={(event) =>
                  setForm({ ...form, colorKey: 'otro', colorValue: event.target.value })
                }
              />
            </label>
            <Field label="Código de color" htmlFor="tourism-color-code">
              <input
                id="tourism-color-code"
                value={form.colorValue || ''}
                pattern="#[0-9a-fA-F]{6}"
                placeholder="#3047f2"
                required
                onChange={(event) =>
                  setForm({ ...form, colorKey: 'otro', colorValue: event.target.value })
                }
              />
            </Field>
            <span className="tourism-color-picker__preview" style={tourismColorStyle(currentColor)}>
              <span aria-hidden>
                <PreviewIcon />
              </span>
              Vista previa
            </span>
          </div>
          <div className="tourism-color-picker__presets" aria-label="Colores sugeridos">
            {tourismColorChoices.map(([colorKey, label, colorValue]) => (
              <button
                type="button"
                aria-pressed={currentColor.toLowerCase() === colorValue}
                onClick={() => setForm({ ...form, colorKey, colorValue })}
                key={colorKey}
              >
                <span style={{ backgroundColor: colorValue }} aria-hidden />
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="form-grid">
          <Field label="Orden" htmlFor="tourism-type-order">
            <input
              id="tourism-type-order"
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
              <b>Tipo visible</b>
              <small>Aparece en filtros y selectores públicos.</small>
            </span>
          </label>
        </div>
        <footer className="modal-actions">
          <Button type="button" variant="quiet" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" loading={isSaving}>
            {form.id ? 'Guardar cambios' : 'Crear tipo'}
          </Button>
        </footer>
      </form>
    </AdminModal>
  );
}
