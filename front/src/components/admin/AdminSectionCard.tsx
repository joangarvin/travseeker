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
    <section className="admin-section-card">
      <div className="admin-section-card__head">
        <span className="admin-section-card__icon">
          <Icon className="icon-md" />
        </span>
        <div>
          <h3 className="admin-section-card__title">{title}</h3>
          {description && <p className="admin-section-card__desc">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
