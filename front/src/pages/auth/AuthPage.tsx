import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Shell } from '../../components/layout';
import { Button, Field, Notice } from '../../components/ui';
import { useAuth } from '../../contexts';

type AuthMode = 'login' | 'register';

export default function AuthPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/favoritos', { replace: true });
    }
  }, [navigate, user]);

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
      navigate('/favoritos');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo continuar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <Shell>
      <section className="auth-layout">
        <div className="auth-layout__visual">
          <span>
            Viaja con una idea.
            <br />
            Vuelve con una historia.
          </span>
        </div>

        <div className="auth-panel">
          <Link to="/" className="auth-panel__back">
            <ArrowLeft /> Volver
          </Link>

          <div className="auth-tabs" role="tablist">
            <button role="tab" aria-selected={isLogin} onClick={() => setMode('login')}>
              Entrar
            </button>
            <button role="tab" aria-selected={!isLogin} onClick={() => setMode('register')}>
              Crear cuenta
            </button>
          </div>

          <h1>{isLogin ? 'Qué bueno verte.' : 'Guarda el próximo viaje.'}</h1>
          <p>
            {isLogin
              ? 'Tus destinos y viajes siguen aquí.'
              : 'Una cuenta sirve para guardar, comparar y organizar. Nada más.'}
          </p>

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <Field label="Nombre" htmlFor="nombre">
                <input
                  id="nombre"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                />
              </Field>
            )}

            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Contraseña" htmlFor="password" hint="Mínimo 8 caracteres">
              <div className="password-field">
                <input
                  id="password"
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={8}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                  aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {isPasswordVisible ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </Field>

            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" loading={isSubmitting}>
              {isLogin ? 'Entrar' : 'Crear cuenta'}
            </Button>
          </form>

          {isLogin && (
            <Link className="auth-panel__forgot" to="/recuperar">
              He olvidado mi contraseña
            </Link>
          )}
        </div>
      </section>
    </Shell>
  );
}
