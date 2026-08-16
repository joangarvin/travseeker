import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({
  variant = 'primary',
  loading = false,
  loadingLabel = 'Procesando…',
  children,
  className = '',
  disabled,
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      data-loading={loading || undefined}
      {...buttonProps}
    >
      <span className="button__content" aria-hidden={loading || undefined}>
        {children}
      </span>
      {loading && (
        <span className="button__loading" role="status">
          <span className="button__spinner" aria-hidden="true" />
          {loadingLabel}
        </span>
      )}
    </button>
  );
}
