import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { forgotPassword, resetPassword } from '../api/auth';
import { ApiError } from '../api/client';

const inputClass =
  'ui-input';
const labelClass = 'mb-1.5 block text-sm font-medium text-[var(--color-primary)]';

export default function RecoverPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo procesar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setSubmitting(true);
    setError('');
    try {
      await resetPassword(token!, password);
      navigate('/auth', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo restablecer la contraseña');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans">
      <Header />
      <section className="relative px-4 pb-16 pt-24 sm:px-6 sm:pb-20 sm:pt-32">
        <div className="relative z-10 max-w-md mx-auto">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[var(--shadow-card)]">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-brand)]/15 flex items-center justify-center text-[var(--color-brand-dark)] mb-5">
              <KeyRound className="w-6 h-6" />
            </div>

            {token ? (
              <>
                <h1 className="mb-2 text-2xl font-semibold text-[var(--color-primary)]">Nueva contraseña</h1>
                <p className="text-sm text-[var(--color-muted)] mb-6">Elige una contraseña segura para tu cuenta.</p>
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label htmlFor="password" className={labelClass}>Nueva contraseña</label>
                    <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} placeholder="Mínimo 8 caracteres" />
                  </div>
                  <div>
                    <label htmlFor="confirm" className={labelClass}>Confirmar contraseña</label>
                    <input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputClass} placeholder="Repite la contraseña" />
                  </div>
                  {error && <p role="alert" className="text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/25 rounded-xl px-4 py-3">{error}</p>}
                  <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50">
                    {submitting ? 'Guardando...' : 'Restablecer contraseña'}
                  </button>
                </form>
              </>
            ) : sent ? (
              <div className="text-center">
                <MailCheck className="w-12 h-12 text-[var(--color-brand)] mx-auto mb-4" />
                <h1 className="mb-2 text-2xl font-semibold text-[var(--color-primary)]">Revisa tu correo</h1>
                <p className="text-sm text-[var(--color-muted)] mb-6">
                  Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña.
                </p>
                <Link to="/auth" className="text-[var(--color-brand-dark)] font-medium hover:underline">Volver a iniciar sesión</Link>
              </div>
            ) : (
              <>
                <h1 className="mb-2 text-2xl font-semibold text-[var(--color-primary)]">Recuperar contraseña</h1>
                <p className="text-sm text-[var(--color-muted)] mb-6">Introduce tu email y te enviaremos un enlace para recuperarla.</p>
                <form onSubmit={handleRequest} className="space-y-4">
                  <div>
                    <label htmlFor="email" className={labelClass}>Email</label>
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" />
                  </div>
                  {error && <p role="alert" className="text-sm text-[var(--color-danger)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/25 rounded-xl px-4 py-3">{error}</p>}
                  <button type="submit" disabled={submitting} className="w-full py-3.5 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all disabled:opacity-50">
                    {submitting ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </form>
                <p className="text-center text-sm text-[var(--color-muted)] mt-6">
                  <Link to="/auth" className="text-[var(--color-brand-dark)] font-medium hover:underline">Volver a iniciar sesión</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
