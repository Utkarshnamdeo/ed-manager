import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { useTranslation } from 'react-i18next'
import { useMembershipsByStudent } from '../../hooks/useMemberships'
import type { Student, ClassSession, PricingConfig, AttendanceCombination, AttendanceRecord, CombinationToken, AttendanceStatus } from '../../types'

interface PickerResult {
  combination: AttendanceCombination
  cashAmount: number | null
  estimatedValue: number
  membershipId: string | null
  membershipSnapshot: AttendanceRecord['membershipSnapshot']
}

interface CombinationPickerDialogProps {
  student: Student
  session: ClassSession
  status: AttendanceStatus
  pricingConfig: PricingConfig | null
  markedBy: string
  onConfirm: (result: PickerResult) => void
  onClose: () => void
}

function calcEstimatedValue(
  combination: CombinationToken[],
  cashAmount: number | null,
  isSpecial: boolean,
  pricingConfig: PricingConfig | null,
): number {
  if (!pricingConfig) return 0

  let value = 0
  for (const token of combination) {
    if (token === 'usc')        value += pricingConfig.uscRatePerCheckin
    else if (token === 'eversports') value += pricingConfig.eversportsRatePerCheckin
    else if (token === 'cash')  value += cashAmount ?? 0
    else if (token === 'trial') value += pricingConfig.trialRate
    // gold / silver / bronze / 2silver / 2bronze: pass-based, value is 0 for now
  }
  if (isSpecial) value += pricingConfig.specialClassSurcharge

  return Math.round(value * 100) / 100
}

// Tokens that cannot be combined with anything else
const EXCLUSIVE_TOKENS = new Set<CombinationToken>(['gold', 'trial', 'usc', 'eversports', '2silver', '2bronze'])

