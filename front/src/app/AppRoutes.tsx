import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Shell } from '../components/layout';
import { Empty, Loader } from '../components/ui';

const HomePage = lazy(() => import('../pages/home/HomePage'));
const DestinationPage = lazy(() => import('../pages/destination/DestinationPage'));
const MapPage = lazy(() => import('../pages/map/MapPage'));
const ComparePage = lazy(() => import('../pages/compare/ComparePage'));
const AboutPage = lazy(() => import('../pages/about/AboutPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const AdminPage = lazy(() => import('../pages/admin/AdminPage'));
const AuthPage = lazy(() => import('../pages/auth/AuthPage'));
const RecoveryPage = lazy(() => import('../pages/auth/RecoveryPage'));
const VerifyEmailPage = lazy(() => import('../pages/auth/VerifyEmailPage'));
const FavoritesPage = lazy(() => import('../pages/library/FavoritesPage'));
const CollectionsPage = lazy(() => import('../pages/library/CollectionsPage'));
const CollectionPage = lazy(() => import('../pages/library/CollectionPage'));

function NotFoundPage() {
  return (
    <Shell>
      <section className="status-page">
        <Empty
          headingLevel="h1"
          icon={<Compass />}
          title="Esta ruta no aparece en la guía"
          action={
            <Link className="button button--primary" to="/">
              Volver a descubrir
            </Link>
          }
        >
          Puede que el enlace haya cambiado o que el destino ya no esté disponible.
        </Empty>
      </section>
    </Shell>
  );
}

export function AppRoutes() {
  return (
    <Suspense
      fallback={
        <div className="app-loader">
          <Loader label="Preparando TravSeeker" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/destino/:id" element={<DestinationPage />} />
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/comparar" element={<ComparePage />} />
        <Route path="/favoritos" element={<FavoritesPage />} />
        <Route path="/colecciones" element={<CollectionsPage />} />
        <Route path="/colecciones/:id" element={<CollectionPage />} />
        <Route path="/viaje/:shareToken" element={<CollectionPage publicView />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/recuperar" element={<RecoveryPage />} />
        <Route path="/verificar-email" element={<VerifyEmailPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/sobre-nosotros" element={<AboutPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
