import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function AdminSectionCard({ icon: Icon, title, description, children }: Props) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-xl bg-[var(--color-brand)]/12 text-[var(--color-brand-dark)] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <div>
          <h3 className="font-semibold text-[var(--color-primary)]">{title}</h3>
          {description && <p className="text-sm text-[var(--color-muted)] mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
