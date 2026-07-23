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
  primary: 'bg-[var(--color-brand)] text-[var(--color-on-brand)] hover:bg-[var(--color-accent-hover)] border-transparent',
  secondary: 'bg-[var(--color-surface)] text-[var(--color-primary)] border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)]',
  ghost: 'bg-transparent text-[var(--color-primary-light)] border-transparent hover:bg-[var(--color-surface-2)]',
  danger: 'bg-transparent text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/8',
  mustard: 'bg-[var(--color-mostaza)] text-[#23281f] hover:brightness-105 border-transparent',
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
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        buttonVariants[variant],
        fullWidth && 'w-full',
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
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
      className={cx(
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-transparent text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-primary)] disabled:opacity-50',
        className,
      )}
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
      <label htmlFor={id} className="field-label mb-2 block text-[var(--color-mostaza)]">
        {label}
      </label>
      {children}
      {(error || hint) && (
        <p className={cx('mt-1.5 text-sm', error ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]')} role={error ? 'alert' : undefined}>
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
  return <textarea className={cx('ui-input resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx('ui-input select-field cursor-pointer', className)} {...props}>
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
    info: 'border-[var(--color-border-strong)] bg-[var(--color-surface-2)] text-[var(--color-primary)]',
    success: 'border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 text-[var(--color-brand-dark)]',
    error: 'border-[var(--color-danger)]/30 bg-[var(--color-danger)]/8 text-[var(--color-danger)]',
  };
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx('rounded-lg border px-4 py-3 text-sm', tones[tone], className)}
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
    <div className="ui-card flex flex-col items-center px-6 py-16 text-center">
      {icon && <div className="mb-5 text-[var(--color-muted)] opacity-70">{icon}</div>}
      <h3 className="font-serif text-xl sm:text-2xl font-medium text-[var(--color-primary)] tracking-tight">{title}</h3>
      <p className="mt-3 max-w-md text-sm sm:text-base leading-relaxed text-[var(--color-muted)]">{description}</p>
      {action && <div className="mt-7">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)]" role="status">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand)]" aria-hidden />
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
    <div className={cx(align === 'center' && 'text-center mx-auto', 'max-w-2xl mb-8 sm:mb-12', className)}>
      {eyebrow && (
        <span className="field-label text-[var(--color-teja)] mb-3 block">{eyebrow}</span>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium text-[var(--color-primary)] tracking-tight leading-[1.1]">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 sm:mt-4 text-[var(--color-muted)] text-base sm:text-lg leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}
