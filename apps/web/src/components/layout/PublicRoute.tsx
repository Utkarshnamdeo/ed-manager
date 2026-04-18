import { Navigate } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'

export function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
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

  if (user) return <Navigate to="/attendance" replace />
  return <>{children}</>
}