export function CombinationPickerDialog({
  student,
  session,
  status,
  pricingConfig,
  onConfirm,
  onClose,
}: CombinationPickerDialogProps) {
  const { t } = useTranslation('attendance')
  const [selection, setSelection] = useState<CombinationToken[]>([])
  const [cashInput, setCashInput] = useState(
    pricingConfig ? String(pricingConfig.dropInCashRate) : ''
  )

  const { data: memberships } = useMembershipsByStudent(student.id)
  const activeMembership = memberships?.find((m) => m.id === student.activeMembershipId && m.active) ?? null

  const tier = student.membershipTier
  const creditsLeft = activeMembership?.creditsRemaining ?? null
  const isSpecial = session.isSpecial

  const cashAmount = parseFloat(cashInput) || null
  const estimatedValue = calcEstimatedValue(selection, cashAmount, isSpecial, pricingConfig)

  // Build final combination for submission (handle double-click logic on single tokens)
  const finalCombination: AttendanceCombination = selection

  function toggleToken(token: CombinationToken) {
    setSelection((prev) => {
      // Deselect if already selected
      if (prev.includes(token)) return prev.filter((t) => t !== token)

      // Exclusive tokens replace everything
      if (EXCLUSIVE_TOKENS.has(token)) return [token]

      // Cash: can be second item, not duplicate
      if (token === 'cash') {
        const withoutCash = prev.filter((t) => t !== 'cash')
        if (withoutCash.length >= 2) return prev // no room
        return [...withoutCash, 'cash']
      }

      // silver / bronze: can combine with each other + cash
      if (token === 'silver' || token === 'bronze') {
        // Clear exclusive tokens from existing selection
        const filtered = prev.filter((t) => !EXCLUSIVE_TOKENS.has(t))
        const nonCash = filtered.filter((t) => t !== 'cash')
        const hasCash = filtered.includes('cash')

        if (nonCash.length === 0) {
          return hasCash ? [token, 'cash'] : [token]
        }
        if (nonCash.length === 1 && !nonCash.includes(token)) {
          // silver + bronze or bronze + silver (valid combo)
          return hasCash ? [...nonCash, token] : [...nonCash, token]
        }
        // Already have 2 non-cash tokens, can't add more
        return prev
      }

      return [token]
    })
  }

  function isSelected(token: CombinationToken) {
    return selection.includes(token)
  }

  function isDisabled(token: CombinationToken): boolean {
    if (selection.length === 0) return false
    // Can always add cash as a second item (if room)
    if (token === 'cash') return selection.includes('cash') || selection.filter(t => !EXCLUSIVE_TOKENS.has(t) && t !== 'cash').length >= 2
    // Exclusive tokens: disabled if any non-exclusive already selected (unless just itself)
    if (EXCLUSIVE_TOKENS.has(token)) return selection.length > 0 && !selection.includes(token)
    // silver/bronze: disabled if 2 non-cash tokens already selected
    if (token === 'silver' || token === 'bronze') {
      const nonCash = selection.filter(t => t !== 'cash')
      return nonCash.length >= 2
    }
    return false
  }

  function handleConfirm() {
    if (finalCombination.length === 0) return

    onConfirm({
      combination: finalCombination,
      cashAmount: selection.includes('cash') ? cashAmount : null,
      estimatedValue,
      membershipId: activeMembership?.id ?? null,
      membershipSnapshot: activeMembership
        ? { tier: activeMembership.tier, creditsAtCheckIn: activeMembership.creditsRemaining }
        : null,
    })
  }

  function TokenButton({ token, label, sublabel, disabled: extraDisabled }: {
    token: CombinationToken
    label: string
    sublabel?: string
    disabled?: boolean
  }) {
    const sel = isSelected(token)
    const dis = isDisabled(token) || !!extraDisabled

    return (
      <button
        type="button"
        onClick={() => !dis && toggleToken(token)}
        disabled={dis}
        className={`flex flex-col items-start px-3 py-2.5 rounded-[0.625rem] border text-left transition-[background-color,border-color,opacity] duration-100 cursor-pointer min-w-[5rem] ${
          sel
            ? 'bg-primary text-primary-foreground border-primary'
            : dis
            ? 'bg-muted text-muted-foreground border-border opacity-40 cursor-not-allowed'
            : 'bg-card text-foreground border-border hover:border-border-strong hover:bg-muted/50'
        }`}
      >
        <span className="text-[0.8125rem] font-semibold leading-tight">{label}</span>
        {sublabel && (
          <span className={`text-[0.6875rem] mt-0.5 ${sel ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {sublabel}
          </span>
        )}
      </button>
    )
  }

  const studentName = `${student.firstName} ${student.lastName}`
  const lowCredits = creditsLeft !== null && creditsLeft <= 3

  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-40 animate-[fadeIn_0.15s_ease]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border rounded-[1rem] shadow-[0_8px_32px_rgba(0,0,0,0.14)] z-50 animate-[fadeIn_0.15s_ease] flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="px-5 py-4 border-b border-border shrink-0">
            <Dialog.Title className="text-[1rem] font-bold m-0 text-foreground">
              {t('combination.title', { name: studentName })}
            </Dialog.Title>
            <p className="text-[0.8125rem] text-muted-foreground mt-0.5 m-0 capitalize">
              {status}
              {isSpecial && (
                <span className="ml-2 text-[0.6875rem] font-semibold px-1.5 py-[1px] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)]">
                  Special +€{pricingConfig?.specialClassSurcharge ?? 0}
                </span>
              )}
            </p>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">

            {/* Membership section */}
            {tier && (
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                  Membership
                </p>
                <div className="flex flex-wrap gap-2">
                  {tier === 'gold' && (
                    <TokenButton token="gold" label={t('combination.gold')} sublabel="Unlimited" />
                  )}
                  {tier === 'silver' && (
                    <>
                      <TokenButton
                        token="silver"
                        label={t('combination.silver')}
                        sublabel={creditsLeft !== null ? `${creditsLeft} left` : undefined}
                        disabled={creditsLeft === 0}
                      />
                      <TokenButton
                        token="2silver"
                        label={t('combination.2silver')}
                        sublabel={creditsLeft !== null ? `${creditsLeft} left` : undefined}
                        disabled={creditsLeft === null || creditsLeft < 2}
                      />
                    </>
                  )}
                  {tier === 'bronze' && (
                    <>
                      <TokenButton
                        token="bronze"
                        label={t('combination.bronze')}
                        sublabel={creditsLeft !== null ? `${creditsLeft} left` : undefined}
                        disabled={creditsLeft === 0}
                      />
                      <TokenButton
                        token="2bronze"
                        label={t('combination.2bronze')}
                        sublabel={creditsLeft !== null ? `${creditsLeft} left` : undefined}
                        disabled={creditsLeft === null || creditsLeft < 2}
                      />
                    </>
                  )}
                </div>
                {lowCredits && creditsLeft !== null && creditsLeft > 0 && (
                  <p className="text-[0.75rem] text-warning mt-1.5 m-0">
                    {t('warnings.lowCredit', { count: creditsLeft - 1 })}
                  </p>
                )}
              </div>
            )}

            {/* External */}
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                External
              </p>
              <div className="flex flex-wrap gap-2">
                <TokenButton token="usc" label={t('combination.usc')} sublabel={pricingConfig ? `€${pricingConfig.uscRatePerCheckin}` : undefined} />
                <TokenButton token="eversports" label={t('combination.eversports')} sublabel={pricingConfig ? `€${pricingConfig.eversportsRatePerCheckin}` : undefined} />
              </div>
            </div>

            {/* Cash */}
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                Cash
              </p>
              <div className="flex items-center gap-2">
                <TokenButton token="cash" label={t('combination.cash')} sublabel={pricingConfig ? `€${pricingConfig.dropInCashRate} default` : undefined} />
                {selection.includes('cash') && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[0.8125rem] text-muted-foreground">€</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cashInput}
                      onChange={(e) => setCashInput(e.target.value)}
                      className="form-input w-20 text-[0.8125rem]"
                      placeholder="0.00"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Trial */}
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                Trial
              </p>
              <TokenButton token="trial" label={t('combination.trial')} sublabel={pricingConfig ? `€${pricingConfig.trialRate}` : undefined} />
            </div>

            {/* Estimated value */}
            {selection.length > 0 && (
              <div className="bg-muted rounded-[0.5rem] px-3 py-2.5 flex items-center justify-between">
                <span className="text-[0.8125rem] text-muted-foreground">Estimated value</span>
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
              disabled={finalCombination.length === 0}
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
