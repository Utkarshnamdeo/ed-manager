import { useTranslation } from 'react-i18next'

interface SaveBarProps {
  onSave: () => void
  onDiscard: () => void
  isPending?: boolean
  disabled?: boolean
}

export function SaveBar({ onSave, onDiscard, isPending = false, disabled = false }: SaveBarProps) {
  const { t } = useTranslation('settings')

  return (
    <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-6">
      <button
        onClick={onDiscard}
        disabled={isPending}
        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {t('actions.discard')}
      </button>
      <button
        onClick={onSave}
        disabled={disabled || isPending}
        className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? t('states.saving') : t('actions.save')}
      </button>
    </div>
  )
}
