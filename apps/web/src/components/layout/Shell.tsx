import { Outlet, NavLink, useNavigate } from 'react-router'
import { signOut } from 'firebase/auth'
import { useTranslation } from 'react-i18next'
import { auth } from '../../lib/firebase'
import { useAuth } from '../../contexts/AuthContext'

export function Shell() {
  const { t } = useTranslation()
  const { appUser } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut(auth)
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <aside
        style={{
          width: '16rem',
          flexShrink: 0,
          borderRight: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-card)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '1rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
            {t('app.name')}
          </h1>
          {appUser && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--color-muted-foreground)',
                margin: '0.25rem 0 0',
              }}
            >
              {appUser.displayName} · {appUser.role}
            </p>
          )}
        </div>

        <nav
          style={{
            flex: 1,
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.125rem',
            overflowY: 'auto',
          }}
        >
          <NavLink to="/attendance" className={navClass}>
            {t('nav.attendance')}
          </NavLink>
          <NavLink to="/dashboard" className={navClass}>
            {t('nav.dashboard')}
          </NavLink>
        </nav>

        <div style={{ padding: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={handleSignOut}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              border: '1px solid var(--color-border)',
              backgroundColor: 'transparent',
              color: 'var(--color-muted-foreground)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {t('nav.signOut')}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  )
}

function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'shell-nav-active' : 'shell-nav'
}
