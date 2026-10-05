import { t } from '../../i18n';
import { LanguageSwitcher } from '../../i18n/LanguageSwitcher';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, Moon, ShieldCheck, Sun, UserRound, X } from 'lucide-react';
import { useAuth, useCompare, useTheme } from '../../contexts';
import { imageUrl } from '../../utils';
import { MediaImage } from '../ui';

const mainNavigation = [
  { to: '/', label: t('Descubrir') },
  { to: '/mapa', label: t('Mapa') },
  { to: '/comparar', label: t('Comparar') },
  { to: '/favoritos', label: t('Guardados') },
  { to: '/colecciones', label: t('Viajes') },
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
        <Link to="/" className="brand" aria-label={t('TravSeeker, inicio')}>
          <span className="brand__mark">T</span>
          <span>TravSeeker</span>
        </Link>

        <nav className="nav nav--desktop" aria-label={t('Principal')}>
          {mainNavigation.map(({ to, label }) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {t(label)}
              {to === '/comparar' && compareIds.length > 0 && (
                <b
                  key={compareIds.length}
                  aria-label={t('{0} destinos en comparación', { 0: compareIds.length })}
                >
                  {compareIds.length}
                </b>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <LanguageSwitcher />
          <button
            className="icon-button"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? t('Activar modo oscuro') : t('Activar modo claro')}
          >
            {theme === 'light' ? <Moon /> : <Sun />}
          </button>

          {user ? (
            <div className="account-short">
              {user.role === 'admin' && (
                <Link to="/admin" aria-label={t('Administración')}>
                  <ShieldCheck /> <span>Admin</span>
                </Link>
              )}
              <Link to="/perfil">
                {user.avatarUrl ? (
                  <MediaImage
                    className="account-short__avatar"
                    sizes="40px"
                    src={imageUrl(user.avatarUrl)}
                    alt=""
                  />
                ) : (
                  <UserRound />
                )}{' '}
                <span>{user.nombre || t('Perfil')}</span>
              </Link>
              <button onClick={logout}>{t('Salir')}</button>
            </div>
          ) : (
            <Link className="button button--ink header__login" to="/auth">
              {t('Entrar')}
            </Link>
          )}

          <button
            ref={menuButtonRef}
            className="icon-button header__menu"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMenuOpen ? t('Cerrar menú') : t('Abrir menú')}
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
          aria-label={t('Menú principal')}
        >
          <nav aria-label={t('Navegación móvil')}>
            {mainNavigation.map(({ to, label }, index) => (
              <NavLink key={to} to={to}>
                <span>0{index + 1}</span>
                {t(label)}
              </NavLink>
            ))}
            <NavLink to="/sobre-nosotros">
              <span>06</span>
              {t('El proyecto')}
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin">
                <span>07</span>
                {t('Administración')}
              </NavLink>
            )}
          </nav>
        </div>
      )}
    </>
  );
}
