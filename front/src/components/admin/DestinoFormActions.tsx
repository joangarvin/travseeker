import { Save } from 'lucide-react';

interface Props {
  editing: boolean;
  saving: boolean;
  onCancel: () => void;
}

export default function DestinoFormActions({ editing, saving, onCancel }: Props) {
  return (
    <>
      <div className="hidden lg:flex gap-3 pt-2">
        {editing && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-[var(--color-border-strong)] text-[var(--color-primary)] font-medium"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Publicar destino'}
        </button>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[4000] p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur safe-bottom">
        <div className="flex gap-2 max-w-lg mx-auto">
          {editing && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-[var(--color-border-strong)] font-medium text-[var(--color-primary)]"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-[2] inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>
    </>
  );
}
