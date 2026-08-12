import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import type { ReactNode } from 'react';

export function Loader({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="loader" role="status">
      <span />
      <p>{label}</p>
    </div>
  );
}

type NoticeProps = {
  tone?: 'info' | 'error' | 'success';
  children: ReactNode;
  action?: ReactNode;
};

export function Notice({ tone = 'info', children, action }: NoticeProps) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span className="notice__message">{children}</span>
      {action}
    </div>
  );
}

type ToastProps = {
  tone?: 'error' | 'success';
  children: ReactNode;
  onDismiss: () => void;
};

export function Toast({ tone = 'success', children, onDismiss }: ToastProps) {
  const Icon = tone === 'success' ? CheckCircle2 : CircleAlert;
  return (
    <div className={`toast toast--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon aria-hidden="true" />
      <span>{children}</span>
      <button type="button" aria-label="Cerrar notificación" onClick={onDismiss}>
        <X />
      </button>
    </div>
  );
}

type EmptyProps = {
  icon?: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
  headingLevel?: 'h1' | 'h2';
};

export function Empty({ icon, title, children, action, headingLevel = 'h2' }: EmptyProps) {
  const Heading = headingLevel;

  return (
    <div className="empty">
      {icon && <div className="empty__icon">{icon}</div>}
      <Heading>{title}</Heading>
      <p>{children}</p>
      {action}
    </div>
  );
}
