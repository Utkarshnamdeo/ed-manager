import { useTranslation } from 'react-i18next'

interface ErrorBannerProps {
  message: string
  onDismiss?: () => void
}

function ErrorIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-destructive shrink-0 mt-0.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function DismissIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const { t } = useTranslation('settings')

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive-subtle px-4 py-3 mb-6"
    >
      <ErrorIcon />
      <p className="text-sm text-destructive flex-1">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label={t('accessibility.dismiss')}
          className="text-destructive/70 hover:text-destructive transition-colors shrink-0"
        >
          <DismissIcon />
        </button>
      )}
    </div>
  )
}
