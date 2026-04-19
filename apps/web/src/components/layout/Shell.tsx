import { Outlet, NavLink, useNavigate, useLocation } from 'react-router'
import { signOut } from 'firebase/auth'
import { useTranslation } from 'react-i18next'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'

/* ─── Page title map ───────────────────────────────────────────────────────── */

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/dashboard':  'nav.dashboard',
  '/attendance': 'nav.attendance',
  '/students':   'nav.students',
  '/teachers':   'nav.teachers',
  '/rooms':      'nav.rooms',
  '/reports':    'nav.reports',
  '/settings':   'nav.settings',
}


function usePageTitle() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const key = Object.entries(PAGE_TITLE_KEYS).find(
    ([path]) => pathname === path || pathname.startsWith(path + '/')
  )?.[1]
  return key ? t(key) : t('app.name')
}

/* ─── Icons ────────────────────────────────────────────────────────────────── */

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconAttendance() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <polyline points="9,16 11,18 15,14" />
    </svg>
  )
}

function IconStudents() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconReports() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconTeachers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  )
}

function IconRooms() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function IconSignOut() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

/* ─── Avatar utility ───────────────────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

/* ─── Nav class helper ─────────────────────────────────────────────────────── */

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'sidebar-nav-item-active' : 'sidebar-nav-item'
}

/* ─── Language Toggle ──────────────────────────────────────────────────────── */

function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = i18n.language.startsWith('de') ? 'de' : 'en'
  const langs = ['en', 'de'] as const

  return (
    <div
      aria-label={t('language.toggle')}
      style={{
        display: 'flex',
        height: '36px',
        borderRadius: '9999px',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-card)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {langs.map((lang) => {
        const isActive = current === lang
        return (
          <button
            key={lang}
            onClick={() => i18n.changeLanguage(lang)}
            aria-pressed={isActive}
            style={{
              width: '36px',
              height: '100%',
              border: 'none',
              backgroundColor: isActive ? 'var(--color-primary-subtle)' : 'transparent',
              color: isActive ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
              fontSize: '0.6875rem',
              fontWeight: isActive ? 700 : 500,
              cursor: isActive ? 'default' : 'pointer',
              letterSpacing: '0.03em',
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            {t(`language.${lang}`)}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Shell ────────────────────────────────────────────────────────────────── */

export function Shell() {
  const { t } = useTranslation()
  const { appUser } = useAuth()
  const navigate = useNavigate()
  const pageTitle = usePageTitle()

  async function handleSignOut() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  const isAdmin = appUser?.role === 'admin'
  const isStaff = appUser?.role === 'staff'
  // Nav visibility: all staff can access Students and Reports pages.
  // Permission flags gate actions/sections *within* those pages, not the nav entry.
  const canViewStudents = isAdmin || isStaff
  const canViewReports = isAdmin || isStaff

  const userInitials = appUser?.displayName ? getInitials(appUser.displayName) : '??'
  const roleLabel = appUser?.role
    ? appUser.role.charAt(0).toUpperCase() + appUser.role.slice(1)
    : ''

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── Light Sidebar (BankDash-style) ── */}
      <aside
        style={{
          width: '15rem',
          flexShrink: 0,
          backgroundColor: 'var(--color-sidebar-bg)',
          borderRight: '1px solid var(--color-sidebar-border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Logo block */}
        <div
          style={{
            height: '64px',
            padding: '0 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            borderBottom: '1px solid var(--color-sidebar-border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: 800,
              color: 'var(--color-primary-foreground)',
              letterSpacing: '-0.01em',
              flexShrink: 0,
            }}
          >
            EM
          </div>
          <div>
            <div
              style={{
                fontSize: '0.9375rem',
                fontWeight: 800,
                color: 'var(--color-foreground)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1,
              }}
            >
              {t('app.name')}
            </div>
            {appUser && (
              <div style={{ fontSize: '0.6875rem', color: 'var(--color-muted-foreground)', marginTop: '1px' }}>
                {roleLabel}
              </div>
            )}
          </div>
        </div>

        {/* Navigation — items go edge-to-edge for left border effect */}
        <nav
          style={{
            flex: 1,
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
          aria-label="Main navigation"
        >
          <NavLink to="/dashboard" className={navClass}>
            <IconDashboard />
            {t('nav.dashboard')}
          </NavLink>

          <NavLink to="/attendance" className={navClass}>
            <IconAttendance />
            {t('nav.attendance')}
          </NavLink>

          {canViewStudents && (
            <NavLink to="/students" className={navClass}>
              <IconStudents />
              {t('nav.students')}
            </NavLink>
          )}

          <NavLink to="/teachers" className={navClass}>
            <IconTeachers />
            {t('nav.teachers')}
          </NavLink>

          <NavLink to="/rooms" className={navClass}>
            <IconRooms />
            {t('nav.rooms')}
          </NavLink>

          {canViewReports && (
            <NavLink to="/reports" className={navClass}>
              <IconReports />
              {t('nav.reports')}
            </NavLink>
          )}

          {isAdmin && (
            <NavLink to="/settings" className={navClass}>
              <IconSettings />
              {t('nav.settings')}
            </NavLink>
          )}
        </nav>

        {/* Footer */}
        <div style={{ borderTop: '1px solid var(--color-sidebar-border)', paddingTop: '0.375rem', paddingBottom: '0.5rem' }}>
          <button
            onClick={handleSignOut}
            className="sidebar-nav-item"
            style={{ border: 'none' }}
          >
            <IconSignOut />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      {/* ── Right side: topbar + scrollable content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Shell Topbar */}
        <header
          style={{
            height: '64px',
            flexShrink: 0,
            borderBottom: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.75rem',
            gap: '1rem',
          }}
        >
          {/* Page title */}
          <h1
            style={{
              fontSize: '1.375rem',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.025em',
              color: 'var(--color-foreground)',
            }}
          >
            {pageTitle}
          </h1>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-muted-foreground)',
                  display: 'flex',
                  pointerEvents: 'none',
                }}
              >
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder={t('search.placeholder')}
                style={{
                  height: '36px',
                  width: '220px',
                  padding: '0 1rem 0 2.25rem',
                  borderRadius: '9999px',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  fontSize: '0.8125rem',
                  color: 'var(--color-foreground)',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              />
            </div>

            {/* Language toggle */}
            <LanguageToggle />

            {/* Bell */}
            <button
              aria-label="Notifications"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9999px',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'var(--color-muted-foreground)',
                transition: 'background-color 0.15s',
                flexShrink: 0,
              }}
            >
              <IconBell />
            </button>

            {/* User avatar */}
            <div
              title={appUser?.displayName}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9999px',
                background: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-primary-foreground)',
                flexShrink: 0,
                cursor: 'default',
                userSelect: 'none',
              }}
            >
              {userInitials}
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            backgroundColor: 'var(--color-background)',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
