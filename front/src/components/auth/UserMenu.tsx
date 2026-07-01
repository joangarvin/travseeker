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
        className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-full px-3 sm:px-4 py-2 hover:border-[var(--color-brand)] hover:text-[var(--color-brand-dark)] transition-colors shadow-sm touch-target"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Iniciar sesión</span>
      </Link>
    );
  }

  const displayName = getDisplayName(user);

  const menu = open
    ? createPortal(
        <>
          <div
            className="fixed inset-0 z-[2100] bg-black/20 sm:bg-transparent"
            aria-hidden
            onClick={close}
          />
          <div
            ref={panelRef}
            role="menu"
            className="fixed z-[2110] rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-2xl py-2 animate-menu-in origin-top-right"
            style={{ top: pos.top, right: pos.right, width: pos.width }}
          >
            <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
              <Avatar user={user} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-primary)] truncate">{displayName}</p>
                <p className="text-xs text-[var(--color-muted)] truncate">{user.email}</p>
              </div>
            </div>
            <Link
              to="/favoritos"
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-primary)] hover:bg-[var(--color-secondary)] active:bg-[var(--color-secondary)] transition-colors"
              onClick={close}
            >
              <Heart className="w-4 h-4 text-[var(--color-brand-dark)] shrink-0" />
              Mis favoritos
            </Link>
            <Link
              to="/colecciones"
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-primary)] hover:bg-[var(--color-secondary)] active:bg-[var(--color-secondary)] transition-colors"
              onClick={close}
            >
              <FolderHeart className="w-4 h-4 text-[var(--color-brand-dark)] shrink-0" />
              Mis colecciones
            </Link>
            <Link
              to="/perfil"
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-primary)] hover:bg-[var(--color-secondary)] active:bg-[var(--color-secondary)] transition-colors"
              onClick={close}
            >
              <Settings className="w-4 h-4 text-[var(--color-brand-dark)] shrink-0" />
              Configuración
            </Link>
            {user.role === 'admin' && (
              <Link
                to="/admin"
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-primary)] hover:bg-[var(--color-secondary)] active:bg-[var(--color-secondary)] transition-colors"
                onClick={close}
              >
                <ShieldCheck className="w-4 h-4 text-[var(--color-brand-dark)] shrink-0" />
                Panel admin
              </Link>
            )}
            <div className="my-1 border-t border-[var(--color-border)]" />
            <button
              type="button"
              role="menuitem"
              onClick={() => { logout(); close(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 active:bg-[var(--color-danger)]/10 transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
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
        className={`flex items-center gap-1.5 sm:gap-2 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-surface)] border rounded-full pl-1.5 pr-2 sm:pr-3 py-1.5 transition-colors shadow-sm touch-target ${
          open
            ? 'border-[var(--color-brand)]/50 ring-2 ring-[var(--color-brand)]/20'
            : 'border-[var(--color-border-strong)] hover:border-[var(--color-brand)]/50'
        }`}
      >
        <Avatar user={user} />
        <span className="max-w-[88px] sm:max-w-[140px] truncate font-semibold hidden sm:inline">{displayName}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--color-muted)] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </>
  );
}
