import { Building2, MapPin, MessageSquare } from 'lucide-react';
import type { AdminTab } from '../types';

type AdminNavigationProps = {
  activeTab: AdminTab;
  counts: Record<AdminTab, number>;
  onChange: (tab: AdminTab) => void;
};

const tabs = [
  { id: 'destinos', label: 'Destinos', Icon: MapPin },
  { id: 'municipios', label: 'Municipios', Icon: Building2 },
  { id: 'reviews', label: 'Reseñas', Icon: MessageSquare },
  { id: 'places', label: 'Lugares', Icon: MapPin },
] as const;

export function AdminNavigation({ activeTab, counts, onChange }: AdminNavigationProps) {
  return (
    <nav className="admin-nav" aria-label="Administración">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          className={activeTab === id ? 'is-active' : ''}
          onClick={() => onChange(id)}
          aria-current={activeTab === id ? 'page' : undefined}
        >
          <Icon /> {label}
          <span>{counts[id]}</span>
        </button>
      ))}
    </nav>
  );
}
