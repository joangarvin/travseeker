import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, FolderHeart, Heart, LogIn, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName } from '../../utils/user';
import Avatar from '../ui/Avatar';

type MenuPos = { top: number; right: number; width: number };

export default function UserMenu() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<MenuPos>({ top: 0, right: 16, width: 224 });

  const updatePosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.min(256, window.innerWidth - 16);
    const right = Math.max(8, window.innerWidth - rect.right);
    setPos({
      top: rect.bottom + 8,
      right,
      width,
    });
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  const toggle = (e: React.MouseEvent | React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (open) {
      close();
      return;
    }
    updatePosition();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };

    const onResize = () => updatePosition();

    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);

    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, close, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      close();
    };

    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', onPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  if (!user) {
    return (
      <Link
        to="/auth"
        className="user-menu__login touch-target"
      >
        <LogIn className="icon-sm" />
        <span className="user-menu__login-text">Entrar</span>
      </Link>
    );
  }

  const displayName = getDisplayName(user);

  const menu = open
    ? createPortal(
        <>
          <div
            className="user-menu__overlay"
            aria-hidden
            onClick={close}
          />
          <div
            ref={panelRef}
            role="menu"
            className="user-menu__panel animate-menu-in"
            style={{ top: pos.top, right: pos.right, width: pos.width, boxShadow: 'var(--shadow-card)' }}
          >
            <div className="user-menu__summary">
              <Avatar user={user} />
              <div className="user-menu__summary-meta">
                <p className="user-menu__summary-name">{displayName}</p>
                <p className="user-menu__summary-email">{user.email}</p>
              </div>
            </div>
            <Link
              to="/favoritos"
              role="menuitem"
              className="user-menu__link"
              onClick={close}
            >
              <Heart className="user-menu__link-icon" />
              Mis sitios
            </Link>
            <Link
              to="/colecciones"
              role="menuitem"
              className="user-menu__link"
              onClick={close}
            >
              <FolderHeart className="user-menu__link-icon" />
              Mis listas
            </Link>
            <Link
              to="/perfil"
              role="menuitem"
              className="user-menu__link"
              onClick={close}
            >
              <Settings className="user-menu__link-icon" />
              Configuración
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin"
                role="menuitem"
                className="user-menu__link"
                onClick={close}
              >
                <ShieldCheck className="user-menu__link-icon" />
                Panel admin
              </Link>
            )}
            <div className="user-menu__divider" />
            <button
              type="button"
              role="menuitem"
              onClick={() => { logout(); close(); }}
              className="user-menu__logout"
            >
              <LogOut className="icon-sm" />
              Cerrar sesión
            </button>
          </div>
        </>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`user-menu__button touch-target ${open ? 'is-open' : ''}`}
      >
        <Avatar user={user} />
        <span className="user-menu__name">{displayName}</span>
        <ChevronDown className="user-menu__chevron icon-sm" />
      </button>
      {menu}
    </>
  );
}
