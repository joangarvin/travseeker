import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { Alert, Button, Field, Input } from '../components/ui/primitives';

type Mode = 'login' | 'register';

export default function Auth() {
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/favoritos', { replace: true });
  }, [user, navigate]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, nombre || undefined);
      }
      navigate('/favoritos');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ha ocurrido un error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell">
      <Header />

      <section className="auth-section">
        <div className="auth-section__inner">
          <div className="ui-card auth-card">
            <div className="auth-tabs">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`auth-tab ${mode === 'login' ? 'is-active' : ''}`}
              >
                <LogIn className="icon-sm" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`auth-tab ${mode === 'register' ? 'is-active' : ''}`}
              >
                <UserPlus className="icon-sm" />
                Registro
              </button>
            </div>

            <h1 className="auth-title">
              {mode === 'login' ? 'Vuelve dentro' : 'Hazte un hueco'}
            </h1>
            <p className="auth-lead">
              {mode === 'login'
                ? 'Tus favoritos siguen donde los dejaste.'
                : 'La cuenta es gratis y sirve para guardar sitios, no para llenarte el correo.'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <Field id="nombre" label="Nombre">
                  <Input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Cómo te llamamos"
                  />
                </Field>
              )}

              <Field id="email" label="Email">
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                />
              </Field>

              <Field id="password" label="Contraseña">
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </Field>

              {error && <Alert tone="error">{error}</Alert>}

              <Button type="submit" fullWidth loading={submitting}>
                {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </Button>
            </form>

            {mode === 'login' && (
              <p className="auth-footer-link">
                <Link to="/recuperar" className="link-nav">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
            )}

            <p className="auth-footer-home">
              <Link to="/" className="link-brand">
                Volver al inicio
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
