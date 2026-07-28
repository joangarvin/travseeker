import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, MailCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { forgotPassword, resetPassword } from '../api/auth';
import { ApiError } from '../api/client';
import { Alert } from '../components/ui/primitives';

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
    <div className="page-shell">
      <Header />
      <section className="auth-section">
        <div className="auth-section__inner">
          <div className="ui-card auth-card">
            <div className="recover-card__icon-wrap">
              <KeyRound className="icon-md" />
            </div>

            {token ? (
              <>
                <h1 className="auth-title">Nueva contraseña</h1>
                <p className="auth-lead">Elige una contraseña segura para tu cuenta.</p>
                <form onSubmit={handleReset} className="recover-form">
                  <div>
                    <label htmlFor="password" className="form-label">Nueva contraseña</label>
                    <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="ui-input" placeholder="Mínimo 8 caracteres" />
                  </div>
                  <div>
                    <label htmlFor="confirm" className="form-label">Confirmar contraseña</label>
                    <input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="ui-input" placeholder="Repite la contraseña" />
                  </div>
                  {error && <Alert tone="error">{error}</Alert>}
                  <button type="submit" disabled={submitting} className="btn-cta">
                    {submitting ? 'Guardando...' : 'Restablecer contraseña'}
                  </button>
                </form>
              </>
            ) : sent ? (
              <div style={{ textAlign: 'center' }}>
                <MailCheck className="icon-xl icon-brand" style={{ margin: '0 auto 1rem' }} />
                <h1 className="auth-title">Revisa tu correo</h1>
                <p className="auth-lead">
                  Si existe una cuenta con ese email, te hemos enviado un enlace para restablecer tu contraseña.
                </p>
                <Link to="/auth" className="link-brand">Volver a iniciar sesión</Link>
              </div>
            ) : (
              <>
                <h1 className="auth-title">Recuperar contraseña</h1>
                <p className="auth-lead">Introduce tu email y te enviaremos un enlace para recuperarla.</p>
                <form onSubmit={handleRequest} className="recover-form">
                  <div>
                    <label htmlFor="email" className="form-label">Email</label>
                    <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="ui-input" placeholder="tu@email.com" />
                  </div>
                  {error && <Alert tone="error">{error}</Alert>}
                  <button type="submit" disabled={submitting} className="btn-cta">
                    {submitting ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </form>
                <p className="form-footer-link">
                  <Link to="/auth" className="link-brand">Volver a iniciar sesión</Link>
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
