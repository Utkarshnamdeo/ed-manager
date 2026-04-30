import { useTranslation } from 'react-i18next'
import { SectionHeader } from '../primitives/SectionHeader'

export function MembershipTypesSection() {
  const { t } = useTranslation('settings')

  return (
    <div className="p-6 page-enter">
      <SectionHeader title={t('sections.membership-types')} />
      <p className="text-sm text-muted-foreground">{t('comingSoon')}</p>
    </div>
  )
}
