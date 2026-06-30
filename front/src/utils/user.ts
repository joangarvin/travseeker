import type { User } from '../types/user';

export function getDisplayName(user: User): string {
  return user.nombre?.trim() || user.email.split('@')[0];
}

export function getUserInitials(user: User): string {
  if (user.nombre?.trim()) {
    const parts = user.nombre.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}
