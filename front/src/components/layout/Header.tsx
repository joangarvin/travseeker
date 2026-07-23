import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import logo from '../../assets/logo.png';
import ThemeToggle from '../ui/ThemeToggle';
import UserMenu from '../auth/UserMenu';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS: { to: string; label: string; hash?: boolean; auth?: boolean; admin?: boolean }[] = [
  { to: '/', label: 'Inicio' },
  { to: '/#destinos', label: 'La selección', hash: true },
  { to: '/mapa', label: 'El mapa' },
  { to: '/comparar', label: 'Cara a cara' },
  { to: '/favoritos', label: 'Tus sitios', auth: true },
  { to: '/colecciones', label: 'Tus listas', auth: true },
  { to: '/admin', label: 'Admin', auth: true, admin: true },
  { to: '/sobre-nosotros', label: 'Quiénes somos' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const navLink = (to: string, label: string, onClick?: () => void, isHash = false) => {
    const isActive = !isHash && location.pathname === to;
    const className = `block py-3.5 md:py-0 text-base md:text-sm font-medium transition-colors ${
      isActive
        ? 'text-[var(--color-primary)]'
        : 'text-[var(--color-nav)] hover:text-[var(--color-primary)]'
    }`;
    if (isHash) {
      return (
        <a key={to} href={to} onClick={onClick} className={className}>
          {label}
        </a>
      );
    }
    return (
      <Link key={to} to={to} onClick={onClick} className={className}>
        {label}
      </Link>
    );
  };

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.auth && !user) return false;
    if (item.admin && user?.role !== 'admin') return false;
    return true;
  });

  return (
    <header className="fixed top-0 left-0 right-0 z-[5000] safe-top">
      <div className="bg-[var(--color-secondary)]/95 border-b border-[var(--color-border-strong)]">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-2.5 sm:py-3 px-4 sm:px-6 md:px-8 gap-4">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0 touch-target">
            <img src={logo} alt="" className="h-8 sm:h-9 w-auto" />
            <span className="font-serif text-lg sm:text-xl font-medium text-[var(--color-primary)] tracking-tight hidden xs:inline sm:inline">
              Travseeker
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-7 flex-1 justify-end">
            <nav className="flex gap-6 text-sm">
              {visibleNav.map((item) => navLink(item.to, item.label, undefined, item.hash))}
            </nav>

            <div className="flex items-center gap-2 pl-5 ml-1 border-l border-[var(--color-border-strong)]">
              <button
                type="button"
                className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-[var(--color-muted)] border border-[var(--color-border-strong)] rounded-lg px-2.5 py-2 hover:text-[var(--color-primary)] hover:border-[var(--color-primary-light)] transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                ES
              </button>
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>

          <div className="flex md:hidden items-center gap-1">
            <UserMenu />
            <ThemeToggle />
            <button
              type="button"
              className="touch-target p-2 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 top-[var(--header-height,56px)] bg-[var(--color-primary)]/40 md:hidden"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <nav
            className="fixed left-0 right-0 top-[var(--header-height,56px)] bottom-0 md:hidden overflow-y-auto bg-[var(--color-secondary)] border-b border-[var(--color-border)] px-5 py-2 safe-bottom animate-menu-in"
            aria-label="Navegación principal"
          >
            <div className="flex flex-col">
              {visibleNav.map((item) => (
                <div key={item.to} className="border-b border-[var(--color-border)] last:border-0">
                  {navLink(item.to, item.label, () => setMobileOpen(false), item.hash)}
                </div>
              ))}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
