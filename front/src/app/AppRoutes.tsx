import { t } from '../i18n';
import { lazy, Suspense } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Shell } from '../components/layout';
import { Empty, Loader } from '../components/ui';
import { PageMeta } from '../components/layout/PageMeta';

const LegalPage = lazy(() => import('../pages/legal/LegalPage'));
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
          title={t('Esta ruta no aparece en la guía')}
          action={
            <Link className="button button--primary" to="/">
              {t('Volver a descubrir')}
            </Link>
          }
        >
          {t('Puede que el enlace haya cambiado o que el destino ya no esté disponible.')}
        </Empty>
      </section>
    </Shell>
  );
}

export function AppRoutes() {
  const location = useLocation();
  const isDestinationRoute =
    location.pathname.startsWith('/destino/') ||
    ['/cookies', '/privacidad', '/aviso-legal'].includes(location.pathname);
  const canonical =
    typeof window === 'undefined' ? undefined : `${window.location.origin}${location.pathname}`;
  const routeMeta = location.pathname.startsWith('/mapa')
    ? [t('El mapa'), t('Explora destinos de TravSeeker sobre el mapa.')]
    : location.pathname.startsWith('/comparar')
      ? [t('Comparar destinos'), t('Compara presupuesto, afluencia y mejor momento para viajar.')]
      : location.pathname.startsWith('/sobre-nosotros')
        ? [t('Sobre TravSeeker'), t('Una guía independiente para decidir mejor tus viajes.')]
        : location.pathname.startsWith('/auth')
          ? [
              t('Entrar en TravSeeker'),
              t('Guarda destinos, compara opciones y organiza tus viajes.'),
            ]
          : location.pathname.startsWith('/recuperar')
            ? [
                t('Recuperar contraseña — TravSeeker'),
                t('Recupera el acceso a tu cuenta de TravSeeker.'),
              ]
            : location.pathname.startsWith('/verificar-email')
              ? [
                  t('Verificar email — TravSeeker'),
                  t('Confirma tu email para activar todas las funciones.'),
                ]
              : location.pathname.startsWith('/favoritos')
                ? [t('Destinos guardados'), t('Tus destinos favoritos en un solo lugar.')]
                : location.pathname.startsWith('/colecciones') ||
                    location.pathname.startsWith('/viaje/')
                  ? [t('Tus viajes'), t('Organiza y comparte tus ideas de viaje.')]
                  : location.pathname.startsWith('/perfil')
                    ? [t('Tu perfil'), t('Configura tus preferencias de viaje.')]
                    : location.pathname.startsWith('/admin')
                      ? [t('Administración'), t('Gestiona el contenido de TravSeeker.')]
                      : location.pathname !== '/'
                        ? [
                            t('Página no encontrada — TravSeeker'),
                            t('La ruta solicitada no está disponible.'),
                          ]
                        : [
                            t('TravSeeker — encuentra tu próximo lugar'),
                            t(
                              'Descubre destinos españoles por presupuesto, temporada y afluencia.',
                            ),
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
          <Route path="/cookies" element={<LegalPage />} />
          <Route path="/privacidad" element={<LegalPage />} />
          <Route path="/aviso-legal" element={<LegalPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
