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
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />

      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 grain overflow-hidden">
        <div className="relative z-10 max-w-md mx-auto">
          <div className="ui-card p-7 sm:p-8">
            <div className="flex gap-1 mb-7 p-1 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)]'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Registro
              </button>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--color-primary)] mb-2 tracking-tight">
              {mode === 'login' ? 'Vuelve dentro' : 'Hazte un hueco'}
            </h1>
            <p className="text-sm text-[var(--color-muted)] mb-6 leading-relaxed">
              {mode === 'login'
                ? 'Tus favoritos siguen donde los dejaste.'
                : 'La cuenta es gratis y sirve para guardar sitios, no para llenarte el correo.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
              <p className="text-center text-sm mt-4">
                <Link to="/recuperar" className="text-[var(--color-nav)] hover:text-[var(--color-brand-dark)] hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
            )}

            <p className="text-center text-sm mt-6">
              <Link to="/" className="text-[var(--color-brand-dark)] hover:underline">
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
