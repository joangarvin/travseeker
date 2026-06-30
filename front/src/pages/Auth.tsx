import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

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

      <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 hero-mesh grain overflow-hidden">
        <div className="blob blob-1 opacity-40" />
        <div className="relative z-10 max-w-md mx-auto">
          <div className="glass rounded-2xl border border-[var(--color-border)] p-8 shadow-xl">
            <div className="flex gap-2 mb-8 p-1 rounded-full bg-[var(--color-border)]/50">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)] shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-[var(--color-brand)] text-[var(--color-on-brand)] shadow-sm'
                    : 'text-[var(--color-muted)] hover:text-[var(--color-primary)]'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Registrarse
              </button>
            </div>

            <h1 className="font-serif text-2xl font-medium text-[var(--color-primary)] mb-2">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
            </h1>
            <p className="text-sm text-[var(--color-muted)] mb-6">
              {mode === 'login'
                ? 'Accede para ver y gestionar tus destinos favoritos.'
                : 'Guarda destinos y planifica tus viajes desde un solo lugar.'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div>
                  <label htmlFor="nombre" className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wide">
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)]/50 transition-colors"
                    placeholder="Tu nombre"
                  />
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)]/50 transition-colors"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-[var(--color-muted)] mb-1.5 uppercase tracking-wide">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)]/50 transition-colors"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              {error && (
                <p className="text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/25 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50"
              >
                {submitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
              </button>
            </form>

            {mode === 'login' && (
              <p className="text-center text-sm mt-4">
                <Link to="/recuperar" className="text-[var(--color-muted)] hover:text-[var(--color-brand-dark)] hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </p>
            )}

            <p className="text-center text-sm text-[var(--color-muted)] mt-6">
              <Link to="/" className="text-[var(--color-brand)] hover:underline">
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
