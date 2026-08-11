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
  const moveTab = (event: React.KeyboardEvent<HTMLButtonElement>, current: AdminTab) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const ids = tabs.map((tab) => tab.id);
    const currentIndex = ids.indexOf(current);
    const nextIndex = event.key === 'ArrowRight'
      ? (currentIndex + 1) % ids.length
      : (currentIndex - 1 + ids.length) % ids.length;
    const next = ids[nextIndex] as AdminTab;
    onChange(next);
    requestAnimationFrame(() => document.getElementById(`admin-tab-${next}`)?.focus());
  };

  return (
    <nav className="admin-nav" aria-label="Administración" role="tablist">
      {tabs.map(({ id, label, Icon, ...tab }) => (
        <button
          key={id}
          className={activeTab === id ? 'is-active' : ''}
          id={`admin-tab-${id}`}
          type="button"
          role="tab"
          onClick={() => onChange(id)}
          aria-selected={activeTab === id}
          aria-controls="admin-panel"
          tabIndex={activeTab === id ? 0 : -1}
          onKeyDown={(event) => moveTab(event, id)}
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
