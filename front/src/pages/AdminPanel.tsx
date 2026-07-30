import { useState } from 'react';
import { Building2, MapPin, MapPinned, MessageSquare, ShieldCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageHero from '../components/layout/PageHero';
import AdminMobileBackBar from '../components/admin/AdminMobileBackBar';
import AdminWorkspace from '../components/admin/AdminWorkspace';
import { useAdminPanel } from '../hooks/useAdminPanel';
import { useAdminMunicipios } from '../hooks/useAdminMunicipios';
import type { AdminTab } from '../types/admin';
import AdminReviews from '../components/admin/AdminReviews';
import AdminPlaces from '../components/admin/AdminPlaces';

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('destinos');
  const destinos = useAdminPanel();
  const municipios = useAdminMunicipios(true);

  const showForm =
    (tab === 'destinos' && destinos.showForm) || (tab === 'municipios' && municipios.showForm);

  const handleBack = () => {
    if (tab === 'destinos') destinos.cancelForm();
    else if (tab === 'municipios') municipios.cancelForm();
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
    <div className="admin-page">
      <Header />

      <div className={showForm ? 'admin-page__hero--hidden-mobile' : undefined}>
        <PageHero
          icon={<ShieldCheck className="admin-page__hero-icon" />}
          title="Panel de administración"
          description="Gestiona destinos y municipios de forma sencilla, sin tecnicismos."
        />
      </div>

      {showForm && <AdminMobileBackBar onBack={handleBack} />}

      <div className="admin-page__tabs-wrap">
        <div className="admin-tabs" role="tablist" aria-label="Sección del panel">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'destinos'}
            onClick={() => handleTabChange('destinos')}
            className={`admin-tabs__tab${tab === 'destinos' ? ' admin-tabs__tab--active' : ''}`}
          >
            <MapPinned className="icon-sm" />
            Destinos
          </button>
          <button type="button" role="tab" aria-selected={tab === 'reviews'} onClick={() => handleTabChange('reviews')} className={`admin-tabs__tab${tab === 'reviews' ? ' admin-tabs__tab--active' : ''}`}><MessageSquare className="icon-sm" /> Reseñas</button>
          <button type="button" role="tab" aria-selected={tab === 'places'} onClick={() => handleTabChange('places')} className={`admin-tabs__tab${tab === 'places' ? ' admin-tabs__tab--active' : ''}`}><MapPin className="icon-sm" /> Lugares</button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'municipios'}
            onClick={() => handleTabChange('municipios')}
            className={`admin-tabs__tab${tab === 'municipios' ? ' admin-tabs__tab--active' : ''}`}
          >
            <Building2 className="icon-sm" />
            Municipios
          </button>
        </div>
      </div>

      <div className="admin-page__workspace">
        {tab === 'reviews' ? <AdminReviews /> : tab === 'places' ? <AdminPlaces destinos={destinos.filtered} /> : <AdminWorkspace
          tab={tab}
          onTabChange={handleTabChange}
          destinos={destinos}
          municipios={municipios}
          catalog={municipios.rows}
        />}
      </div>

      <div className={`admin-page__footer${showForm ? ' admin-page__footer--hidden' : ''}`}>
        <Footer />
      </div>
    </div>
  );
}
