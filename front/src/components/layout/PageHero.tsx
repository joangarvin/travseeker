import type { ReactNode } from 'react';

interface PageHeroProps {
  icon: ReactNode;
  title: string;
  description: string;

  action?: ReactNode;
}

export default function PageHero({
  icon,
  title,
  description,
  action,
}: PageHeroProps) {
  return (
    <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 border-b border-[var(--color-border)] bg-[var(--color-surface)]/20 backdrop-blur-sm overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {icon}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-primary)] tracking-tight">
              {title}
            </h1>
          </div>
          <p className="text-[var(--color-muted)] text-base sm:text-lg font-light">{description}</p>
        </div>
        {action}
      </div>
    </section>
  );
}
