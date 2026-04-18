import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth } from './components/layout/RequireAuth'
import { PublicRoute } from './components/layout/PublicRoute'
import { Shell } from './components/layout/Shell'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AttendancePage } from './pages/AttendancePage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Shell />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="/attendance" replace />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/attendance" replace />} />
      </Routes>
    </AuthProvider>
  )
}
