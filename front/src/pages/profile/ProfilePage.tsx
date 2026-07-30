import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  KeyRound,
  LogOut,
  MailCheck,
  Settings,
  Shield,
  Trash2,
  UserRound,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts';
import { Button, Field, ImageUploader, Loader, Notice } from '../../components/ui';
import { PageHeading, Shell } from '../../components/layout';
import { GuestGate } from '../../features/auth/components/GuestGate';

type Alert = {
  id: string;
  month?: number | null;
  presupuesto?: string | null;
  avoidCrowds: boolean;
  isActive: boolean;
};

export default function ProfilePage() {
  const auth = useAuth();
  const { user, token } = auth;
  const [tab, setTab] = useState<'profile' | 'preferences' | 'security'>('profile');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [bio, setBio] = useState('');
  const [locale, setLocale] = useState('es');
  const [notifications, setNotifications] = useState(true);
  const [avoidCrowds, setAvoidCrowds] = useState(false);
  const [budget, setBudget] = useState('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [month, setMonth] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; text: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!user) return;
    setName(user.nombre || '');
    setSurname(user.apellidos || '');
    setBio(user.bio || '');
    setLocale(user.locale || 'es');
    const prefs = (user.preferences || {}) as any;
    setNotifications(prefs.notifications ?? true);
    setAvoidCrowds(prefs.travel?.evitarMasificacion ?? false);
    setBudget(prefs.travel?.presupuesto || '');
    if (token) api<Alert[]>('/alertas', {}, token).then(setAlerts);
  }, [user, token]);
  if (auth.loading)
    return (
      <Shell>
        <Loader />
      </Shell>
    );
  if (!user)
    return (
      <GuestGate title="Tu espacio personal">
        Entra para gestionar perfil, preferencias y alertas de viaje.
      </GuestGate>
    );
  const save = async (payload: Record<string, unknown>) => {
    if (!token) return;
    setSaving(true);
    setFeedback(null);
    try {
      await api('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }, token);
      await auth.refresh();
      setFeedback({ tone: 'success', text: 'Cambios guardados' });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo guardar',
      });
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;
    try {
      await api(
        '/auth/change-password',
        { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) },
        token,
      );
      setCurrentPassword('');
      setNewPassword('');
      setFeedback({ tone: 'success', text: 'Contraseña actualizada' });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo actualizar',
      });
    }
  };
  const createAlert = async () => {
    if (!token) return;
    const item = await api<Alert>(
      '/alertas',
      {
        method: 'POST',
        body: JSON.stringify({
          month: month ? Number(month) : null,
          presupuesto: budget || null,
          avoidCrowds,
        }),
      },
      token,
    );
    setAlerts((current) => [item, ...current]);
  };
  const deleteAlert = async (id: string) => {
    if (!token) return;
    await api(`/alertas/${id}`, { method: 'DELETE' }, token);
    setAlerts((current) => current.filter((item) => item.id !== id));
  };
  const requestVerification = async () => {
    if (!token) return;
    try {
      await api('/auth/verify-email/request', { method: 'POST' }, token);
      setFeedback({ tone: 'success', text: 'Enlace de verificación enviado. Revisa tu correo.' });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo enviar el enlace',
      });
    }
  };
  return (
    <Shell>
      <PageHeading
        kicker="Cuenta"
        title={user.nombre ? `Hola, ${user.nombre}` : 'Tu perfil'}
        action={
          <Button variant="quiet" onClick={auth.logout}>
            <LogOut /> Salir
          </Button>
        }
      >
        <p>Configura cómo quieres descubrir y guardar viajes.</p>
      </PageHeading>
      <div className="profile-layout">
        <nav className="profile-nav" aria-label="Secciones del perfil">
          {[
            ['profile', 'Perfil', UserRound],
            ['preferences', 'Preferencias', Settings],
            ['security', 'Seguridad', Shield],
          ].map(([id, label, Icon]: any) => (
            <button key={id} className={tab === id ? 'is-active' : ''} onClick={() => setTab(id)}>
              <Icon /> {label}
            </button>
          ))}
        </nav>
        <section className="profile-panel">
          {!user.emailVerified && (
            <div className="verification-callout">
              <MailCheck />
              <div>
                <b>Falta verificar tu email</b>
                <p>Verifica la dirección para crear y compartir viajes.</p>
              </div>
              <Button variant="secondary" onClick={() => void requestVerification()}>
                Reenviar enlace
              </Button>
            </div>
          )}
          {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
          {tab === 'profile' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save({ nombre: name, apellidos: surname, bio, locale });
              }}
            >
              <h2>Información personal</h2>
              {token && (
                <ImageUploader
                  id="profile-avatar"
                  label="Foto de perfil"
                  value={user.avatarUrl}
                  token={token}
                  endpoint="/upload/avatar"
                  circular
                  onChange={(url) => void save({ avatarUrl: url })}
                />
              )}
              <div className="form-grid">
                <Field label="Nombre" htmlFor="profile-name">
                  <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label="Apellidos" htmlFor="profile-surname">
                  <input
                    id="profile-surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Bio" htmlFor="profile-bio" hint="Máximo 280 caracteres">
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                />
              </Field>
              <Field label="Idioma" htmlFor="profile-locale">
                <select
                  id="profile-locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                >
                  <option value="es">Español</option>
                  <option value="ca">Català</option>
                  <option value="en">English</option>
                </select>
              </Field>
              <Button type="submit" loading={saving}>
                Guardar perfil
              </Button>
            </form>
          )}
          {tab === 'preferences' && (
            <div>
              <h2>Preferencias de viaje</h2>
              <div className="setting-row">
                <div>
                  <Bell />
                  <span>
                    <b>Notificaciones</b>
                    <small>Actualizaciones útiles sobre tus viajes</small>
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={notifications}
                  className={`switch ${notifications ? 'is-on' : ''}`}
                  onClick={() => setNotifications((value) => !value)}
                >
                  <span />
                </button>
              </div>
              <div className="setting-row">
                <div>
                  <Check />
                  <span>
                    <b>Evitar aglomeraciones</b>
                    <small>Prioriza épocas y destinos más tranquilos</small>
                  </span>
                </div>
                <button
                  role="switch"
                  aria-checked={avoidCrowds}
                  className={`switch ${avoidCrowds ? 'is-on' : ''}`}
                  onClick={() => setAvoidCrowds((value) => !value)}
                >
                  <span />
                </button>
              </div>
              <Field label="Presupuesto habitual" htmlFor="profile-budget">
                <select
                  id="profile-budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                >
                  <option value="">Sin preferencia</option>
                  <option>Bajo</option>
                  <option>Medio-Bajo</option>
                  <option>Medio</option>
                  <option>Medio-Alto</option>
                  <option>Alto</option>
                </select>
              </Field>
              <Button
                onClick={() =>
                  void save({
                    preferences: {
                      notifications,
                      travel: { presupuesto: budget, evitarMasificacion: avoidCrowds },
                    },
                  })
                }
                loading={saving}
              >
                Guardar preferencias
              </Button>
              <div className="alerts">
                <h3>Alertas de decisión</h3>
                <div className="alerts__create">
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    aria-label="Mes para la alerta"
                  >
                    <option value="">Cualquier mes</option>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i} value={i + 1}>
                        {new Date(2026, i).toLocaleString('es', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <Button variant="secondary" onClick={() => void createAlert()}>
                    Crear alerta
                  </Button>
                </div>
                {alerts.map((alert) => (
                  <article key={alert.id}>
                    <Bell />
                    <span>
                      {alert.month
                        ? new Date(2026, alert.month - 1).toLocaleString('es', { month: 'long' })
                        : 'Cualquier mes'}{' '}
                      · {alert.presupuesto || 'Cualquier presupuesto'}
                    </span>
                    <button onClick={() => void deleteAlert(alert.id)} aria-label="Eliminar alerta">
                      <Trash2 />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
          {tab === 'security' && (
            <form onSubmit={changePassword}>
              <h2>Contraseña</h2>
              <p className="panel-intro">Usa una contraseña única de al menos ocho caracteres.</p>
              <Field label="Contraseña actual" htmlFor="current-password">
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </Field>
              <Field label="Nueva contraseña" htmlFor="new-password">
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </Field>
              <Button type="submit">
                <KeyRound /> Cambiar contraseña
              </Button>
            </form>
          )}
        </section>
      </div>
    </Shell>
  );
}
