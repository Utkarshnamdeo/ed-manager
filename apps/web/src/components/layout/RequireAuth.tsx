import { Navigate } from 'react-router'
import { useAuth } from '../../contexts/AuthContext'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, appUser, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (!appUser) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-3 p-8 text-center">
        <p className="text-base font-semibold text-foreground m-0">
          User profile not found
        </p>
        <p className="text-sm text-muted-foreground max-w-[360px] m-0">
          Make sure the Firebase emulators are running and seed data has been loaded, then refresh the page.
        </p>
        <code className="text-[0.8rem] bg-muted px-3 py-2 rounded-[6px] text-foreground">
          firebase emulators:start --import=emulator-data
        </code>
      </div>
    )
  }

  return <>{children}</>
}
