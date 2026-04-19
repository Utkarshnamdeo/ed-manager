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
    <div className="flex min-h-screen bg-background items-center justify-center p-6">
      {/* Card */}
      <div className="w-full max-w-[22rem] bg-card rounded-[1.25rem] border border-border py-10 px-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="size-9 rounded-[9px] bg-primary flex items-center justify-center text-[0.8125rem] font-extrabold text-primary-foreground shrink-0">
            EM
          </div>
          <span className="text-[1.0625rem] font-extrabold text-foreground tracking-[-0.02em]">
            {t('login.title')}
          </span>
        </div>

        {/* Heading */}
        <div className="mb-7">
          <h1 className="text-2xl font-extrabold m-0 mb-1.5 tracking-[-0.03em] text-foreground">
            {t('login.heading')}
          </h1>
          <p className="text-sm text-muted-foreground m-0">
            {t('login.subtitle')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              className="text-[0.8125rem] text-destructive bg-destructive-subtle px-3.5 py-2.5 rounded-lg font-medium"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`mt-1 h-[42px] rounded-[0.625rem] border-0 text-[0.9375rem] font-bold tracking-[-0.01em] w-full transition-[background-color] duration-150 disabled:opacity-[0.55] ${
              loading
                ? 'bg-primary-hover text-primary-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground cursor-pointer'
            }`}
          >
            {loading ? t('login.signingIn') : t('login.submit')}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ─── Field ── */

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
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[0.8125rem] font-semibold text-foreground-secondary"
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
        className="h-[42px] rounded-[0.625rem] border-[1.5px] border-border bg-background px-3.5 text-[0.9375rem] text-foreground outline-none w-full transition-[border-color,box-shadow,background-color] duration-150 focus:border-primary focus:shadow-[0_0_0_3px_var(--color-primary-subtle)] focus:bg-card placeholder:text-muted-foreground"
      />
    </div>
  )
}
