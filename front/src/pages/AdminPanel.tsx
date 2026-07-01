import { ShieldCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageHero from '../components/layout/PageHero';
import AdminMobileBackBar from '../components/admin/AdminMobileBackBar';
import AdminWorkspace from '../components/admin/AdminWorkspace';
import { useAdminPanel } from '../hooks/useAdminPanel';

export default function AdminPanel() {
  const panel = useAdminPanel();

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans lg:h-dvh lg:max-h-dvh lg:overflow-hidden lg:flex lg:flex-col">
      <Header />

      <div className={`shrink-0 ${panel.showForm ? 'hidden lg:block' : ''}`}>
        <PageHero
          icon={<ShieldCheck className="w-6 h-6 text-[var(--color-brand)]" />}
          title="Panel de administración"
          description="Añade y edita destinos de forma sencilla, sin tecnicismos."
        />
      </div>

      {panel.showForm && <AdminMobileBackBar onBack={panel.cancelForm} />}

      <div className="flex-1 min-h-0 flex flex-col lg:overflow-hidden">
        <AdminWorkspace {...panel} />
      </div>

      <div className={`shrink-0 ${panel.showForm ? 'hidden' : ''} lg:hidden`}>
        <Footer />
      </div>
    </div>
  );
}
