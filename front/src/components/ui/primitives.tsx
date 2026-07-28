import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { Loader2 } from 'lucide-react';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'mustard';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  fullWidth?: boolean;
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'ui-btn--primary',
  secondary: 'ui-btn--secondary',
  ghost: 'ui-btn--ghost',
  danger: 'ui-btn--danger',
  mustard: 'ui-btn--mustard',
};

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(
        'ui-btn',
        buttonVariants[variant],
        fullWidth && 'ui-btn--full',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="ui-btn__spinner" aria-hidden />}
      {children}
    </button>
  );
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export function IconButton({ label, className, children, ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cx('ui-icon-btn', className)}
      {...props}
    >
      {children}
    </button>
  );
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div>
      <label htmlFor={id} className="ui-field__label field-label">
        {label}
      </label>
      {children}
      {(error || hint) && (
        <p className={cx(error ? 'ui-field__error' : 'ui-field__hint')} role={error ? 'alert' : undefined}>
          {error || hint}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('ui-input', className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx('ui-input', className)} style={{ resize: 'vertical' }} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx('ui-input select-field', className)} style={{ cursor: 'pointer' }} {...props}>
      {children}
    </select>
  );
}

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('ui-card', className)} {...props}>
      {children}
    </div>
  );
}

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'success' | 'error';
}

export function Alert({ tone = 'info', className, children, ...props }: AlertProps) {
  const tones = {
    info: 'ui-alert--info',
    success: 'ui-alert--success',
    error: 'ui-alert--error',
  };
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx('ui-alert', tones[tone], className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="ui-card ui-empty-state">
      {icon && <div className="ui-empty-state__icon">{icon}</div>}
      <h3 className="ui-empty-state__title">{title}</h3>
      <p className="ui-empty-state__desc">{description}</p>
      {action && <div className="ui-empty-state__action">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <span className="ui-spinner" role="status">
      <Loader2 className="ui-spinner__icon" aria-hidden />
      {label}
    </span>
  );
}

/** Cabecera de sección: eyebrow + título serif + subtítulo */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cx('section-header', align === 'center' && 'section-header--center', className)}>
      {eyebrow && (
        <span className="section-header__eyebrow field-label">{eyebrow}</span>
      )}
      <h2 className="section-header__title">
        {title}
      </h2>
      {subtitle && (
        <p className="section-header__subtitle">{subtitle}</p>
      )}
    </div>
  );
}
