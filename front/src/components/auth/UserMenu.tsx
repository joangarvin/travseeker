import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FolderHeart, Heart, LogIn, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getDisplayName } from '../../utils/user';
import Avatar from '../ui/Avatar';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) {
    return (
      <Link
        to="/auth"
        className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-full px-4 py-2 hover:border-[var(--color-brand)] hover:text-[var(--color-brand-dark)] transition-colors shadow-sm"
      >
        <LogIn className="w-4 h-4" />
        Iniciar sesión
      </Link>
    );
  }

  const displayName = getDisplayName(user);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-primary)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] rounded-full pl-1.5 pr-4 py-1.5 hover:border-[var(--color-brand)]/50 transition-colors shadow-sm"
      >
        <Avatar user={user} />
        <span className="max-w-[140px] truncate font-semibold">{displayName}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-xl py-2 z-50 animate-fade-up"
        >
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
            <Avatar user={user} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-primary)] truncate">{displayName}</p>
              <p className="text-xs text-[var(--color-muted)] truncate">{user.email}</p>
            </div>
          </div>
          <Link
            to="/favoritos"
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors"
            onClick={() => setOpen(false)}
          >
            <Heart className="w-4 h-4 text-[var(--color-brand-dark)]" />
            Mis favoritos
          </Link>
          <Link
            to="/colecciones"
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors"
            onClick={() => setOpen(false)}
          >
            <FolderHeart className="w-4 h-4 text-[var(--color-brand-dark)]" />
            Mis colecciones
          </Link>
          <Link
            to="/perfil"
            role="menuitem"
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors"
            onClick={() => setOpen(false)}
          >
            <Settings className="w-4 h-4 text-[var(--color-brand-dark)]" />
            Configuración
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => { logout(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
