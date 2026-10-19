import { t } from '../../i18n';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Loader({ label = t('Cargando') }: { label?: string }) {
  return (
    <div className="loader" role="status">
      <span />
      <p>{t(label)}</p>
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
  action?: ReactNode;
  duration?: number;
  className?: string;
};

export function Toast({
  tone = 'success',
  children,
  onDismiss,
  action,
  duration = 0,
  className = '',
}: ToastProps) {
  const Icon = tone === 'success' ? CheckCircle2 : CircleAlert;
  const [paused, setPaused] = useState(false);
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);
  useEffect(() => {
    if (!duration || paused) return;
    const timer = window.setTimeout(() => dismissRef.current(), duration);
    return () => window.clearTimeout(timer);
  }, [duration, paused]);
  return (
    <div
      className={`toast toast--${tone} ${className}`.trim()}
      role={tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
    >
      <Icon aria-hidden="true" />
      <span>{children}</span>
      {action && <div className="toast__action">{action}</div>}
      <button type="button" aria-label={t('Cerrar notificación')} onClick={onDismiss}>
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
