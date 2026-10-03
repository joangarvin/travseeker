import {
  t,
  intlLocale,
  languages,
  changeLanguage,
  locale as interfaceLocale,
  resolveLocale,
} from '../../i18n';
import { useEffect, useState } from 'react';
import { Bell, Check, KeyRound, LogOut, Settings, Shield, Trash2, UserRound } from 'lucide-react';
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
  const [alertActionPending, setAlertActionPending] = useState(false);
  useEffect(() => {
    if (!user) return;
    setName(user.nombre || '');
    setSurname(user.apellidos || '');
    setBio(user.bio || '');
    setLocale(interfaceLocale);
    const prefs = (user.preferences || {}) as any;
    setNotifications(prefs.notifications ?? true);
    setAvoidCrowds(prefs.travel?.evitarMasificacion ?? false);
    setBudget(prefs.travel?.presupuesto || '');
    if (token) {
      api<Alert[]>('/alertas', {}, token)
        .then(setAlerts)
        .catch((cause) =>
          setFeedback({
            tone: 'error',
            text: cause instanceof Error ? cause.message : t('No se pudieron cargar las alertas'),
          }),
        );
    }
  }, [user, token]);
  if (auth.loading)
    return (
      <Shell>
        <Loader />
      </Shell>
    );
  if (!user)
    return (
      <GuestGate title={t('Tu espacio personal')}>
        {t('Entra para gestionar perfil, preferencias y alertas de viaje.')}
      </GuestGate>
    );
  const save = async (payload: Record<string, unknown>) => {
    if (!token) return;
    setSaving(true);
    setFeedback(null);
    try {
      await api('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }, token);
      await auth.refresh();
      if (typeof payload.locale === 'string' && resolveLocale(payload.locale) !== interfaceLocale)
        changeLanguage(resolveLocale(payload.locale));
      setFeedback({ tone: 'success', text: t('Cambios guardados') });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo guardar'),
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
      setFeedback({ tone: 'success', text: t('Contraseña actualizada') });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo actualizar'),
      });
    }
  };
  const createAlert = async () => {
    if (!token) return;
    setAlertActionPending(true);
    try {
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
      setFeedback({ tone: 'success', text: t('Alerta creada') });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo crear la alerta'),
      });
    } finally {
      setAlertActionPending(false);
    }
  };
  const deleteAlert = async (id: string) => {
    if (!token) return;
    setAlertActionPending(true);
    try {
      await api(`/alertas/${id}`, { method: 'DELETE' }, token);
      setAlerts((current) => current.filter((item) => item.id !== id));
      setFeedback({ tone: 'success', text: t('Alerta eliminada') });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        text: cause instanceof Error ? cause.message : t('No se pudo eliminar la alerta'),
      });
    } finally {
      setAlertActionPending(false);
    }
  };
  const moveProfileTab = (event: React.KeyboardEvent<HTMLButtonElement>, current: string) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const ids = ['profile', 'preferences', 'security'];
    const currentIndex = ids.indexOf(current);
    const nextIndex =
      event.key === 'ArrowRight'
        ? (currentIndex + 1) % ids.length
        : (currentIndex - 1 + ids.length) % ids.length;
    const next = ids[nextIndex] as typeof tab;
    setTab(next);
    requestAnimationFrame(() => document.getElementById(`profile-tab-${next}`)?.focus());
  };
  return (
    <Shell>
      <PageHeading
        kicker={t('Cuenta')}
        title={user.nombre ? t('Hola, {0}', { 0: user.nombre }) : t('Tu perfil')}
        action={
          <Button variant="quiet" onClick={auth.logout}>
            <LogOut /> {t('Salir')}
          </Button>
        }
      >
        <p>{t('Configura cómo quieres descubrir y guardar viajes.')}</p>
      </PageHeading>
      <div className="profile-layout">
        <nav className="profile-nav" aria-label={t('Secciones del perfil')} role="tablist">
          {[
            ['profile', t('Perfil'), UserRound],
            ['preferences', t('Preferencias'), Settings],
            ['security', t('Seguridad'), Shield],
          ].map(([id, label, Icon]: any) => (
            <button
              key={id}
              id={`profile-tab-${id}`}
              className={tab === id ? 'is-active' : ''}
              role="tab"
              aria-selected={tab === id}
              aria-controls="profile-panel"
              tabIndex={tab === id ? 0 : -1}
              type="button"
              onKeyDown={(event) => moveProfileTab(event, id)}
              onClick={() => setTab(id)}
            >
              <Icon /> {t(label)}
            </button>
          ))}
        </nav>
        <section
          key={tab}
          id="profile-panel"
          className="profile-panel"
          role="tabpanel"
          aria-labelledby={`profile-tab-${tab}`}
        >
          {feedback && <Notice tone={feedback.tone}>{feedback.text}</Notice>}
          {tab === 'profile' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save({ nombre: name, apellidos: surname, bio, locale });
              }}
            >
              <h2>{t('Información personal')}</h2>
              {token && (
                <ImageUploader
                  id="profile-avatar"
                  label={t('Foto de perfil')}
                  value={user.avatarUrl}
                  token={token}
                  endpoint="/upload/avatar"
                  circular
                  onChange={(url) => void save({ avatarUrl: url })}
                />
              )}
              <div className="form-grid">
                <Field label={t('Nombre')} htmlFor="profile-name">
                  <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <Field label={t('Apellidos')} htmlFor="profile-surname">
                  <input
                    id="profile-surname"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                  />
                </Field>
              </div>
              <Field label={t('Bio')} htmlFor="profile-bio" hint={t('Máximo 280 caracteres')}>
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                />
              </Field>
              <Field label={t('Idioma')} htmlFor="profile-locale">
                <select
                  id="profile-locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                >
                  {languages.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Button type="submit" loading={saving}>
                {t('Guardar perfil')}
              </Button>
            </form>
          )}
          {tab === 'preferences' && (
            <div>
              <h2>{t('Preferencias de viaje')}</h2>
              <div className="setting-row">
                <div>
                  <Bell />
                  <span>
                    <b>{t('Notificaciones')}</b>
                    <small>{t('Actualizaciones útiles sobre tus viajes')}</small>
                  </span>
                </div>
                <button
                  role="switch"
                  type="button"
                  aria-label={t('Activar notificaciones')}
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
                    <b>{t('Evitar aglomeraciones')}</b>
                    <small>{t('Prioriza épocas y destinos más tranquilos')}</small>
                  </span>
                </div>
                <button
                  role="switch"
                  type="button"
                  aria-label={t('Evitar aglomeraciones')}
                  aria-checked={avoidCrowds}
                  className={`switch ${avoidCrowds ? 'is-on' : ''}`}
                  onClick={() => setAvoidCrowds((value) => !value)}
                >
                  <span />
                </button>
              </div>
              <Field label={t('Presupuesto habitual')} htmlFor="profile-budget">
                <select
                  id="profile-budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                >
                  <option value="">{t('Sin preferencia')}</option>
                  <option>{t('Bajo')}</option>
                  <option>{t('Medio-Bajo')}</option>
                  <option>{t('Medio')}</option>
                  <option>{t('Medio-Alto')}</option>
                  <option>{t('Alto')}</option>
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
                {t('Guardar preferencias')}
              </Button>
              <div className="alerts">
                <h3>{t('Alertas de decisión')}</h3>
                <div className="alerts__create">
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    aria-label={t('Mes para la alerta')}
                  >
                    <option value="">{t('Cualquier mes')}</option>
                    {Array.from({ length: 12 }).map((_, i) => (
                      <option key={i} value={i + 1}>
                        {new Date(2026, i).toLocaleString(intlLocale, { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="secondary"
                    loading={alertActionPending}
                    onClick={() => void createAlert()}
                  >
                    {t('Crear alerta')}
                  </Button>
                </div>
                {alerts.map((alert) => (
                  <article key={alert.id}>
                    <Bell />
                    <span>
                      {alert.month
                        ? new Date(2026, alert.month - 1).toLocaleString(intlLocale, {
                            month: 'long',
                          })
                        : t('Cualquier mes')}{' '}
                      · {alert.presupuesto || t('Cualquier presupuesto')}
                    </span>
                    <button
                      type="button"
                      disabled={alertActionPending}
                      onClick={() => void deleteAlert(alert.id)}
                      aria-label={t('Eliminar alerta')}
                    >
                      <Trash2 />
                    </button>
                  </article>
                ))}
              </div>
            </div>
          )}
          {tab === 'security' && (
            <form onSubmit={changePassword}>
              <h2>{t('Contraseña')}</h2>
              <p className="panel-intro">
                {t('Usa una contraseña única de al menos ocho caracteres.')}
              </p>
              <Field label={t('Contraseña actual')} htmlFor="current-password">
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field label={t('Nueva contraseña')} htmlFor="new-password">
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
              <Button type="submit">
                <KeyRound /> {t('Cambiar contraseña')}
              </Button>
            </form>
          )}
        </section>
      </div>
    </Shell>
  );
}
