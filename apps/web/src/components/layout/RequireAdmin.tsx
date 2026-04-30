import { Navigate } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { appUser } = useAuth()

  if (appUser?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
