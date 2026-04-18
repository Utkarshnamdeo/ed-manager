import { useState } from 'react'
import { useNavigate } from 'react-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { useTranslation } from 'react-i18next'
import { auth } from '../../lib/firebase'

export function LoginPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/attendance', { replace: true })
    } catch {
      setError(t('login.error.invalid'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-background)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '24rem',
          borderRadius: '0.5rem',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-card)',
          padding: '2rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>
            {t('login.title')}
          </h1>
          <p
            style={{
              fontSize: '0.875rem',
              color: 'var(--color-muted-foreground)',
              marginTop: '0.25rem',
              marginBottom: 0,
            }}
          >
            {t('login.subtitle')}
          </p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {t('login.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              style={{
                borderRadius: '0.375rem',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label htmlFor="password" style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {t('login.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                borderRadius: '0.375rem',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-background)',
                padding: '0.5rem 0.75rem',
                fontSize: '0.875rem',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>
          {error && (
            <p style={{ fontSize: '0.875rem', color: 'var(--color-destructive)', margin: 0 }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              borderRadius: '0.375rem',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
              padding: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              width: '100%',
            }}
          >
            {loading ? t('login.signingIn') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}
