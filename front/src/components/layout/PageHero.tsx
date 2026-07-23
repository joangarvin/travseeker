import type { ReactNode } from 'react';

interface PageHeroProps {
  icon?: ReactNode;
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function PageHero({
  icon,
  eyebrow,
  title,
  description,
  action,
}: PageHeroProps) {
  return (
    <section className="relative pt-24 sm:pt-28 pb-8 sm:pb-10 px-4 sm:px-6 border-b border-[var(--color-border)] overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto flex flex-wrap items-end justify-between gap-5">
        <div className="min-w-0">
          {eyebrow && (
            <span className="field-label text-[var(--color-teja)] mb-3 block">{eyebrow}</span>
          )}
          <div className="flex items-center gap-3 mb-2">
            {icon && <span className="text-[var(--color-brand)] shrink-0">{icon}</span>}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-primary)] tracking-tight leading-[1.08]">
              {title}
            </h1>
          </div>
          <p className="text-[var(--color-muted)] text-base sm:text-lg max-w-xl leading-relaxed">{description}</p>
        </div>
        {action}
      </div>
    </section>
  );
}
