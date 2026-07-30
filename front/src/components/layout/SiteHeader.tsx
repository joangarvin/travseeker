import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Moon, ShieldCheck, Sun, UserRound, X } from 'lucide-react';
import { useAuth, useCompare, useTheme } from '../../contexts';
import { imageUrl } from '../../utils';
import { MediaImage } from '../ui';

const mainNavigation = [
  { to: '/', label: 'Descubrir' },
  { to: '/mapa', label: 'Mapa' },
  { to: '/comparar', label: 'Comparar' },
  { to: '/favoritos', label: 'Guardados' },
  { to: '/colecciones', label: 'Viajes' },
] as const;

export function SiteHeader() {
  const { user, logout } = useAuth();
  const { ids: compareIds } = useCompare();
  const { theme, toggle: toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    document.body.classList.add('menu-open');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('menu-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header className="header">
        <Link to="/" className="brand" aria-label="TravSeeker, inicio">
          <span className="brand__mark">T</span>
          <span>TravSeeker</span>
        </Link>

        <nav className="nav nav--desktop" aria-label="Principal">
          {mainNavigation.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
              {to === '/comparar' && compareIds.length > 0 && <b>{compareIds.length}</b>}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
          >
            {theme === 'light' ? <Moon /> : <Sun />}
          </button>

          {user ? (
            <div className="account-short">
              {user.role === 'admin' && (
                <Link to="/admin" aria-label="Administración">
                  <ShieldCheck /> <span>Admin</span>
                </Link>
              )}
              <Link to="/perfil">
                {user.avatarUrl ? (
                  <MediaImage
                    className="account-short__avatar"
                    src={imageUrl(user.avatarUrl)}
                    alt=""
                  />
                ) : (
                  <UserRound />
                )}{' '}
                <span>{user.nombre || 'Perfil'}</span>
              </Link>
              <button onClick={logout}>Salir</button>
            </div>
          ) : (
            <Link className="button button--ink header__login" to="/auth">
              Entrar
            </Link>
          )}

          <button
            ref={menuButtonRef}
            className="icon-button header__menu"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <div
          className="mobile-menu"
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menú principal"
        >
          <nav aria-label="Navegación móvil">
            {mainNavigation.map(({ to, label }, index) => (
              <NavLink key={to} to={to}>
                <span>0{index + 1}</span>
                {label}
              </NavLink>
            ))}
            <NavLink to="/sobre-nosotros">
              <span>06</span>El proyecto
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin">
                <span>07</span>Administración
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
