import { apiFetch } from './client';
import type { AuthResponse, ProfileUpdate, User } from '../types/user';

export function register(email: string, password: string, nombre?: string) {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nombre }),
  });
}

export function login(email: string, password: string) {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(token: string) {
  return apiFetch<User>('/api/auth/me', { token });
}

export function updateProfile(data: ProfileUpdate, token: string) {
  return apiFetch<User>('/api/auth/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
    token,
  });
}

export function changePassword(currentPassword: string, newPassword: string, token: string) {
  return apiFetch<{ success: boolean }>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
    token,
  });
}

export function requestEmailVerification(token: string) {
  return apiFetch<{ sent: boolean }>('/api/auth/verify-email/request', {
    method: 'POST',
    token,
  });
}

export function confirmEmailVerification(verificationToken: string) {
  return apiFetch<{ verified: boolean }>('/api/auth/verify-email/confirm', {
    method: 'POST',
    body: JSON.stringify({ token: verificationToken }),
  });
}

export function forgotPassword(email: string) {
  return apiFetch<{ sent: boolean }>('/api/auth/password/forgot', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(resetToken: string, newPassword: string) {
  return apiFetch<{ reset: boolean }>('/api/auth/password/reset', {
    method: 'POST',
    body: JSON.stringify({ token: resetToken, newPassword }),
  });
}
