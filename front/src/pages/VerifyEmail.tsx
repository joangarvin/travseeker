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
    <div className="min-h-screen bg-[var(--color-secondary)] font-sans flex flex-col">
      <Header />
      <section className="flex-1 flex items-center justify-center px-6 pt-32 pb-20">
        <div className="max-w-md w-full text-center glass rounded-2xl border border-[var(--color-border)] p-10 shadow-xl">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-[var(--color-brand)] mx-auto mb-4 animate-spin" />
              <h1 className="font-serif text-2xl text-[var(--color-primary)]">Verificando tu email...</h1>
            </>
          )}
          {status === 'ok' && (
            <>
              <BadgeCheck className="w-14 h-14 text-[var(--color-brand)] mx-auto mb-4" />
              <h1 className="font-serif text-3xl text-[var(--color-primary)] mb-2">¡Email verificado!</h1>
              <p className="text-[var(--color-muted)] mb-8">{message}</p>
              <Link to="/" className="inline-flex px-6 py-3 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all">
                Ir al inicio
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-14 h-14 text-[var(--color-danger)] mx-auto mb-4" />
              <h1 className="font-serif text-3xl text-[var(--color-primary)] mb-2">No se pudo verificar</h1>
              <p className="text-[var(--color-muted)] mb-8">{message}</p>
              <Link to="/perfil" className="inline-flex px-6 py-3 rounded-xl bg-[var(--color-brand)] text-[var(--color-on-brand)] font-semibold hover:brightness-105 transition-all">
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
