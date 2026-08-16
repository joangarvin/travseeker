import { lazy, Suspense } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Shell } from '../components/layout';
import { Empty, Loader } from '../components/ui';
import { PageMeta } from '../components/layout/PageMeta';

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
  const location = useLocation();
  const isDestinationRoute = location.pathname.startsWith('/destino/');
  const canonical =
    typeof window === 'undefined' ? undefined : `${window.location.origin}${location.pathname}`;
  const routeMeta = location.pathname.startsWith('/mapa')
    ? ['El mapa', 'Explora destinos de TravSeeker sobre el mapa.']
    : location.pathname.startsWith('/comparar')
      ? ['Comparar destinos', 'Compara presupuesto, afluencia y mejor momento para viajar.']
      : location.pathname.startsWith('/sobre-nosotros')
        ? ['Sobre TravSeeker', 'Una guía independiente para decidir mejor tus viajes.']
        : location.pathname.startsWith('/auth')
          ? ['Entrar en TravSeeker', 'Guarda destinos, compara opciones y organiza tus viajes.']
          : location.pathname.startsWith('/recuperar')
            ? ['Recuperar contraseña — TravSeeker', 'Recupera el acceso a tu cuenta de TravSeeker.']
            : location.pathname.startsWith('/verificar-email')
              ? [
                  'Verificar email — TravSeeker',
                  'Confirma tu email para activar todas las funciones.',
                ]
              : location.pathname.startsWith('/favoritos')
                ? ['Destinos guardados', 'Tus destinos favoritos en un solo lugar.']
                : location.pathname.startsWith('/colecciones') ||
                    location.pathname.startsWith('/viaje/')
                  ? ['Tus viajes', 'Organiza y comparte tus ideas de viaje.']
                  : location.pathname.startsWith('/perfil')
                    ? ['Tu perfil', 'Configura tus preferencias de viaje.']
                    : location.pathname.startsWith('/admin')
                      ? ['Administración', 'Gestiona el contenido de TravSeeker.']
                      : location.pathname !== '/'
                        ? [
                            'Página no encontrada — TravSeeker',
                            'La ruta solicitada no está disponible.',
                          ]
                        : [
                            'TravSeeker — encuentra tu próximo lugar',
                            'Descubre destinos españoles por presupuesto, temporada y afluencia.',
                          ];
  return (
    <>
      {!isDestinationRoute && (
        <PageMeta title={routeMeta[0]} description={routeMeta[1]} canonical={canonical} />
      )}
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
    </>
  );
}
