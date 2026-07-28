import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarDays,
  Compass,
  Lock,
  Mail,
  Moon,
  Send,
  Settings,
  Shield,
  Sun,
  User as UserIcon,
  Users,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageLoader from '../components/ui/PageLoader';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ApiError } from '../api/client';
import { requestEmailVerification } from '../api/auth';
import { uploadAvatar } from '../api/upload';
import ImageUploadField from '../components/ui/ImageUploadField';
import { getDisplayName } from '../utils/user';
import type { UserPreferences } from '../types/user';

type Tab = 'perfil' | 'preferencias' | 'seguridad';

const TABS: { id: Tab; label: string; icon: typeof UserIcon }[] = [
  { id: 'perfil', label: 'Perfil', icon: UserIcon },
  { id: 'preferencias', label: 'Preferencias', icon: Settings },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
];

const LOCALES = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'ca', label: 'Català' },
];

const TRAVEL_TIPOS = ['Cultural', 'Naturaleza', 'Sol y playa', 'Rural', 'Montaña', 'Patrimonial'];
const TRAVEL_PRESUPUESTOS = ['Bajo', 'Medio-Bajo', 'Medio', 'Medio-Alto', 'Alto'];

function Toggle({ checked, onChange, label, description, icon: Icon }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
  icon: typeof Bell;
}) {
  return (
    <div className="profile-toggle">
      <div className="profile-toggle__info">
        <span className="profile-toggle__icon">
          <Icon className="icon-sm" />
        </span>
        <div>
          <p className="profile-toggle__label">{label}</p>
          <p className="profile-toggle__desc">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`profile-toggle__switch ${checked ? 'is-on' : ''}`}
      >
        <span className="profile-toggle__knob" />
      </button>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, token, loading: authLoading, updateProfile, changePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<Tab>('perfil');
  const [verifySent, setVerifySent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [locale, setLocale] = useState('es');

  const [notifications, setNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(false);

  const [travelTipos, setTravelTipos] = useState<string[]>([]);
  const [travelPresupuesto, setTravelPresupuesto] = useState('');
  const [avoidCrowds, setAvoidCrowds] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null);
  const feedbackTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth', { replace: true });
  }, [authLoading, user, navigate]);

  useEffect(() => () => window.clearTimeout(feedbackTimer.current), []);

  useEffect(() => {
    if (!user) return;
    setNombre(user.nombre ?? '');
    setApellidos(user.apellidos ?? '');
    setBio(user.bio ?? '');
    setAvatarUrl(user.avatarUrl ?? '');
    setLocale(user.locale ?? 'es');
    const prefs = user.preferences ?? {};
    setNotifications(prefs.notifications ?? true);
    setNewsletter(prefs.newsletter ?? false);
    const travel = prefs.travel ?? {};
    setTravelTipos(Array.isArray(travel.tipos) ? travel.tipos : []);
    setTravelPresupuesto(typeof travel.presupuesto === 'string' ? travel.presupuesto : '');
    setAvoidCrowds(travel.evitarMasificacion ?? false);
  }, [user]);

  const memberSince = useMemo(() => {
    if (!user) return '';
    return new Date(user.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
    });
  }, [user]);

  const handleAvatarUpload = useCallback(async (file: File) => {
    if (!token) throw new Error('Debes iniciar sesión');
    const result = await uploadAvatar(file, token);
    return result.url;
  }, [token]);

  if (authLoading || !user) return <PageLoader label="Cargando perfil..." />;

  const flash = (type: 'ok' | 'error', msg: string) => {
    setFeedback({ type, msg });
    window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      await updateProfile({
        nombre,
        apellidos,
        bio,
        avatarUrl: avatarUrl || null,
        locale,
      });
      flash('ok', 'Perfil actualizado correctamente');
    } catch (err) {
      flash('error', err instanceof ApiError ? err.message : 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const prefs: UserPreferences = {
        notifications,
        newsletter,
        theme,
        travel: {
          tipos: travelTipos,
          presupuesto: travelPresupuesto || undefined,
          evitarMasificacion: avoidCrowds,
        },
      };
      await updateProfile({ preferences: prefs });
      flash('ok', 'Preferencias guardadas');
    } catch (err) {
      flash('error', err instanceof ApiError ? err.message : 'No se pudieron guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      flash('error', 'Las contraseñas nuevas no coinciden');
      return;
    }
    if (newPassword.length < 8) {
      flash('error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      flash('ok', 'Contraseña actualizada');
    } catch (err) {
      flash('error', err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!token) return;
    setVerifying(true);
    try {
      await requestEmailVerification(token);
      setVerifySent(true);
    } catch (err) {
      flash('error', err instanceof ApiError ? err.message : 'No se pudo enviar el email de verificación');
    } finally {
      setVerifying(false);
    }
  };

  const displayName = getDisplayName(user);

  return (
    <div className="page-shell">
      <Header />

      <section className="profile-hero">
        <div className="profile-hero__inner">
          <Avatar user={user} size="xl" className="profile-hero__avatar" />
          <div className="profile-hero__content">
            <div className="profile-hero__title-row">
              <h1 className="profile-hero__title">
                {displayName}
              </h1>
              {user.emailVerified ? (
                <span className="profile-badge profile-badge--verified">
                  <BadgeCheck className="icon-sm" /> Verificado
                </span>
              ) : (
                <span className="profile-badge profile-badge--pending">
                  Sin verificar
                </span>
              )}
            </div>
            <div className="profile-hero__meta">
              <span className="profile-hero__meta-item"><Mail className="icon-sm" />{user.email}</span>
              <span className="profile-hero__meta-item"><CalendarDays className="icon-sm" />Miembro desde {memberSince}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-layout">
        <aside>
          <nav className="profile-nav" aria-label="Configuración del perfil">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTab(id); setFeedback(null); }}
                aria-current={tab === id ? 'page' : undefined}
                className={`profile-nav__btn ${tab === id ? 'is-active' : ''}`}
              >
                <Icon className="icon-sm" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="profile-main">
          {feedback && (
            <div
              role={feedback.type === 'error' ? 'alert' : 'status'}
              className={`profile-flash profile-flash--${feedback.type === 'ok' ? 'ok' : 'error'}`}
            >
              {feedback.msg}
            </div>
          )}

          {!user.emailVerified && (
            <div className="profile-verify-banner">
              <div className="profile-verify-banner__content">
                <AlertTriangle className="profile-verify-banner__icon" />
                <p className="profile-verify-banner__text">
                  Tu email aún no está verificado.{' '}
                  <span className="profile-verify-banner__muted">Verifícalo para proteger tu cuenta.</span>
                </p>
              </div>
              {verifySent ? (
                <span className="profile-verify-banner__sent">Email enviado ✓</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={verifying}
                  className="profile-verify-banner__action"
                >
                  {verifying ? 'Enviando...' : 'Enviar verificación'}
                </button>
              )}
            </div>
          )}

          {tab === 'perfil' && (
            <form onSubmit={handleSaveProfile} className="profile-panel profile-panel--stack">
              <div>
                <h2 className="profile-panel__head-title">Información personal</h2>
                <p className="profile-panel__head-lead">Cómo te verán otros viajeros en Travseeker.</p>
              </div>

              <div className="profile-avatar-row">
                <Avatar user={{ nombre, email: user.email, avatarUrl: avatarUrl || null }} size="lg" />
                <div className="profile-avatar-row__upload">
                  <ImageUploadField
                    label="Foto de perfil"
                    value={avatarUrl}
                    onChange={setAvatarUrl}
                    onUpload={handleAvatarUpload}
                    previewPreset="avatar-lg"
                    previewClassName="image-upload-preview image-upload-preview--avatar"
                    allowUrl={false}
                    hint="JPG, PNG o WebP. Se recorta y optimiza automáticamente."
                  />
                </div>
              </div>

              <div className="profile-form__grid">
                <div>
                  <label htmlFor="nombre" className="form-label">Nombre</label>
                  <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className="ui-input" placeholder="Tu nombre" />
                </div>
                <div>
                  <label htmlFor="apellidos" className="form-label">Apellidos</label>
                  <input id="apellidos" type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} className="ui-input" placeholder="Tus apellidos" />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className="form-label">Biografía</label>
                <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} className="ui-input profile-textarea" placeholder="Cuéntanos qué tipo de viajero eres..." />
                <p className="profile-char-count">{bio.length}/280</p>
              </div>

              <div>
                <label htmlFor="locale" className="form-label">Idioma preferido</label>
                <select id="locale" value={locale} onChange={(e) => setLocale(e.target.value)} className="ui-input">
                  {LOCALES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div className="profile-form__actions">
                <button type="submit" disabled={saving} className="btn-cta">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {tab === 'preferencias' && (
            <div className="profile-panel profile-panel--stack-lg">
              <div>
                <h2 className="profile-panel__head-title">Preferencias</h2>
                <p className="profile-panel__head-lead">Personaliza tu experiencia en la plataforma.</p>
              </div>

              <div>
                <p className="form-label">Apariencia</p>
                <div className="profile-theme-grid">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`profile-theme-btn ${theme === 'light' ? 'is-active' : ''}`}
                  >
                    <Sun className="icon-sm" /> Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`profile-theme-btn ${theme === 'dark' ? 'is-active' : ''}`}
                  >
                    <Moon className="icon-sm" /> Oscuro
                  </button>
                </div>
              </div>

              <div className="profile-divider">
                <div className="profile-subhead">
                  <Compass className="icon-sm" style={{ color: 'var(--color-brand-dark)' }} />
                  <p className="profile-subhead__title">Preferencias de viaje</p>
                </div>
                <p className="profile-subhead__lead">Las usamos para personalizar tus recomendaciones "Para ti".</p>

                <p className="form-label">Tipos de turismo favoritos</p>
                <div className="profile-chips">
                  {TRAVEL_TIPOS.map((t) => {
                    const active = travelTipos.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTravelTipos((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]))}
                        className={`profile-chip ${active ? 'is-active' : ''}`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                <div className="profile-field-narrow">
                  <label htmlFor="travelPresupuesto" className="form-label">Presupuesto preferido</label>
                  <select id="travelPresupuesto" value={travelPresupuesto} onChange={(e) => setTravelPresupuesto(e.target.value)} className="ui-input">
                    <option value="">Sin preferencia</option>
                    {TRAVEL_PRESUPUESTOS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <Toggle checked={avoidCrowds} onChange={setAvoidCrowds} icon={Users} label="Evitar masificación" description="Priorizamos destinos tranquilos y poco concurridos en tus recomendaciones." />
              </div>

              <div className="profile-divider profile-divider--tight">
                <Toggle checked={notifications} onChange={setNotifications} icon={Bell} label="Notificaciones" description="Recibe avisos sobre nuevos destinos y cambios en tus favoritos." />
                <Toggle checked={newsletter} onChange={setNewsletter} icon={Send} label="Newsletter" description="Guías de viaje y recomendaciones mensuales en tu email." />
              </div>

              <div className="profile-form__actions">
                <button type="button" onClick={handleSavePreferences} disabled={saving} className="btn-cta">
                  {saving ? 'Guardando...' : 'Guardar preferencias'}
                </button>
              </div>
            </div>
          )}

          {tab === 'seguridad' && (
            <form onSubmit={handleChangePassword} className="profile-panel profile-panel--stack">
              <div>
                <h2 className="profile-panel__head-title">Seguridad</h2>
                <p className="profile-panel__head-lead">Cambia tu contraseña periódicamente para mantener tu cuenta segura.</p>
              </div>

              <div>
                <label htmlFor="currentPassword" className="form-label">Contraseña actual</label>
                <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="ui-input" placeholder="••••••••" />
              </div>

              <div className="profile-form__grid">
                <div>
                  <label htmlFor="newPassword" className="form-label">Nueva contraseña</label>
                  <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className="ui-input" placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className="form-label">Confirmar contraseña</label>
                  <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className="ui-input" placeholder="Repite la contraseña" />
                </div>
              </div>

              <div className="profile-hint">
                <Lock className="icon-sm" />
                Usa una combinación de letras, números y símbolos.
              </div>

              <div className="profile-form__actions">
                <button type="submit" disabled={saving} className="btn-cta">
                  {saving ? 'Actualizando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          )}

          <p className="profile-footer-link">
            <Link to="/favoritos" className="link-brand">Ver mis favoritos</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
