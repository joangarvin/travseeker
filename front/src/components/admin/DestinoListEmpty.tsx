import { Plus, ShieldCheck } from 'lucide-react';

interface Props {
  onCreate: () => void;
}

export default function DestinoListEmpty({ onCreate }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] p-8 text-center">
      <p className="text-[var(--color-muted)] mb-4">No hay destinos todavía.</p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold"
      >
        <Plus className="w-4 h-4" />
        Crear el primero
      </button>
    </div>
  );
}

export function DestinoEditorPlaceholder({ onCreate }: Props) {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-12 text-center min-h-[420px]">
      <ShieldCheck className="w-10 h-10 text-[var(--color-brand)] mb-4" />
      <h3 className="font-semibold text-[var(--color-primary)] text-lg mb-2">
        Selecciona un destino
      </h3>
      <p className="text-sm text-[var(--color-muted)] max-w-sm mb-6">
        Haz clic en un destino de la lista para editarlo, o crea uno nuevo.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold"
      >
        <Plus className="w-4 h-4" />
        Nuevo destino
      </button>
    </div>
  );
}
