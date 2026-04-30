import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './contexts/AuthContext'
import { RequireAuth } from './components/layout/RequireAuth'
import { PublicRoute } from './components/layout/PublicRoute'
import { Shell } from './components/layout/Shell'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { AttendancePage } from './pages/AttendancePage'
import { TeachersPage } from './features/teachers/TeachersPage'
import { RequireAdmin } from './components/layout/RequireAdmin'
import { SettingsPage } from './features/settings/SettingsPage'
import { PricingSection } from './features/settings/sections/PricingSection'
import { DanceStylesSection } from './features/settings/sections/DanceStylesSection'
import { ClassLevelsSection } from './features/settings/sections/ClassLevelsSection'
import { MembershipTypesSection } from './features/settings/sections/MembershipTypesSection'
import { ClassCardTypesSection } from './features/settings/sections/ClassCardTypesSection'
import { ExternalProvidersSection } from './features/settings/sections/ExternalProvidersSection'
import { TemplatesSection } from './features/settings/sections/TemplatesSection'
import { RoomsSection } from './features/settings/sections/RoomsSection'
import { UsersSection } from './features/settings/sections/UsersSection'

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
          <Route index element={<Navigate to="/dashboard" replace />} />
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
          <Route path="reports" element={<div className="p-7 text-muted-foreground">Reports — coming soon</div>} />
          <Route
            path="settings"
            element={
              <RequireAdmin>
                <SettingsPage />
              </RequireAdmin>
            }
          >
            <Route index element={<Navigate to="/settings/pricing" replace />} />
            <Route path="pricing" element={<PricingSection />} />
            <Route path="dance-styles" element={<DanceStylesSection />} />
            <Route path="class-levels" element={<ClassLevelsSection />} />
            <Route path="membership-types" element={<MembershipTypesSection />} />
            <Route path="class-card-types" element={<ClassCardTypesSection />} />
            <Route path="external-providers" element={<ExternalProvidersSection />} />
            <Route path="templates" element={<TemplatesSection />} />
            <Route path="rooms" element={<RoomsSection />} />
            <Route path="users" element={<UsersSection />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
