import { useState } from 'react';
import type { User } from '../../types/user';
import { getUserInitials } from '../../utils/user';
import { getAvatarUrl } from '../../utils/images';

type Size = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<Size, string> = {
  sm: 'avatar--sm',
  md: 'avatar--md',
  lg: 'avatar--lg',
  xl: 'avatar--xl',
};

interface Props {
  user: Pick<User, 'nombre' | 'email' | 'avatarUrl'>;
  size?: Size;
  className?: string;
}

export default function Avatar({ user, size = 'md', className = '' }: Props) {
  const [imgError, setImgError] = useState(false);
  const initials = getUserInitials(user as User);
  const sizeClass = SIZE_CLASS[size];
  const src = getAvatarUrl(user.avatarUrl, size);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setImgError(true)}
        className={`avatar ${sizeClass} ${className}`.trim()}
      />
    );
  }

  return (
    <span
      className={`avatar avatar--initials ${sizeClass} ${className}`.trim()}
      aria-hidden
    >
      {initials}
    </span>
  );
}
