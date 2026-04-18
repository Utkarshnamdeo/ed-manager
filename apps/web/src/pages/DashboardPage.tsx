import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

export function DashboardPage() {
  const { t } = useTranslation()
  const { appUser } = useAuth()

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
          {t('dashboard.title')}
        </h1>
        <p style={{ color: 'var(--color-muted-foreground)', marginTop: '0.25rem' }}>
          {t('dashboard.welcome', { name: appUser?.displayName ?? '' })}
        </p>
      </div>

      <div
        style={{
          borderRadius: '0.5rem',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-card)',
          padding: '1rem',
        }}
      >
        <h2
          style={{
            fontSize: '0.75rem',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-muted-foreground)',
            margin: '0 0 0.75rem',
          }}
        >
          {t('dashboard.emulatorStatus')}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontFamily: 'monospace', fontSize: '0.875rem' }}>
          <EmulatorRow label="Auth" port={9099} />
          <EmulatorRow label="Firestore" port={8080} />
          <EmulatorRow label="Functions" port={5001} />
          <EmulatorRow label="UI" port={4000} />
        </div>
      </div>
    </div>
  )
}

function EmulatorRow({ label, port }: { label: string; port: number }) {
  return (
    <p style={{ margin: 0 }}>
      {label}:{' '}
      <span style={{ color: '#16a34a' }}>localhost:{port}</span>
    </p>
  )
}
