import { useTranslation } from 'react-i18next'

export function AttendancePage() {
  const { t } = useTranslation()

  return (
    <div style={{ padding: '1.5rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
        {t('nav.attendance')}
      </h1>
      <p style={{ color: 'var(--color-muted-foreground)', margin: 0 }}>
        {t('attendance.placeholder')}
      </p>
    </div>
  )
}
