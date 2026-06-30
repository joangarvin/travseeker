import { useState } from 'react';
import type { User } from '../../types/user';
import { getUserInitials } from '../../utils/user';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZES: Record<Size, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-24 h-24 text-3xl',
};

interface Props {
  user: Pick<User, 'nombre' | 'email' | 'avatarUrl'>;
  size?: Size;
  className?: string;
}

export default function Avatar({ user, size = 'md', className = '' }: Props) {
  const [imgError, setImgError] = useState(false);
  const initials = getUserInitials(user as User);
  const dim = SIZES[size];

  if (user.avatarUrl && !imgError) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        onError={() => setImgError(true)}
        className={`${dim} rounded-full object-cover ring-2 ring-[var(--color-brand)]/30 ${className}`}
      />
    );
  }

  return (
    <span
      className={`${dim} rounded-full flex items-center justify-center font-semibold bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] text-[var(--color-on-brand)] ring-2 ring-[var(--color-brand)]/20 shrink-0 ${className}`}
      aria-hidden
    >
      {initials}
    </span>
  );
}
