import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import PageLoader from '../ui/PageLoader';

export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader label="Validando acceso..." />;
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
}
