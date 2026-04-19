import { Navigate } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading } = useAuth()

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

  if (!appUser) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem', padding: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-foreground)' }}>
          User profile not found
        </p>
        <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)', maxWidth: '360px' }}>
          Make sure the Firebase emulators are running and seed data has been loaded, then refresh the page.
        </p>
        <code style={{ fontSize: '0.8rem', backgroundColor: 'var(--color-muted)', padding: '0.5rem 0.75rem', borderRadius: '6px', color: 'var(--color-foreground)' }}>
          firebase emulators:start --import=emulator-data
        </code>
      </div>
    )
  }

  return <>{children}</>
}
