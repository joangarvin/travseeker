export default function PageLoader({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[var(--color-secondary)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[var(--color-muted)] tracking-wide">{label}</span>
      </div>
    </div>
  );
}
