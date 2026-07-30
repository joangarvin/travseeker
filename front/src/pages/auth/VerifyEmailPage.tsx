import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';
import { Shell } from '../../components/layout';
import { Notice } from '../../components/ui';
import { api } from '../../services/api';

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<VerificationStatus>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? 'Verificando tu dirección…' : 'Falta el token de verificación.',
  );

  useEffect(() => {
    if (!token) return;

    api('/auth/verify-email/confirm', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(() => {
        setStatus('success');
        setMessage('Tu email ya está verificado.');
      })
      .catch((cause) => {
        setStatus('error');
        setMessage(cause instanceof Error ? cause.message : 'El enlace no es válido');
      });
  }, [token]);

  const title =
    status === 'loading'
      ? 'Un momento'
      : status === 'success'
        ? 'Todo listo'
        : 'No pudimos verificarte';

  return (
    <Shell>
      <section className="status-form">
        <div className="status-form__icon">
          {status === 'success' ? <CheckCircle2 /> : <Mail />}
        </div>
        <p className="kicker">Verificación</p>
        <h1>{title}</h1>
        <Notice tone={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}>
          {message}
        </Notice>
        {status !== 'loading' && (
          <Link className="button button--primary" to={status === 'success' ? '/perfil' : '/'}>
            {status === 'success' ? 'Ir a mi perfil' : 'Volver al inicio'}
          </Link>
        )}
      </section>
    </Shell>
  );
}
