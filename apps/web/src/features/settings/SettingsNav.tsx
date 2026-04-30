import { NavLink } from 'react-router'
import { useTranslation } from 'react-i18next'

const SETTINGS_SECTIONS = [
  'pricing',
  'dance-styles',
  'class-levels',
  'membership-types',
  'class-card-types',
  'external-providers',
  'templates',
  'rooms',
  'users',
] as const

type SettingsSection = (typeof SETTINGS_SECTIONS)[number]

function navLinkClass({ isActive }: { isActive: boolean }) {
  const base =
    'flex items-center px-5 py-2.5 text-sm w-full transition-colors duration-150 border-l-2'
  return isActive
    ? `${base} border-primary bg-primary-subtle text-primary font-semibold`
    : `${base} border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40`
}

export function SettingsNav() {
  const { t } = useTranslation('settings')

  return (
    <nav aria-label={t('accessibility.settingsNav')}>
      <ul className="list-none m-0 p-0">
        {SETTINGS_SECTIONS.map((section: SettingsSection) => (
          <li key={section}>
            <NavLink to={`/settings/${section}`} className={navLinkClass}>
              {t(`sections.${section}` as Parameters<typeof t>[0])}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
