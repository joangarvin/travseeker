import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Globe, Menu, X } from 'lucide-react';
import logo from '../../assets/logo.png';
import ThemeToggle from '../ui/ThemeToggle';
import UserMenu from '../auth/UserMenu';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const navLink = (to: string, label: string, onClick?: () => void) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`transition-colors ${
          isActive
            ? 'text-[var(--color-brand-dark)] font-semibold'
            : 'text-[var(--color-primary)]/80 hover:text-[var(--color-primary)]'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="glass border-b border-[var(--color-border)] shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center py-3 px-6 md:px-10 gap-6">
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <img src={logo} alt="Travseeker" className="h-9 w-auto group-hover:scale-105 transition-transform" />
          </Link>

          <div className="hidden md:flex items-center gap-8 flex-1 justify-end">
            <nav className="flex gap-8 text-sm font-medium">
              {navLink('/', 'Inicio')}
              <a
                href="/#destinos"
                className="text-[var(--color-primary)]/80 hover:text-[var(--color-primary)] transition-colors"
              >
                Destinos
              </a>
              {navLink('/mapa', 'Mapa')}
              {navLink('/comparar', 'Comparar')}
              {user && navLink('/favoritos', 'Favoritos')}
              {user && navLink('/colecciones', 'Colecciones')}
              {navLink('/sobre-nosotros', 'Sobre nosotros')}
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

          <div className="flex md:hidden items-center gap-2">
            <UserMenu />
            <ThemeToggle />
            <button
              type="button"
              className="p-2 rounded-lg text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menú"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass border-b border-[var(--color-border)] px-6 py-4 space-y-4 animate-fade-up">
          {navLink('/', 'Inicio', () => setMobileOpen(false))}
          <a
            href="/#destinos"
            className="block text-sm text-[var(--color-primary)]/80"
            onClick={() => setMobileOpen(false)}
          >
            Destinos
          </a>
          {navLink('/mapa', 'Mapa', () => setMobileOpen(false))}
          {navLink('/comparar', 'Comparar', () => setMobileOpen(false))}
          {user && navLink('/favoritos', 'Favoritos', () => setMobileOpen(false))}
          {user && navLink('/colecciones', 'Colecciones', () => setMobileOpen(false))}
          {navLink('/sobre-nosotros', 'Sobre nosotros', () => setMobileOpen(false))}
        </div>
      )}
    </header>
  );
}
