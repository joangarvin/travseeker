import { Building2, Compass, MapPin, MessageSquare, Signpost } from 'lucide-react';
import type { AdminTab } from '../types';

type AdminNavigationProps = {
  activeTab: AdminTab;
  counts: Record<AdminTab, number>;
  onChange: (tab: AdminTab) => void;
};

const tabs = [
  { id: 'destinos', label: 'Destinos', Icon: MapPin },
  { id: 'tipos-viaje', label: 'Tipos de viaje', mobileLabel: 'Tipos', Icon: Signpost },
  { id: 'actividades', label: 'Actividades', Icon: Compass },
  { id: 'municipios', label: 'Municipios', Icon: Building2 },
  { id: 'reviews', label: 'Reseñas', Icon: MessageSquare },
  { id: 'places', label: 'Lugares', Icon: MapPin },
] as const;

export function AdminNavigation({ activeTab, counts, onChange }: AdminNavigationProps) {
  return (
    <nav className="admin-nav" aria-label="Administración">
      {tabs.map(({ id, label, Icon, ...tab }) => (
        <button
          key={id}
          className={activeTab === id ? 'is-active' : ''}
          onClick={() => onChange(id)}
          aria-current={activeTab === id ? 'page' : undefined}
          aria-label={label}
        >
          <Icon />
          <span className="admin-nav__label">
            <span className="admin-nav__label-long">{label}</span>
            <span className="admin-nav__label-short">
              {'mobileLabel' in tab ? tab.mobileLabel : label}
            </span>
          </span>
          <span className="admin-nav__count">{counts[id]}</span>
        </button>
      ))}
    </nav>
  );
}
