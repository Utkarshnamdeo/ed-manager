import { Navigate } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div
          style={{
            width: '2rem',
            height: '2rem',
            borderRadius: '9999px',
            border: '4px solid var(--color-primary)',
            borderTopColor: 'transparent',
            animation: 'spin 0.75s linear infinite',
          }}
        />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}
