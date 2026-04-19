import { Navigate } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (user) return <Navigate to="/attendance" replace />
  return <>{children}</>
}
