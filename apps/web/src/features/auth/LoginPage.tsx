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
        minHeight: '100vh',
        backgroundColor: 'var(--color-background)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '22rem',
          backgroundColor: 'var(--color-card)',
          borderRadius: '1.25rem',
          border: '1px solid var(--color-border)',
          padding: '2.5rem 2rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8125rem',
              fontWeight: 800,
              color: 'var(--color-primary-foreground)',
              flexShrink: 0,
            }}
          >
            EM
          </div>
          <span
            style={{
              fontSize: '1.0625rem',
              fontWeight: 800,
              color: 'var(--color-foreground)',
              letterSpacing: '-0.02em',
            }}
          >
            {t('login.title')}
          </span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              margin: '0 0 0.375rem',
              letterSpacing: '-0.03em',
              color: 'var(--color-foreground)',
            }}
          >
            {t('login.heading')}
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)', margin: 0 }}>
            {t('login.subtitle')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Field
            id="email"
            label={t('login.email')}
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            placeholder={t('login.emailPlaceholder')}
          />
          <Field
            id="password"
            label={t('login.password')}
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')}
          />

          {error && (
            <div
              role="alert"
              style={{
                fontSize: '0.8125rem',
                color: 'var(--color-destructive)',
                backgroundColor: 'var(--color-destructive-subtle)',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.25rem',
              height: '42px',
              borderRadius: '0.625rem',
              border: 'none',
              backgroundColor: loading ? 'var(--color-primary-hover)' : 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
              fontSize: '0.9375rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s',
              width: '100%',
              letterSpacing: '-0.01em',
            }}
          >
            {loading ? t('login.signingIn') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── Field ────────────────────────────────────────────────────────────────── */

function Field({
  id,
  label,
  type,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  placeholder?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label
        htmlFor={id}
        style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-foreground-secondary)' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        autoComplete={autoComplete}
        placeholder={placeholder}
        style={{
          height: '42px',
          borderRadius: '0.625rem',
          border: '1.5px solid var(--color-border)',
          backgroundColor: 'var(--color-background)',
          padding: '0 0.875rem',
          fontSize: '0.9375rem',
          color: 'var(--color-foreground)',
          outline: 'none',
          width: '100%',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--color-primary)'
          e.target.style.boxShadow = '0 0 0 3px var(--color-primary-subtle)'
          e.target.style.backgroundColor = 'var(--color-card)'
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'var(--color-border)'
          e.target.style.boxShadow = 'none'
          e.target.style.backgroundColor = 'var(--color-background)'
        }}
      />
    </div>
  )
}
