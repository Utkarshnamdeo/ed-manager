import { useTranslation } from 'react-i18next'
import { SectionHeader } from '../primitives/SectionHeader'

export function UsersSection() {
  const { t } = useTranslation('settings')

  return (
    <div className="p-6 page-enter">
      <SectionHeader title={t('sections.users')} />
      <p className="text-sm text-muted-foreground">{t('comingSoon')}</p>
    </div>
  )
}
