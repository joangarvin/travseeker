import { t } from '../../i18n';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';
import { Shell } from '../../components/layout';
import { Notice } from '../../components/ui';
import { useAuth } from '../../contexts';
import { api } from '../../services/api';

type VerificationStatus = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<VerificationStatus>(token ? 'loading' : 'error');
  const [message, setMessage] = useState(
    token ? t('Verificando tu dirección…') : t('Falta el token de verificación.'),
  );

  useEffect(() => {
    if (!token) return;

    const confirmVerification = async () => {
      try {
        await api('/auth/verify-email/confirm', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        await auth.refresh();
        setStatus('success');
        setMessage(t('Tu cuenta está activa. Ya puedes crear y compartir viajes.'));
      } catch (cause) {
        setStatus('error');
        setMessage(cause instanceof Error ? cause.message : t('El enlace no es válido'));
      }
    };

    void confirmVerification();
  }, [auth.refresh, token]);

  const title =
    status === 'loading'
      ? t('Un momento')
      : status === 'success'
        ? t('Todo listo')
        : t('No pudimos verificarte');

  return (
    <Shell>
      <section className="status-form">
        <div className="status-form__icon">
          {status === 'success' ? <CheckCircle2 /> : <Mail />}
        </div>
        <p className="kicker">{t('Verificación')}</p>
        <h1>{title}</h1>
        <Notice tone={status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}>
          {message}
        </Notice>
        {status !== 'loading' && (
          <Link className="button button--primary" to={status === 'success' ? '/colecciones' : '/'}>
            {status === 'success' ? t('Ir a mis viajes') : t('Volver al inicio')}
          </Link>
        )}
      </section>
    </Shell>
  );
}
