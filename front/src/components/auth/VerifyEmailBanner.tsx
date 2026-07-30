import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { requestEmailVerification } from '../../api/auth';
import { ApiError } from '../../api/client';

const HIDDEN_PATHS = new Set(['/auth', '/perfil', '/verificar-email', '/recuperar']);

export default function VerifyEmailBanner() {
  const { user, token } = useAuth();
  const location = useLocation();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  if (!user || user.emailVerified || HIDDEN_PATHS.has(location.pathname)) {
    return null;
  }

  const handleResend = async () => {
    if (!token || sending) return;
    setSending(true);
    setError('');
    try {
      await requestEmailVerification(token);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo enviar el email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="verify-banner" role="status">
      <div className="verify-banner__inner">
        <AlertTriangle className="verify-banner__icon" aria-hidden />
        <p className="verify-banner__text">
          Confirma tu email para firmar el libro de visitas y proteger la cuenta.{' '}
          <Link to="/perfil" className="verify-banner__link">Ir al perfil</Link>
        </p>
        {sent ? (
          <span className="verify-banner__sent">Email enviado</span>
        ) : (
          <button
            type="button"
            className="verify-banner__action"
            onClick={handleResend}
            disabled={sending}
          >
            {sending ? 'Enviando…' : 'Reenviar'}
          </button>
        )}
        {error && <span className="verify-banner__error">{error}</span>}
      </div>
    </div>
  );
}
