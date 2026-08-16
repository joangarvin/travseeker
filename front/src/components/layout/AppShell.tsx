import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';
import { EmailVerificationBanner } from '../../features/auth/components/EmailVerificationBanner';

const ROUTES_WITHOUT_FOOTER = ['/auth', '/recuperar', '/verificar-email', '/admin'];

type AppShellProps = {
  children: ReactNode;
  footer?: boolean;
};

export function AppShell({ children, footer = true }: AppShellProps) {
  const location = useLocation();
  const shouldShowFooter = footer && !ROUTES_WITHOUT_FOOTER.includes(location.pathname);

  return (
    <>
      <a className="skip" href="#main">
        Saltar al contenido
      </a>
      <SiteHeader />
      <EmailVerificationBanner />
      <main id="main" className="route-surface" tabIndex={-1}>
        {children}
      </main>
      {shouldShowFooter && <SiteFooter />}
    </>
  );
}
