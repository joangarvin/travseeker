import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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
    const className = `site-header__nav-link ${isActive ? 'is-active' : ''}`;
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
    <header className="site-header safe-top">
      <div className="site-header__bar">
        <div className="site-header__inner">
          <Link to="/" className="site-header__brand touch-target">
            <img src={logo} alt="" className="site-header__logo" />
            <span className="site-header__brand-name">
              Travseeker
            </span>
          </Link>

          <div className="site-header__desktop">
            <nav className="site-header__nav">
              {visibleNav.map((item) => navLink(item.to, item.label, undefined, item.hash))}
            </nav>

            <div className="site-header__actions">
              <ThemeToggle />
              <UserMenu />
            </div>
          </div>

          <div className="site-header__mobile">
            <UserMenu />
            <ThemeToggle />
            <button
              type="button"
              className="site-header__menu-btn touch-target"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X aria-hidden /> : <Menu aria-hidden />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <>
          <button
            type="button"
            className="site-header__backdrop"
            aria-label="Cerrar menú"
            onClick={() => setMobileOpen(false)}
          />
          <nav
            className="site-header__mobile-nav safe-bottom animate-menu-in"
            aria-label="Navegación principal"
          >
            <div className="site-header__mobile-list">
              {visibleNav.map((item) => (
                <div key={item.to} className="site-header__mobile-item">
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
