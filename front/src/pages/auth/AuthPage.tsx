import { t } from '../../i18n';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Shell } from '../../components/layout';
import { Button, Field, Notice } from '../../components/ui';
import { useAuth } from '../../contexts';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const requestedReturnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const returnTo = requestedReturnTo?.startsWith('/') ? requestedReturnTo : '/';

  useEffect(() => {
    if (user) {
      navigate(returnTo, { replace: true });
    }
  }, [navigate, returnTo, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      navigate(returnTo);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudo continuar'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = mode === 'login';
  const moveTab = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const nextMode =
        event.key === 'ArrowRight'
          ? isLogin
            ? 'register'
            : 'login'
          : isLogin
            ? 'register'
            : 'login';
      setMode(nextMode);
      requestAnimationFrame(() => document.getElementById(`auth-tab-${nextMode}`)?.focus());
    }
  };

  return (
    <Shell>
      <section className="auth-layout">
        <div className="auth-layout__visual">
          <span>
            {t('Viaja con una idea.')}
            <br />
            {t('Vuelve con una historia.')}
          </span>
        </div>

        <div className="auth-panel">
          <Link to="/" className="auth-panel__back">
            <ArrowLeft /> {t('Volver')}
          </Link>

          <div className="auth-tabs" role="tablist" aria-label={t('Acceso y registro')}>
            <button
              id="auth-tab-login"
              role="tab"
              aria-selected={isLogin}
              aria-controls="auth-panel"
              tabIndex={isLogin ? 0 : -1}
              type="button"
              onKeyDown={moveTab}
              onClick={() => setMode('login')}
            >
              {t('Entrar')}
            </button>
            <button
              id="auth-tab-register"
              role="tab"
              aria-selected={!isLogin}
              aria-controls="auth-panel"
              tabIndex={isLogin ? -1 : 0}
              type="button"
              onKeyDown={moveTab}
              onClick={() => setMode('register')}
            >
              {t('Crear cuenta')}
            </button>
          </div>

          <section
            id="auth-panel"
            role="tabpanel"
            aria-labelledby={isLogin ? 'auth-tab-login' : 'auth-tab-register'}
          >
            <h1>{isLogin ? t('Qué bueno verte.') : t('Guarda el próximo viaje.')}</h1>
            <p>
              {isLogin
                ? t('Tus destinos y viajes siguen aquí.')
                : t('Una cuenta sirve para guardar, comparar y organizar. Nada más.')}
            </p>

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <Field label={t('Nombre')} htmlFor="nombre">
                  <input
                    id="nombre"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                  />
                </Field>
              )}

              <Field label={t('Email')} htmlFor="email">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                />
              </Field>

              <Field label={t('Contraseña')} htmlFor="password" hint={t('Mínimo 8 caracteres')}>
                <div className="password-field">
                  <input
                    id="password"
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    aria-describedby="password-hint"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                    aria-label={
                      isPasswordVisible ? t('Ocultar contraseña') : t('Mostrar contraseña')
                    }
                  >
                    {isPasswordVisible ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </Field>

              {!isLogin && (
                <p className="auth-legal">
                  {t(
                    'Al crear una cuenta solicitas las funciones del servicio. Consulta cómo tratamos tus datos y las condiciones de uso.',
                  )}{' '}
                  <Link to="/privacidad">{t('Política de privacidad')}</Link> ·{' '}
                  <Link to="/aviso-legal">{t('Condiciones de uso')}</Link>
                </p>
              )}
              {error && <Notice tone="error">{error}</Notice>}
              <Button type="submit" loading={isSubmitting}>
                {isLogin ? t('Entrar') : t('Crear cuenta')}
              </Button>
            </form>

            {isLogin && (
              <Link className="auth-panel__forgot" to="/recuperar">
                {t('He olvidado mi contraseña')}
              </Link>
            )}
          </section>
        </div>
      </section>
    </Shell>
  );
}
