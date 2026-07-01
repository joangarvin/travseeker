import type { ReactNode } from 'react';

interface PageHeroProps {
  icon: ReactNode;
  title: string;
  description: string;
  blobClassName?: string;
  action?: ReactNode;
}

export default function PageHero({
  icon,
  title,
  description,
  blobClassName = 'blob blob-2 opacity-40',
  action,
}: PageHeroProps) {
  return (
    <section className="relative pt-24 sm:pt-32 pb-10 sm:pb-12 px-4 sm:px-6 hero-mesh grain overflow-hidden">
      <div className={blobClassName} />
      <div className="relative z-10 max-w-7xl mx-auto flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {icon}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-white tracking-tight">
              {title}
            </h1>
          </div>
          <p className="text-white/60 text-base sm:text-lg font-light">{description}</p>
        </div>
        {action}
      </div>
    </section>
  );
}
