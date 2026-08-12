import { useEffect, useState } from 'react';
import { Check, MailCheck, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../contexts';
import { api } from '../../../services/api';
import { Button, Toast } from '../../../components/ui';

const DISMISS_KEY_PREFIX = 'trav_email_verification_banner_dismissed:v2:';
const HIDDEN_ROUTES = ['/auth', '/recuperar', '/verificar-email'];

type Feedback = { tone: 'success' | 'error'; message: string } | null;

export function EmailVerificationBanner() {
  const auth = useAuth();
  const { user, token } = auth;
  const location = useLocation();
  const dismissKey = user ? `${DISMISS_KEY_PREFIX}${user.id}` : '';
  const [dismissed, setDismissed] = useState(() =>
    dismissKey ? sessionStorage.getItem(dismissKey) === 'true' : false,
  );
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setDismissed(dismissKey ? sessionStorage.getItem(dismissKey) === 'true' : false);
    setSent(false);
    setFeedback(null);
  }, [dismissKey]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  if (!user || user.emailVerified || dismissed || HIDDEN_ROUTES.includes(location.pathname)) {
    return feedback ? (
      <Toast tone={feedback.tone} onDismiss={() => setFeedback(null)}>
        {feedback.message}
      </Toast>
    ) : null;
  }

  const resendVerification = async () => {
    if (!token || pending || sent) return;
    setPending(true);
    try {
      const result = await api<{ sent: boolean; verified: boolean }>(
        '/auth/verify-email/request',
        { method: 'POST' },
        token,
      );
      if (result.verified) {
        await auth.refresh();
        setFeedback({ tone: 'success', message: 'Tu cuenta ya estaba verificada.' });
        return;
      }
      setSent(true);
      setFeedback({
        tone: 'success',
        message: `Enlace enviado a ${user.email}. Revisa también la carpeta de spam.`,
      });
    } catch (cause) {
      setFeedback({
        tone: 'error',
        message: cause instanceof Error ? cause.message : 'No se pudo reenviar el enlace.',
      });
    } finally {
      setPending(false);
    }
  };

  const dismiss = () => {
    sessionStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  };

  return (
    <>
      <aside className="email-verification-banner" aria-labelledby="email-verification-title">
        <MailCheck aria-hidden="true" />
        <div>
          <strong id="email-verification-title">Confirma tu correo para completar tu cuenta</strong>
          <p>Podrás crear viajes, compartirlos y publicar reseñas.</p>
        </div>
        <Button
          variant="secondary"
          loading={pending}
          disabled={sent}
          onClick={() => void resendVerification()}
        >
          {sent ? <><Check /> Enlace enviado</> : 'Reenviar verificación'}
        </Button>
        <button
          className="email-verification-banner__dismiss"
          type="button"
          aria-label="Ocultar aviso de verificación durante esta sesión"
          onClick={dismiss}
        >
          <X />
        </button>
      </aside>
      {feedback && (
        <Toast tone={feedback.tone} onDismiss={() => setFeedback(null)}>
          {feedback.message}
        </Toast>
      )}
    </>
  );
}
