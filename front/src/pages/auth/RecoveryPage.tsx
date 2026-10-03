import { t } from '../../i18n';
import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { KeyRound, Mail } from 'lucide-react';
import { Shell } from '../../components/layout';
import { Button, Field, Notice } from '../../components/ui';
import { api } from '../../services/api';

export default function RecoveryPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (token) {
        await api('/auth/password/reset', {
          method: 'POST',
          body: JSON.stringify({ token, newPassword: password }),
        });
        setMessage(t('Contraseña actualizada. Ya puedes entrar.'));
      } else {
        await api('/auth/password/forgot', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        setMessage(t('Si existe una cuenta con ese email, recibirás un enlace en unos minutos.'));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('No se pudo completar la solicitud'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Shell>
      <section className="status-form">
        <div className="status-form__icon">{token ? <KeyRound /> : <Mail />}</div>
        <p className="kicker">{t('Acceso a tu cuenta')}</p>
        <h1>{token ? t('Crea una contraseña nueva') : t('Recupera tu contraseña')}</h1>
        <p>
          {token
            ? t('Elige una contraseña que no uses en otros servicios.')
            : t('Te enviaremos un enlace de recuperación si el email está registrado.')}
        </p>

        {message ? (
          <>
            <Notice tone="success">{message}</Notice>
            <Link className="button button--primary" to="/auth">
              {t('Volver a entrar')}
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <Field
              label={token ? t('Nueva contraseña') : t('Email')}
              htmlFor="recovery"
              hint={token ? t('Mínimo 8 caracteres') : undefined}
            >
              <input
                id="recovery"
                type={token ? 'password' : 'email'}
                value={token ? password : email}
                onChange={(event) =>
                  token ? setPassword(event.target.value) : setEmail(event.target.value)
                }
                minLength={token ? 8 : undefined}
                required
                autoComplete={token ? 'new-password' : 'email'}
              />
            </Field>
            {error && <Notice tone="error">{error}</Notice>}
            <Button type="submit" loading={isSubmitting}>
              {token ? t('Guardar contraseña') : t('Enviar enlace')}
            </Button>
          </form>
        )}
      </section>
    </Shell>
  );
}
