import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { SiteFooter } from './SiteFooter';
import { SiteHeader } from './SiteHeader';

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
      <main id="main" tabIndex={-1}>{children}</main>
      {shouldShowFooter && <SiteFooter />}
    </>
  );
}
