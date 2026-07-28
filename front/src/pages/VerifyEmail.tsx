import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BadgeCheck, XCircle, Loader2 } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { confirmEmailVerification } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

type Status = 'loading' | 'ok' | 'error';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    if (!token) {
      setStatus('error');
      setMessage('Falta el token de verificación en el enlace.');
      return;
    }

    confirmEmailVerification(token)
      .then(async () => {
        setStatus('ok');
        setMessage('Tu email ha sido verificado correctamente.');
        await refreshUser();
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof ApiError ? err.message : 'No se pudo verificar el email.');
      });
  }, [token, refreshUser]);

  return (
    <div className="page-shell page-shell--column">
      <Header />
      <section className="auth-status-section">
        <div className="ui-card status-card" aria-live="polite">
          {status === 'loading' && (
            <>
              <Loader2 className="icon-xl icon-brand icon-spin status-card__icon" />
              <h1 className="status-card__title status-card__title--sm">Verificando tu email…</h1>
            </>
          )}
          {status === 'ok' && (
            <>
              <BadgeCheck className="icon-xl icon-brand status-card__icon" style={{ width: '3.5rem', height: '3.5rem' }} />
              <h1 className="status-card__title">Email verificado</h1>
              <p className="status-card__text">{message}</p>
              <Link to="/" className="btn-cta">
                Ir al inicio
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="icon-xl icon-danger status-card__icon" style={{ width: '3.5rem', height: '3.5rem' }} />
              <h1 className="status-card__title">No se pudo verificar</h1>
              <p className="status-card__text">{message}</p>
              <Link to="/perfil" className="btn-cta">
                Ir a mi perfil
              </Link>
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
