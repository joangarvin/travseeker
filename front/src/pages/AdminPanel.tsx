import { useState } from 'react';
import { Building2, MapPinned, ShieldCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageHero from '../components/layout/PageHero';
import AdminMobileBackBar from '../components/admin/AdminMobileBackBar';
import AdminWorkspace from '../components/admin/AdminWorkspace';
import { useAdminPanel } from '../hooks/useAdminPanel';
import { useAdminMunicipios } from '../hooks/useAdminMunicipios';
import type { AdminTab } from '../types/admin';

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('destinos');
  const destinos = useAdminPanel();
  const municipios = useAdminMunicipios(true);

  const showForm =
    (tab === 'destinos' && destinos.showForm) || (tab === 'municipios' && municipios.showForm);

  const handleBack = () => {
    if (tab === 'destinos') destinos.cancelForm();
    else municipios.cancelForm();
  };

  const handleTabChange = (next: AdminTab) => {
    if (next === tab) return;
    if (tab === 'destinos' && destinos.showForm) destinos.cancelForm();
    if (tab === 'municipios' && municipios.showForm) municipios.cancelForm();
    setTab(next);
    if (next === 'municipios') void municipios.reload();
    if (next === 'destinos') void destinos.reload();
  };

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans lg:h-dvh lg:max-h-dvh lg:overflow-hidden lg:flex lg:flex-col">
      <Header />

      <div className={`shrink-0 ${showForm ? 'hidden lg:block' : ''}`}>
        <PageHero
          icon={<ShieldCheck className="w-6 h-6 text-[var(--color-brand)]" />}
          title="Panel de administración"
          description="Gestiona destinos y municipios de forma sencilla, sin tecnicismos."
        />
      </div>

      {showForm && <AdminMobileBackBar onBack={handleBack} />}

      {/* Espaciado ajustado entre Hero y las Pestañas (pt-6 sm:pt-8 pb-4) */}
      <div className="shrink-0 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-10 pt-6 sm:pt-8 pb-4">
        <div
          className="flex gap-1 p-1 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm"
          role="tablist"
          aria-label="Sección del panel"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'destinos'}
            onClick={() => handleTabChange('destinos')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${tab === 'destinos'
                ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)] shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]'
              }`}
          >
            <MapPinned className="w-4 h-4 shrink-0" />
            Destinos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'municipios'}
            onClick={() => handleTabChange('municipios')}
            className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${tab === 'municipios'
                ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)] shadow-sm'
                : 'text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]'
              }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            Municipios
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:overflow-hidden">
        <AdminWorkspace
          tab={tab}
          onTabChange={handleTabChange}
          destinos={destinos}
          municipios={municipios}
          catalog={municipios.rows}
        />
      </div>

      <div className={`shrink-0 ${showForm ? 'hidden' : ''} lg:hidden`}>
        <Footer />
      </div>
    </div>
  );
}