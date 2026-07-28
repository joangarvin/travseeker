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
    <section className="page-hero">
      <div className="page-hero__inner">
        <div className="page-hero__main">
          {eyebrow && (
            <span className="page-hero__eyebrow field-label">{eyebrow}</span>
          )}
          <div className="page-hero__row">
            {icon && <span className="page-hero__icon">{icon}</span>}
            <h1 className="page-hero__title">
              {title}
            </h1>
          </div>
          <p className="page-hero__description">{description}</p>
        </div>
        {action}
      </div>
    </section>
  );
}
