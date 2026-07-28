import { Plus, Trash2 } from 'lucide-react';
import type { ImprescindibleSection } from '../../types/admin';
import AdminField, { adminInputClass } from './AdminField';

interface Props {
  sections: ImprescindibleSection[];
  onChange: (sections: ImprescindibleSection[]) => void;
}

export default function ImprescindiblesEditor({ sections, onChange }: Props) {
  const updateSection = (index: number, patch: Partial<ImprescindibleSection>) => {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const updateItem = (sectionIndex: number, itemIndex: number, value: string) => {
    const next = sections.map((s, i) => {
      if (i !== sectionIndex) return s;
      const items = [...s.items];
      items[itemIndex] = value;
      return { ...s, items };
    });
    onChange(next);
  };

  const addItem = (sectionIndex: number) => {
    const next = sections.map((s, i) =>
      i === sectionIndex ? { ...s, items: [...s.items, ''] } : s,
    );
    onChange(next);
  };

  const removeItem = (sectionIndex: number, itemIndex: number) => {
    const next = sections.map((s, i) => {
      if (i !== sectionIndex) return s;
      const items = s.items.filter((_, j) => j !== itemIndex);
      return { ...s, items: items.length > 0 ? items : [''] };
    });
    onChange(next);
  };

  const addSection = () => {
    onChange([...sections, { title: '', items: [''] }]);
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) {
      onChange([{ title: '', items: [''] }]);
      return;
    }
    onChange(sections.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-form__stack">
      {sections.map((section, si) => (
        <div key={si} className="admin-imp-section">
          <div className="admin-imp-section__head">
            <div className="admin-imp-section__field">
              <AdminField
                label={si === 0 ? 'Título de la sección' : `Sección ${si + 1}`}
                hint="Ej: Gastronomía, Naturaleza, Pueblos con encanto…"
              >
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(si, { title: e.target.value })}
                  placeholder="Nombre de la categoría"
                  className={adminInputClass}
                />
              </AdminField>
            </div>
            <button
              type="button"
              onClick={() => removeSection(si)}
              className="admin-imp-section__remove touch-target"
              aria-label="Eliminar sección"
            >
              <Trash2 className="icon-sm" />
            </button>
          </div>

          <div className="admin-form__stack">
            <p className="admin-imp-items__label">Qué no te puedes perder</p>
            {section.items.map((item, ii) => (
              <div key={ii} className="admin-imp-item">
                <span className="admin-imp-item__bullet" />
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(si, ii, e.target.value)}
                  placeholder="Escribe un lugar, actividad o experiencia"
                  className={`${adminInputClass} admin-input--grow`}
                />
                <button
                  type="button"
                  onClick={() => removeItem(si, ii)}
                  className="admin-imp-item__remove touch-target"
                  aria-label="Quitar punto"
                >
                  <Trash2 className="icon-sm" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => addItem(si)} className="admin-imp-add-item">
              <Plus className="icon-sm" />
              Añadir otro punto
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={addSection} className="admin-imp-add-section">
        + Añadir otra categoría
      </button>
    </div>
  );
}
