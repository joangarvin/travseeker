import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Compass,
  Lock,
  Mail,
  Moon,
  Send,
  Settings,
  Shield,
  Sparkles,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageLoader from '../components/ui/PageLoader';
import Avatar from '../components/ui/Avatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ApiError } from '../api/client';
import { requestEmailVerification } from '../api/auth';
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
    <div className="flex items-center justify-between gap-4 py-4 border-b border-[var(--color-border)] last:border-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-9 h-9 rounded-lg bg-[var(--color-secondary)] flex items-center justify-center text-[var(--color-brand-dark)] shrink-0">
          <Icon className="w-4 h-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-[var(--color-primary)]">{label}</p>
          <p className="text-xs text-[var(--color-muted)] mt-0.5 max-w-sm">{description}</p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-[var(--color-brand)]' : 'bg-[var(--color-border-strong)]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
    </div>
  );
}

const inputClass =
  'w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20 transition-all';

const labelClass =
  'block text-xs font-semibold text-[var(--color-muted)] mb-1.5 uppercase tracking-wide';

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
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />

      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-16 px-4 sm:px-6 border-b border-[var(--color-border-strong)] bg-[var(--color-surface)]">
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6 text-center sm:text-left">
          <Avatar user={user} size="xl" className="shadow-sm border border-[var(--color-border-strong)]" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
              <h1 className="font-serif text-4xl md:text-5xl font-medium text-[var(--color-primary)] tracking-tight">
                {displayName}
              </h1>
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-brand)] bg-[var(--color-brand)]/10 border border-[var(--color-brand)]/20 rounded-full px-2.5 py-1">
                  <BadgeCheck className="w-3.5 h-3.5" /> Verificado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 bg-amber-300/10 border border-amber-300/20 rounded-full px-2.5 py-1">
                  Sin verificar
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-5 gap-y-1 text-[var(--color-muted)] text-sm">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user.email}</span>
              <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" />Miembro desde {memberSince}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-[220px_1fr] gap-8 -mt-6">
        <aside className="md:sticky md:top-28 h-max">
          <nav className="flex md:flex-col gap-1 overflow-x-auto rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] p-2 shadow-sm">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTab(id); setFeedback(null); }}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  tab === id
                    ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)] shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-secondary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="space-y-6">
          {feedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm border ${
                feedback.type === 'ok'
                  ? 'text-[var(--color-brand-dark)] bg-[var(--color-brand)]/10 border-[var(--color-brand)]/25'
                  : 'text-[var(--color-danger)] bg-[var(--color-danger)]/10 border-[var(--color-danger)]/25'
              }`}
            >
              {feedback.msg}
            </div>
          )}

          {!user.emailVerified && (
            <div className="rounded-xl px-4 py-3.5 border border-amber-400/30 bg-amber-400/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-[var(--color-primary)]">
                  Tu email aún no está verificado.{' '}
                  <span className="text-[var(--color-muted)]">Verifícalo para proteger tu cuenta.</span>
                </p>
              </div>
              {verifySent ? (
                <span className="text-sm font-medium text-[var(--color-brand-dark)] whitespace-nowrap">Email enviado ✓</span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={verifying}
                  className="text-sm font-semibold text-amber-600 hover:text-amber-700 whitespace-nowrap disabled:opacity-50"
                >
                  {verifying ? 'Enviando...' : 'Enviar verificación'}
                </button>
              )}
            </div>
          )}

          {tab === 'perfil' && (
            <form onSubmit={handleSaveProfile} className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] p-6 md:p-8 shadow-sm space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-primary)]">Información personal</h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">Cómo te verán otros viajeros en Travseeker.</p>
              </div>

              <div className="flex items-center gap-4">
                <Avatar user={{ nombre, email: user.email, avatarUrl: avatarUrl || null }} size="lg" />
                <div className="flex-1">
                  <label htmlFor="avatarUrl" className={labelClass}>URL del avatar</label>
                  <input id="avatarUrl" type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className={inputClass} placeholder="https://..." />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre" className={labelClass}>Nombre</label>
                  <input id="nombre" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} placeholder="Tu nombre" />
                </div>
                <div>
                  <label htmlFor="apellidos" className={labelClass}>Apellidos</label>
                  <input id="apellidos" type="text" value={apellidos} onChange={(e) => setApellidos(e.target.value)} className={inputClass} placeholder="Tus apellidos" />
                </div>
              </div>

              <div>
                <label htmlFor="bio" className={labelClass}>Biografía</label>
                <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={280} rows={3} className={`${inputClass} resize-none`} placeholder="Cuéntanos qué tipo de viajero eres..." />
                <p className="text-right text-xs text-[var(--color-muted)] mt-1">{bio.length}/280</p>
              </div>

              <div>
                <label htmlFor="locale" className={labelClass}>Idioma preferido</label>
                <select id="locale" value={locale} onChange={(e) => setLocale(e.target.value)} className={inputClass}>
                  {LOCALES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {tab === 'preferencias' && (
            <div className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] p-6 md:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-primary)]">Preferencias</h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">Personaliza tu experiencia en la plataforma.</p>
              </div>

              <div>
                <p className={labelClass}>Apariencia</p>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      theme === 'light'
                        ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-border-strong)] text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                    }`}
                  >
                    <Sun className="w-4 h-4" /> Claro
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                      theme === 'dark'
                        ? 'border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-border-strong)] text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                    }`}
                  >
                    <Moon className="w-4 h-4" /> Oscuro
                  </button>
                </div>
              </div>

              <div className="border-t border-[var(--color-border)] pt-5">
                <div className="flex items-center gap-2 mb-1">
                  <Compass className="w-4 h-4 text-[var(--color-brand-dark)]" />
                  <p className="text-sm font-semibold text-[var(--color-primary)]">Preferencias de viaje</p>
                </div>
                <p className="text-xs text-[var(--color-muted)] mb-4">Las usamos para personalizar tus recomendaciones "Para ti".</p>

                <p className={labelClass}>Tipos de turismo favoritos</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {TRAVEL_TIPOS.map((t) => {
                    const active = travelTipos.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTravelTipos((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]))}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                          active
                            ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)] border-[var(--color-brand)]'
                            : 'bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-border-strong)] hover:text-[var(--color-primary)]'
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>

                <div className="max-w-xs mb-2">
                  <label htmlFor="travelPresupuesto" className={labelClass}>Presupuesto preferido</label>
                  <select id="travelPresupuesto" value={travelPresupuesto} onChange={(e) => setTravelPresupuesto(e.target.value)} className={inputClass}>
                    <option value="">Sin preferencia</option>
                    {TRAVEL_PRESUPUESTOS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <Toggle checked={avoidCrowds} onChange={setAvoidCrowds} icon={Sparkles} label="Evitar masificación" description="Priorizamos destinos tranquilos y poco concurridos en tus recomendaciones." />
              </div>

              <div className="border-t border-[var(--color-border)] pt-2">
                <Toggle checked={notifications} onChange={setNotifications} icon={Bell} label="Notificaciones" description="Recibe avisos sobre nuevos destinos y cambios en tus favoritos." />
                <Toggle checked={newsletter} onChange={setNewsletter} icon={Send} label="Newsletter" description="Guías de viaje y recomendaciones mensuales en tu email." />
              </div>

              <div className="flex justify-end">
                <button type="button" onClick={handleSavePreferences} disabled={saving} className="px-6 py-3 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar preferencias'}
                </button>
              </div>
            </div>
          )}

          {tab === 'seguridad' && (
            <form onSubmit={handleChangePassword} className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] p-6 md:p-8 shadow-sm space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-[var(--color-primary)]">Seguridad</h2>
                <p className="text-sm text-[var(--color-muted)] mt-1">Cambia tu contraseña periódicamente para mantener tu cuenta segura.</p>
              </div>

              <div>
                <label htmlFor="currentPassword" className={labelClass}>Contraseña actual</label>
                <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className={inputClass} placeholder="••••••••" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="newPassword" className={labelClass}>Nueva contraseña</label>
                  <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className={inputClass} placeholder="Mínimo 8 caracteres" />
                </div>
                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>Confirmar contraseña</label>
                  <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} className={inputClass} placeholder="Repite la contraseña" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] bg-[var(--color-secondary)] rounded-lg px-3 py-2">
                <Lock className="w-3.5 h-3.5 shrink-0" />
                Usa una combinación de letras, números y símbolos.
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={saving} className="px-6 py-3 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50">
                  {saving ? 'Actualizando...' : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-[var(--color-muted)]">
            <Link to="/favoritos" className="text-[var(--color-brand-dark)] font-medium hover:underline">Ver mis favoritos</Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
}
