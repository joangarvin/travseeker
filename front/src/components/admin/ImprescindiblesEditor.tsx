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
    <div className="space-y-4">
      {sections.map((section, si) => (
        <div
          key={si}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 space-y-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex-1">
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
              className="mt-7 p-2 rounded-lg text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 touch-target shrink-0"
              aria-label="Eliminar sección"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
              Qué no te puedes perder
            </p>
            {section.items.map((item, ii) => (
              <div key={ii} className="flex gap-2 items-start">
                <span className="mt-3.5 w-2 h-2 rounded-full bg-[var(--color-brand)] shrink-0" />
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(si, ii, e.target.value)}
                  placeholder="Escribe un lugar, actividad o experiencia"
                  className={`${adminInputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => removeItem(si, ii)}
                  className="mt-2 p-2 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 touch-target shrink-0"
                  aria-label="Quitar punto"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem(si)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-dark)] hover:underline px-1 py-2"
            >
              <Plus className="w-4 h-4" />
              Añadir otro punto
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addSection}
        className="w-full py-3 rounded-xl border border-dashed border-[var(--color-border-strong)] text-sm font-medium text-[var(--color-primary)] hover:border-[var(--color-brand)] hover:bg-[var(--color-brand)]/5 transition-colors"
      >
        + Añadir otra categoría
      </button>
    </div>
  );
}
