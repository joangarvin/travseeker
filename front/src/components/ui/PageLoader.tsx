export default function PageLoader({ label = 'Abriendo el cuaderno…' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-[var(--color-secondary)] flex items-center justify-center grain">
      <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
        <div
          className="w-14 h-14 rounded-full border-2 border-[var(--color-teja)] flex items-center justify-center rotate-[-8deg]"
          aria-hidden
        >
          <span className="font-mono text-[10px] tracking-widest text-[var(--color-teja)]">TS</span>
        </div>
        <div className="w-8 h-8 border-2 border-[var(--color-brand)] border-t-transparent rounded-full animate-spin" />
        <p className="font-serif text-lg text-[var(--color-primary)] tracking-tight">{label}</p>
      </div>
    </div>
  );
}
