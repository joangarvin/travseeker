import { t } from '../i18n';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('TravSeeker render error', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="status-page" role="alert">
        <div>
          <p className="kicker">{t('La guía necesita un momento')}</p>
          <h1>{t('Algo se ha interrumpido')}</h1>
          <p>
            {t('La pantalla no pudo cargarse. Puedes intentarlo de nuevo sin perder tu sesión.')}
          </p>
          <button
            className="button button--primary"
            type="button"
            onClick={() => window.location.reload()}
          >
            <RefreshCw aria-hidden /> {t('Reintentar')}
          </button>
        </div>
      </main>
    );
  }
}
