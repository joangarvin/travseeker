import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ImgHTMLAttributes, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ArrowRight, GitCompare, Heart, Image as ImageIcon, Menu, Moon, Search, ShieldCheck, Sun, UploadCloud, UserRound, X } from 'lucide-react';
import { useAuth, useCompare, useTheme } from '../lib/state';
import { api, imageUrl, plain } from '../lib/api';
import type { Destino } from '../types';
import { TourismMark } from '../lib/tourism';

export function Button({ variant = 'primary', loading, children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; loading?: boolean }) {
  return <button className={`button button--${variant} ${className}`} disabled={props.disabled || loading} aria-busy={loading || undefined} {...props}>{loading ? 'Procesando…' : children}</button>;
}

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor: string; hint?: string; children: ReactNode }) {
  return <div className="field"><label htmlFor={htmlFor}>{label}</label>{children}{hint && <small>{hint}</small>}</div>;
}

const FALLBACK_IMAGE = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#e7eaf1"/><g fill="none" stroke="#c6cad4" stroke-width="2"><path d="M0 120h800M0 300h800M0 480h800M160 0v600M400 0v600M640 0v600"/><path d="M-20 510C170 450 170 140 395 235s250-40 440-155" stroke="#3047f2" stroke-width="8"/></g><circle cx="395" cy="235" r="18" fill="#ffd51f" stroke="#111217" stroke-width="8"/></svg>')}`;

export function MediaImage({ className = '', alt = '', src, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  useEffect(() => setStatus('loading'), [src]);
  return <img {...props} src={src || FALLBACK_IMAGE} alt={alt} className={`media-image media-image--${status} ${className}`.trim()} onLoad={() => setStatus('loaded')} onError={(event) => { if (event.currentTarget.src !== FALLBACK_IMAGE) event.currentTarget.src = FALLBACK_IMAGE; setStatus('error'); }} />;
}

export function ImageUploader({ id, label, value, token, endpoint, onChange, extraData, circular = false }: { id: string; label: string; value?: string | null; token: string; endpoint: string; onChange: (url: string) => void; extraData?: Record<string, string>; circular?: boolean }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const uploadFile = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { setError('Elige una imagen JPG, PNG, WebP o GIF.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('La imagen supera el máximo de 10 MB.'); return; }
    setUploading(true); setError('');
    const body = new FormData(); body.append('image', file);
    Object.entries(extraData || {}).forEach(([key, data]) => body.append(key, data));
    try { const result = await api<{ url: string }>(endpoint, { method: 'POST', body }, token); onChange(result.url); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo subir la imagen'); }
    finally { setUploading(false); }
  };
  const upload = (event: React.ChangeEvent<HTMLInputElement>) => { void uploadFile(event.target.files?.[0]); event.target.value = ''; };
  return <div className={`image-uploader ${circular ? 'image-uploader--circular' : ''} ${dragging ? 'is-dragging' : ''}`} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadFile(event.dataTransfer.files?.[0]); }}>
    <div className="image-uploader__preview">{value ? <MediaImage src={imageUrl(value)} alt="Vista previa" /> : <ImageIcon aria-hidden />}</div>
    <div><strong>{label}</strong><p>Arrastra una imagen aquí o selecciónala. JPG, PNG, WebP o GIF · máximo 10 MB.</p><label className="button button--secondary" htmlFor={id}><UploadCloud /> {uploading ? 'Subiendo…' : value ? 'Cambiar imagen' : 'Elegir imagen'}</label><input className="sr-only" id={id} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} disabled={uploading} />{error && <small className="image-uploader__error" role="alert">{error}</small>}</div>
  </div>;
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
        {user ? <div className="account-short">{user.role === 'admin' && <Link to="/admin" aria-label="Administración"><ShieldCheck /> <span>Admin</span></Link>}<Link to="/perfil">{user.avatarUrl ? <MediaImage className="account-short__avatar" src={imageUrl(user.avatarUrl)} alt="" /> : <UserRound />} <span>{user.nombre || 'Perfil'}</span></Link><button onClick={logout}>Salir</button></div> : <Link className="button button--ink header__login" to="/auth">Entrar</Link>}
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
    <Link to={`/destino/${destino.id}`} className="destination-card__image"><MediaImage src={imageUrl(destino.imagen)} alt="" loading="lazy" /><span>{String(index + 1).padStart(2, '0')}</span></Link>
    <div className="destination-card__body"><div className="destination-card__eyebrow"><p className="destination-card__location">{plain(destino.ubicacion)}</p><TourismMark value={destino.tipoTurismoPrincipal} compact /></div><h3><Link to={`/destino/${destino.id}`}>{destino.nombre.trim()}</Link></h3><div className="destination-card__facts"><span>{plain(destino.presupuesto)}</span><span>{plain(destino.masificacion)}</span></div></div>
    <button className={`destination-card__compare ${active ? 'is-active' : ''}`} onClick={() => toggle(destino.id)} aria-label={active ? `Quitar ${destino.nombre} de la comparación` : `Comparar ${destino.nombre}`}><GitCompare /><span>{active ? 'Añadido' : 'Comparar'}</span></button>
  </article>;
}

export function SearchBox({ value, onChange, onSubmit, placeholder = 'Busca un lugar, una costa o una forma de viajar' }: { value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder?: string }) {
  return <form className="search-box" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><Search aria-hidden /><label className="sr-only" htmlFor="main-search">Buscar destino</label><input id="main-search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><button type="submit">Buscar <ArrowRight /></button></form>;
}

export function GuestGate({ title, children }: { title: string; children: ReactNode }) {
  return <Shell><section className="guest-gate"><Empty headingLevel="h1" icon={<Heart />} title={title} action={<Link className="button button--primary" to="/auth">Entrar o crear una cuenta</Link>}>{children}</Empty></section></Shell>;
}
