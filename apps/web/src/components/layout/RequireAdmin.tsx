import { Navigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '@/types';

export function RequireAdmin({ children }: { children: React.ReactNode; }) {
  const { appUser } = useAuth();

  if (appUser?.role !== Role.Admin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
