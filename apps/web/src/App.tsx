import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth } from './components/layout/RequireAuth'
import { PublicRoute } from './components/layout/PublicRoute'
import { Shell } from './components/layout/Shell'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { AttendancePage } from './pages/AttendancePage'
import { TeachersPage } from './features/teachers/TeachersPage'
import { RoomsPage } from './features/rooms/RoomsPage'

const ClassesPage = lazy(() =>
  import('./features/classes/ClassesPage').then((m) => ({ default: m.ClassesPage }))
)
const StudentsPage = lazy(() =>
  import('./features/students/StudentsPage').then((m) => ({ default: m.StudentsPage }))
)

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
          <Route
            path="classes"
            element={
              <Suspense fallback={null}>
                <ClassesPage />
              </Suspense>
            }
          />
          <Route
            path="students"
            element={
              <Suspense fallback={null}>
                <StudentsPage />
              </Suspense>
            }
          />
          <Route path="teachers" element={<TeachersPage />} />
          <Route path="rooms" element={<RoomsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/attendance" replace />} />
      </Routes>
    </AuthProvider>
  )
}
