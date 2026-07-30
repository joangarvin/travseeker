import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { CompareProvider, AuthProvider, ThemeProvider } from './lib/state';
import { Empty, Loader, Shell } from './components/ui';

const Home = lazy(() => import('./pages/Home'));
const Destination = lazy(() => import('./pages/Destination'));
const MapPage = lazy(() => import('./pages/MapPage'));
const Compare = lazy(() => import('./pages/Compare'));
const About = lazy(() => import('./pages/About'));
const Profile = lazy(() => import('./pages/Profile'));
const Admin = lazy(() => import('./pages/Admin'));
const AuthPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.AuthPage })));
const RecoveryPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.RecoveryPage })));
const VerifyPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.VerifyPage })));
const FavoritesPage = lazy(() => import('./pages/LibraryPages').then((module) => ({ default: module.FavoritesPage })));
const CollectionsPage = lazy(() => import('./pages/LibraryPages').then((module) => ({ default: module.CollectionsPage })));
const CollectionPage = lazy(() => import('./pages/LibraryPages').then((module) => ({ default: module.CollectionPage })));

function NotFound() {
  return <Shell><section className="status-page"><Empty headingLevel="h1" icon={<Compass />} title="Esta ruta no aparece en la guía" action={<Link className="button button--primary" to="/">Volver a descubrir</Link>}>Puede que el enlace haya cambiado o que el destino ya no esté disponible.</Empty></section></Shell>;
}

function AccessibilityEffects() {
  useEffect(() => {
    let overlay: HTMLElement | null = null;
    let returnFocus: HTMLElement | null = null;
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const inspect = () => {
      const next = document.querySelector<HTMLElement>('[role="dialog"], .mobile-menu');
      if (next && next !== overlay) {
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        overlay = next;
        queueMicrotask(() => overlay?.querySelector<HTMLElement>(selector)?.focus());
      } else if (!next && overlay) {
        overlay = null;
        returnFocus?.focus();
        returnFocus = null;
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (!overlay) return;
      if (event.key === 'Escape') {
        const close = overlay.querySelector<HTMLButtonElement>('.modal__close');
        if (close) { event.preventDefault(); close.click(); }
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...overlay.querySelectorAll<HTMLElement>(selector)].filter((element) => !element.hidden && element.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const observer = new MutationObserver(inspect);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener('keydown', onKeyDown);
    return () => { observer.disconnect(); document.removeEventListener('keydown', onKeyDown); };
  }, []);
  return null;
}

export default function App() {
  return <ThemeProvider><AuthProvider><CompareProvider><BrowserRouter><AccessibilityEffects /><Suspense fallback={<div className="app-loader"><Loader label="Preparando TravSeeker" /></div>}><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/destino/:id" element={<Destination />} />
    <Route path="/mapa" element={<MapPage />} />
    <Route path="/comparar" element={<Compare />} />
    <Route path="/favoritos" element={<FavoritesPage />} />
    <Route path="/colecciones" element={<CollectionsPage />} />
    <Route path="/colecciones/:id" element={<CollectionPage />} />
    <Route path="/viaje/:shareToken" element={<CollectionPage publicView />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="/recuperar" element={<RecoveryPage />} />
    <Route path="/verificar-email" element={<VerifyPage />} />
    <Route path="/perfil" element={<Profile />} />
    <Route path="/sobre-nosotros" element={<About />} />
    <Route path="/admin" element={<Admin />} />
    <Route path="*" element={<NotFound />} />
  </Routes></Suspense></BrowserRouter></CompareProvider></AuthProvider></ThemeProvider>;
}
