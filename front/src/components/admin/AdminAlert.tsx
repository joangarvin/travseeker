interface Props {
  message: string;
  variant: 'error' | 'success';
}

export default function AdminAlert({ message, variant }: Props) {
  const className =
    variant === 'error'
      ? 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'
      : 'bg-[var(--color-brand)]/15 text-[var(--color-brand-dark)]';

  return (
    <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${className}`} role="alert">
      {message}
    </div>
  );
}
