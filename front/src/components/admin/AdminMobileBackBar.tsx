import { ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function AdminMobileBackBar({ onBack }: Props) {
  return (
    <div className="lg:hidden sticky top-[var(--header-height,56px)] z-[3000] bg-[var(--color-secondary)] border-b border-[var(--color-border)] px-4 py-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a la lista
      </button>
    </div>
  );
}
