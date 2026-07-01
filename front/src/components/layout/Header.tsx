import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import logo from '../../assets/logo.png';
import ThemeToggle from '../ui/ThemeToggle';
import UserMenu from '../auth/UserMenu';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS: { to: string; label: string; hash?: boolean; auth?: boolean; admin?: boolean }[] = [
  { to: '/', label: 'Inicio' },
  { to: '/#destinos', label: 'Destinos', hash: true },
  { to: '/mapa', label: 'Mapa' },
  { to: '/comparar', label: 'Comparar' },
  { to: '/favoritos', label: 'Favoritos', auth: true },
  { to: '/colecciones', label: 'Colecciones', auth: true },
  { to: '/admin', label: 'Admin', auth: true, admin: true },
  { to: '/sobre-nosotros', label: 'Sobre nosotros' },
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
    const className = `block py-3 md:py-0 text-base md:text-sm font-medium transition-colors ${
      isActive
        ? 'text-[var(--color-brand-dark)] font-semibold'
        : 'text-[var(--color-primary)]/80 hover:text-[var(--color-primary)] active:text-[var(--color-brand-dark)]'
    }`;
    if (isHash) {
      return (
        <a href={to} onClick={onClick} className={className}>
          {label}
        </a>
      );
    }
    return (
      <Link to={to} onClick={onClick} className={className}>
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
      <div className="glass border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-2.5 sm:py-3 px-4 sm:px-6 md:px-10 gap-4">
          <Link to="/" className="flex items-center gap-3 group shrink-0 touch-target">
            <img src={logo} alt="Travseeker" className="h-8 sm:h-9 w-auto group-hover:scale-105 transition-transform" />
          </Link>

          <div className="hidden md:flex items-center gap-8 flex-1 justify-end">
            <nav className="flex gap-8 text-sm font-medium">
              {visibleNav.map((item) => navLink(item.to, item.label, undefined, item.hash))}
            </nav>

            <div className="flex items-center gap-3 pl-6 ml-2 border-l border-[var(--color-border-strong)]">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]/80 border border-[var(--color-border)] rounded-full px-3 py-2 hover:border-[var(--color-brand)]/40 hover:text-[var(--color-primary)] transition-colors"
              >
                <Globe className="w-4 h-4" />
                ES
              </button>
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>

          <div className="flex md:hidden items-center gap-1.5">
            <UserMenu />
            <ThemeToggle />
            <button
              type="button"
              className="touch-target p-2 rounded-xl text-[var(--color-primary)] hover:bg-[var(--color-border)] active:bg-[var(--color-brand)]/10 transition-colors"
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
            className="fixed inset-0 top-[var(--header-height,56px)] bg-black/50 backdrop-blur-sm md:hidden"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <nav
            className="fixed left-0 right-0 top-[var(--header-height,56px)] bottom-0 md:hidden overflow-y-auto bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-xl px-5 py-4 safe-bottom animate-menu-in"
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
