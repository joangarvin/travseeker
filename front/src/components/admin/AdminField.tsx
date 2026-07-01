import type { ReactNode } from 'react';

interface Props {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export default function AdminField({ label, hint, required, children, className = '' }: Props) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <label className="block text-sm font-semibold text-[var(--color-primary)]">
        {label}
        {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-[var(--color-muted)] leading-relaxed">{hint}</p>}
    </div>
  );
}

export const adminInputClass =
  'w-full px-3.5 py-3 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-secondary)] text-[var(--color-primary)] text-base sm:text-sm placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/35';

export const adminSelectClass =
  'w-full px-3.5 py-3 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-secondary)] text-[var(--color-primary)] text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/35 appearance-none cursor-pointer';

export const adminTextareaClass =
  'w-full px-3.5 py-3 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-secondary)] text-[var(--color-primary)] text-base sm:text-sm leading-relaxed placeholder:text-[var(--color-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]/35 resize-y min-h-[120px]';
