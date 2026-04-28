import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { useMembershipsByStudent } from '../../hooks/useMemberships'
import { useClassCardsByStudent } from '../../hooks/useClassCards'
import type { Student, ClassSession, PricingConfig, AttendanceCombination, AttendanceRecord, CombinationToken } from '../../types'
import { calcEstimatedValue, computeDisabled } from '../../lib/combinationLogic'

interface PickerResult {
  combination: AttendanceCombination
  estimatedValue: number
  membershipId: string | null
  classCardId: string | null
  passSnapshot: AttendanceRecord['passSnapshot']
}

interface CombinationPickerDialogProps {
  student: Student
  session: ClassSession
  pricingConfig: PricingConfig | null
  onConfirm: (result: PickerResult) => void
  onClose: () => void
}

/* ─── Token Button ── */

function TokenButton({ label, sublabel, selected, disabled, onToggle }: {
  label: string
  sublabel?: string
  selected: boolean
  disabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onToggle()}
      disabled={disabled}
      className={`flex flex-col items-center justify-center px-2 py-2.5 rounded-[0.625rem] border text-center transition-[background-color,border-color,opacity] duration-100 cursor-pointer min-h-[56px] ${
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : disabled
          ? 'bg-muted text-muted-foreground border-border opacity-40 cursor-not-allowed'
          : 'bg-card text-foreground border-border hover:border-border-strong hover:bg-muted/50'
      }`}
    >
      <span className="text-[0.8125rem] font-medium leading-tight">{label}</span>
      {sublabel && (
        <span className={`text-[0.6875rem] mt-0.5 leading-tight ${selected ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {sublabel}
        </span>
      )}
    </button>
  )
}

/* ─── Combination Picker Dialog ── */

export function CombinationPickerDialog({
  student,
  session,
  pricingConfig,
  onConfirm,
  onClose,
}: CombinationPickerDialogProps) {
  const { t } = useTranslation('attendance')
  const [selection, setSelection] = useState<CombinationToken[]>([])

  const { data: memberships } = useMembershipsByStudent(student.id)
  const { data: classCards } = useClassCardsByStudent(student.id)

  const activeMembership = memberships?.find((m) => m.id === student.activePassId && m.active) ?? null
  const activeCard = classCards?.find((c) => c.id === student.activePassId && c.active) ?? null

  const passType = student.passType
  const creditsLeft =
    activeMembership?.creditsRemaining ?? activeCard?.creditsRemaining ?? null

  const isSpecial = session.type === 'special' || session.type === 'event'
  const creditsNeeded = isSpecial ? 2 : 1

  const selectionSet = new Set(selection)
  const disabled = computeDisabled(selectionSet, isSpecial)
  const estimatedValue = calcEstimatedValue(selection, pricingConfig)

  function toggleToken(token: CombinationToken) {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(token)) {
        next.delete(token)
      } else {
        next.add(token)
      }
      const nowDisabled = computeDisabled(next, isSpecial)
      for (const d of nowDisabled) next.delete(d)
      return [...next]
    })
  }

  function isSelected(token: CombinationToken) { return selectionSet.has(token) }
  function isDisabled(token: CombinationToken) { return disabled.has(token) && !selectionSet.has(token) }

  function handleConfirm() {
    if (selection.length === 0) return
    const passSnapshot = activeMembership
      ? { type: activeMembership.tier, creditsAtCheckIn: activeMembership.creditsRemaining }
      : activeCard
      ? { type: activeCard.type, creditsAtCheckIn: activeCard.creditsRemaining }
      : null
    onConfirm({
      combination: selection,
      estimatedValue,
      membershipId: activeMembership?.id ?? null,
      classCardId: activeCard?.id ?? null,
      passSnapshot,
    })
  }

  const creditsAfter = creditsLeft !== null
    ? Math.max(0, creditsLeft - creditsNeeded)
    : null
  const showLowCreditWarning = creditsLeft !== null && creditsLeft > 0 && creditsAfter !== null && creditsAfter <= 2

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 animate-[fadeIn_0.15s_ease]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border rounded-[1rem] shadow-[0_8px_32px_rgba(0,0,0,0.14)] z-50 animate-[fadeIn_0.15s_ease] flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="px-5 py-4 border-b border-border shrink-0">
            <Dialog.Title className="text-[1rem] font-bold m-0 text-foreground">
              {t('combination.title', { name: student.name })}
            </Dialog.Title>
            <p className="text-[0.8125rem] text-muted-foreground mt-0.5 m-0 capitalize">
              {session.name}
              {isSpecial && (
                <span className="ml-2 text-[0.6875rem] font-semibold px-1.5 py-[1px] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)]">
                  {isSpecial ? t('combination.specialClass') : ''}
                </span>
              )}
            </p>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto">

            {/* Studio pass section */}
            {passType && (
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                  {t('combination.sectionSchoolPass')}
                </p>
                <div className="grid gap-2" style={{ gridTemplateColumns: passType === 'gold' ? '1fr' : '1fr' }}>
                  {passType === 'gold' && (
                    <TokenButton
                      label={t('combination.gold')}
                      sublabel={t('combination.unlimited')}
                      selected={isSelected('gold')}
                      disabled={isDisabled('gold')}
                      onToggle={() => toggleToken('gold')}
                    />
                  )}
                  {passType === 'silver' && (
                    <TokenButton
                      label={t('combination.silver')}
                      sublabel={creditsLeft !== null
                        ? `${creditsNeeded} ${t('combination.credits')} · ${t('combination.creditsLeft', { count: creditsLeft })}`
                        : `${creditsNeeded} ${t('combination.credits')}`}
                      selected={isSelected('silver')}
                      disabled={isDisabled('silver') || (creditsLeft !== null && creditsLeft < 1)}
                      onToggle={() => toggleToken('silver')}
                    />
                  )}
                  {passType === 'bronze' && (
                    <TokenButton
                      label={t('combination.bronze')}
                      sublabel={creditsLeft !== null
                        ? `${creditsNeeded} ${t('combination.credits')} · ${t('combination.creditsLeft', { count: creditsLeft })}`
                        : `${creditsNeeded} ${t('combination.credits')}`}
                      selected={isSelected('bronze')}
                      disabled={isDisabled('bronze') || (creditsLeft !== null && creditsLeft < 1)}
                      onToggle={() => toggleToken('bronze')}
                    />
                  )}
                  {(passType === 'ten_class' || passType === 'five_class') && (
                    <TokenButton
                      label={passType === 'ten_class' ? t('combination.tenClassCard') : t('combination.fiveClassCard')}
                      sublabel={creditsLeft !== null
                        ? `${creditsNeeded} ${t('combination.credits')} · ${t('combination.creditsLeft', { count: creditsLeft })}`
                        : `${creditsNeeded} ${t('combination.credits')}`}
                      selected={isSelected('card')}
                      disabled={isDisabled('card') || (creditsLeft !== null && creditsLeft < 1)}
                      onToggle={() => toggleToken('card')}
                    />
                  )}
                </div>
                {showLowCreditWarning && (
                  <p className="text-[0.75rem] text-warning mt-1.5 m-0">
                    {t('warnings.lowCredit', { count: creditsAfter })}
                  </p>
                )}
              </div>
            )}

            {/* External provider section */}
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                {t('combination.sectionExternal')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <TokenButton
                  label={t('combination.usc')}
                  sublabel={pricingConfig ? `€${pricingConfig.uscRatePerCheckin}` : undefined}
                  selected={isSelected('usc')}
                  disabled={isDisabled('usc')}
                  onToggle={() => toggleToken('usc')}
                />
                <TokenButton
                  label={t('combination.eversports')}
                  sublabel={pricingConfig ? `€${pricingConfig.eversportsRatePerCheckin}` : undefined}
                  selected={isSelected('eversports')}
                  disabled={isDisabled('eversports')}
                  onToggle={() => toggleToken('eversports')}
                />
              </div>
            </div>

            {/* Walk-in section */}
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                {t('combination.sectionOther')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <TokenButton
                  label={t('combination.dropin')}
                  sublabel={pricingConfig ? `€${pricingConfig.dropInRate}` : undefined}
                  selected={isSelected('dropin')}
                  disabled={isDisabled('dropin')}
                  onToggle={() => toggleToken('dropin')}
                />
                <TokenButton
                  label={t('combination.trial')}
                  sublabel={t('combination.free')}
                  selected={isSelected('trial')}
                  disabled={isDisabled('trial')}
                  onToggle={() => toggleToken('trial')}
                />
              </div>
            </div>

            {/* Cash supplement (for specials/shortfall) */}
            {isSpecial && (
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                  {t('combination.sectionSupplement')}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  <TokenButton
                    label={t('combination.cashSupplement')}
                    sublabel={t('combination.cashSupplementHint')}
                    selected={isSelected('cash')}
                    disabled={isDisabled('cash')}
                    onToggle={() => toggleToken('cash')}
                  />
                </div>
              </div>
            )}

            {/* Estimated value */}
            {selection.length > 0 && estimatedValue > 0 && (
              <div className="bg-muted rounded-[0.5rem] px-3 py-2.5 flex items-center justify-between">
                <span className="text-[0.8125rem] text-muted-foreground">{t('combination.estimatedValue')}</span>
                <span className="text-[0.9375rem] font-bold text-foreground">€{estimatedValue.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex gap-2 justify-end shrink-0">
            <Dialog.Close asChild>
              <button type="button" className="btn-secondary">{t('combination.cancel')}</button>
            </Dialog.Close>
            <button
              type="button"
              disabled={selection.length === 0}
              onClick={handleConfirm}
              className="btn-primary"
            >
              {t('combination.confirm')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
