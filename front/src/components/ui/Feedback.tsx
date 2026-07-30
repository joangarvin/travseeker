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
};

export function Notice({ tone = 'info', children }: NoticeProps) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
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
