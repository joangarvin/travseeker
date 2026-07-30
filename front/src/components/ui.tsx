import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, GitCompare, Heart, Menu, Moon, Search, ShieldCheck, Sun, UserRound, X } from 'lucide-react';
import { useAuth, useCompare, useTheme } from '../lib/state';
import { imageUrl, plain } from '../lib/api';
import type { Destino } from '../types';

export function Button({ variant = 'primary', loading, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; loading?: boolean }) {
  return <button className={`button button--${variant} ${className}`} disabled={props.disabled || loading} aria-busy={loading || undefined} {...props}>{loading ? 'Procesando…' : children}</button>;
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return <div className="field"><label htmlFor={htmlFor}>{label}</label>{children}{hint && <small>{hint}</small>}</div>;
}

export function Loader({ label = 'Cargando' }: { label?: string }) {
  return <div className="loader" role="status"><span /><p>{label}</p></div>;
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success'; children: ReactNode }) {
  return <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{children}</div>;
}

export function Empty({ icon, title, children, action, headingLevel = 'h2' }: { icon?: ReactNode; title: string; children: ReactNode; action?: ReactNode; headingLevel?: 'h1' | 'h2' }) {
  const Heading = headingLevel;
  return <div className="empty">{icon && <div className="empty__icon">{icon}</div>}<Heading>{title}</Heading><p>{children}</p>{action}</div>;
}

const nav = [
  ['/', 'Descubrir'], ['/mapa', 'Mapa'], ['/comparar', 'Comparar'], ['/favoritos', 'Guardados'], ['/colecciones', 'Viajes'],
] as const;

export function Header() {
  const { user, logout } = useAuth();
  const { ids } = useCompare();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    document.body.classList.add('menu-open');
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); menuRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => { document.body.classList.remove('menu-open'); window.removeEventListener('keydown', onKey); };
  }, [open]);
  return <>
    <header className="header">
      <Link to="/" className="brand" aria-label="TravSeeker, inicio"><span className="brand__mark">T</span><span>TravSeeker</span></Link>
      <nav className="nav nav--desktop" aria-label="Principal">
        {nav.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}{to === '/comparar' && ids.length > 0 && <b>{ids.length}</b>}</NavLink>)}
      </nav>
      <div className="header__actions">
        <button className="icon-button" onClick={toggle} aria-label={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}>{theme === 'light' ? <Moon /> : <Sun />}</button>
        {user ? <div className="account-short">{user.role === 'admin' && <Link to="/admin" aria-label="Administración"><ShieldCheck /> <span>Admin</span></Link>}<Link to="/perfil"><UserRound /> <span>{user.nombre || 'Perfil'}</span></Link><button onClick={logout}>Salir</button></div> : <Link className="button button--ink header__login" to="/auth">Entrar</Link>}
        <button ref={menuRef} className="icon-button header__menu" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? 'Cerrar menú' : 'Abrir menú'}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
    {open && <div className="mobile-menu" id="mobile-nav" role="dialog" aria-modal="true" aria-label="Menú principal"><nav aria-label="Navegación móvil">{nav.map(([to, label], index) => <NavLink key={to} to={to}><span>0{index + 1}</span>{label}</NavLink>)}<NavLink to="/sobre-nosotros"><span>06</span>El proyecto</NavLink>{user?.role === 'admin' && <NavLink to="/admin"><span>07</span>Administración</NavLink>}</nav></div>}
  </>;
}

export function Footer() {
  return <footer className="footer"><div className="footer__top"><p className="footer__statement">El lugar correcto<br />en el momento justo.</p><nav aria-label="Pie"><Link to="/">Destinos</Link><Link to="/mapa">Mapa</Link><Link to="/comparar">Comparar</Link><Link to="/sobre-nosotros">El proyecto</Link></nav></div><div className="footer__bottom"><span>TravSeeker © {new Date().getFullYear()}</span><span>España · Sin posiciones patrocinadas</span></div></footer>;
}

export function Shell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  const location = useLocation();
  const showFooter = footer && !['/auth', '/recuperar', '/verificar-email', '/admin'].includes(location.pathname);
  return <><a className="skip" href="#main">Saltar al contenido</a><Header /><main id="main">{children}</main>{showFooter && <Footer />}</>;
}

export function PageHeading({ kicker, title, children, action }: { kicker?: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return <header className="page-heading"><div>{kicker && <p className="kicker">{kicker}</p>}<h1>{title}</h1>{children && <div className="page-heading__intro">{children}</div>}</div>{action}</header>;
}

export function DestinationCard({ destino, index = 0 }: { destino: Destino; index?: number }) {
  const { ids, toggle } = useCompare();
  const active = ids.includes(destino.id);
  return <article className="destination-card">
    <Link to={`/destino/${destino.id}`} className="destination-card__image"><img src={imageUrl(destino.imagen)} alt="" loading="lazy" /><span>{String(index + 1).padStart(2, '0')}</span></Link>
    <div className="destination-card__body"><p className="destination-card__location">{plain(destino.ubicacion)}</p><h3><Link to={`/destino/${destino.id}`}>{destino.nombre.trim()}</Link></h3><div className="destination-card__facts"><span>{plain(destino.presupuesto)}</span><span>{plain(destino.masificacion)}</span></div></div>
    <button className={`destination-card__compare ${active ? 'is-active' : ''}`} onClick={() => toggle(destino.id)} aria-label={active ? `Quitar ${destino.nombre} de la comparación` : `Comparar ${destino.nombre}`}><GitCompare /><span>{active ? 'Añadido' : 'Comparar'}</span></button>
  </article>;
}

export function SearchBox({ value, onChange, onSubmit, placeholder = 'Busca un lugar, una costa o una forma de viajar' }: { value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder?: string }) {
  return <form className="search-box" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><Search aria-hidden /><label className="sr-only" htmlFor="main-search">Buscar destino</label><input id="main-search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><button type="submit">Buscar <ArrowRight /></button></form>;
}

export function GuestGate({ title, children }: { title: string; children: ReactNode }) {
  return <Shell><section className="guest-gate"><Empty headingLevel="h1" icon={<Heart />} title={title} action={<Link className="button button--primary" to="/auth">Entrar o crear una cuenta</Link>}>{children}</Empty></section></Shell>;
}
