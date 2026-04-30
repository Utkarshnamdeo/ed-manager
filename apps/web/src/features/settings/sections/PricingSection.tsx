import { useTranslation } from 'react-i18next'
import { SectionHeader } from '../primitives/SectionHeader'

export function PricingSection() {
  const { t } = useTranslation('settings')

  return (
    <div className="p-6 page-enter">
      <SectionHeader title={t('sections.pricing')} />
      <p className="text-sm text-muted-foreground">{t('comingSoon')}</p>
    </div>
  )
}
