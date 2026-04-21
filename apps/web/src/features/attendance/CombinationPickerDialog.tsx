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
    if (token === 'usc')            value += pricingConfig.uscRatePerCheckin
    else if (token === 'eversports') value += pricingConfig.eversportsRatePerCheckin
    else if (token === 'cash')       value += cashAmount ?? 0
    else if (token === 'trial')      value += pricingConfig.trialRate
    // gold / silver / bronze / 2silver / 2bronze: pass-based
  }
  if (isSpecial) value += pricingConfig.specialClassSurcharge

  return Math.round(value * 100) / 100
}

/* ─── Disable logic (ported from attendanceCombinationPicker.html) ─── */

function computeDisabled(s: Set<CombinationToken>, isSpecial: boolean): Set<CombinationToken> {
  const disabled = new Set<CombinationToken>()

  if (s.has('gold'))    (['silver','2silver','bronze','2bronze','usc','eversports','cash','trial'] as CombinationToken[]).forEach(x => disabled.add(x))
  if (s.has('trial'))   (['gold','silver','2silver','bronze','2bronze','usc','eversports','cash'] as CombinationToken[]).forEach(x => disabled.add(x))
  if (s.has('2silver')) (['gold','silver','bronze','2bronze','usc','eversports','cash','trial'] as CombinationToken[]).forEach(x => disabled.add(x))
  if (s.has('2bronze')) (['gold','silver','bronze','2silver','usc','eversports','cash','trial'] as CombinationToken[]).forEach(x => disabled.add(x))

  if (s.has('silver') && !s.has('usc') && !s.has('eversports') && !s.has('cash')) {
    ;(['gold','2silver','bronze','2bronze','trial'] as CombinationToken[]).forEach(x => disabled.add(x))
    if (!isSpecial) { disabled.add('usc'); disabled.add('eversports'); disabled.add('cash') }
  }
  if (s.has('silver') && (s.has('usc') || s.has('eversports') || s.has('cash'))) {
    ;(['gold','2silver','bronze','2bronze','trial'] as CombinationToken[]).forEach(x => disabled.add(x))
    if (s.has('usc'))        { disabled.add('eversports'); disabled.add('cash') }
    if (s.has('eversports')) { disabled.add('usc'); disabled.add('cash') }
    if (s.has('cash'))       { disabled.add('usc'); disabled.add('eversports') }
  }

  if (s.has('bronze') && !s.has('usc') && !s.has('eversports') && !s.has('cash')) {
    ;(['gold','2silver','silver','2bronze','trial'] as CombinationToken[]).forEach(x => disabled.add(x))
    if (!isSpecial) { disabled.add('usc'); disabled.add('eversports'); disabled.add('cash') }
  }
  if (s.has('bronze') && (s.has('usc') || s.has('eversports') || s.has('cash'))) {
    ;(['gold','2silver','silver','2bronze','trial'] as CombinationToken[]).forEach(x => disabled.add(x))
    if (s.has('usc'))        { disabled.add('eversports'); disabled.add('cash') }
    if (s.has('eversports')) { disabled.add('usc'); disabled.add('cash') }
    if (s.has('cash'))       { disabled.add('usc'); disabled.add('eversports') }
  }

  if (s.has('usc') && !s.has('silver') && !s.has('bronze')) {
    ;(['gold','2silver','2bronze','trial'] as CombinationToken[]).forEach(x => disabled.add(x))
    if (!isSpecial) { disabled.add('eversports'); disabled.add('cash'); disabled.add('silver'); disabled.add('bronze') }
    if (s.has('eversports')) disabled.add('cash')
    if (s.has('cash'))       disabled.add('eversports')
  }

  if (s.has('eversports') && !s.has('usc') && !s.has('silver') && !s.has('bronze')) {
    ;(['gold','2silver','2bronze','trial'] as CombinationToken[]).forEach(x => disabled.add(x))
    if (!isSpecial) { (['silver','bronze','usc','cash'] as CombinationToken[]).forEach(x => disabled.add(x)) }
    else            { if (s.has('cash')) disabled.add('usc') }
  }

  if (s.has('cash') && !s.has('silver') && !s.has('bronze') && !s.has('usc') && !s.has('eversports')) {
    ;(['gold','2silver','2bronze','trial'] as CombinationToken[]).forEach(x => disabled.add(x))
    if (!isSpecial) { (['silver','bronze','usc','eversports'] as CombinationToken[]).forEach(x => disabled.add(x)) }
  }

  return disabled
}

/* ─── Token Button ─────────────────────────────────────────── */

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

/* ─── Combination Picker Dialog ────────────────────────────── */

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
  const isSpecial = session.type !== 'regular'

  const cashAmount = parseFloat(cashInput) || null
  const selectionSet = new Set(selection)
  const disabled = computeDisabled(selectionSet, isSpecial)
  const estimatedValue = calcEstimatedValue(selection, cashAmount, session.isSpecial, pricingConfig)

  function toggleToken(token: CombinationToken) {
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(token)) {
        next.delete(token)
      } else {
        next.add(token)
      }
      // Auto-remove now-disabled tokens
      const nowDisabled = computeDisabled(next, isSpecial)
      for (const d of nowDisabled) next.delete(d)
      return [...next]
    })
  }

  function isSelected(token: CombinationToken) { return selectionSet.has(token) }
  function isDisabled(token: CombinationToken) { return disabled.has(token) && !selectionSet.has(token) }

  function handleConfirm() {
    if (selection.length === 0) return
    onConfirm({
      combination: selection,
      cashAmount: selection.includes('cash') ? cashAmount : null,
      estimatedValue,
      membershipId: activeMembership?.id ?? null,
      membershipSnapshot: activeMembership
        ? { tier: activeMembership.tier, creditsAtCheckIn: activeMembership.creditsRemaining }
        : null,
    })
  }

  const studentName = `${student.firstName} ${student.lastName}`
  const deductionCount = selection.some(t => t === '2silver' || t === '2bronze') ? 2 : 1
  const creditsAfter = creditsLeft !== null ? Math.max(0, creditsLeft - deductionCount) : null
  const showLowCreditWarning = creditsLeft !== null && creditsLeft > 0 && creditsAfter !== null && creditsAfter <= 2

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
              {session.isSpecial && (
                <span className="ml-2 text-[0.6875rem] font-semibold px-1.5 py-[1px] rounded-full bg-warning-subtle text-[oklch(0.50_0.14_85)]">
                  {t('combination.specialSurcharge', { amount: pricingConfig?.specialClassSurcharge ?? 0 })}
                </span>
              )}
            </p>
          </div>

          {/* Body */}
          <div className="px-5 py-4 flex flex-col gap-3 overflow-y-auto">

            {/* School pass section */}
            {tier && (
              <div>
                <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                  {t('combination.sectionSchoolPass')}
                </p>
                <div className="grid gap-2" style={{ gridTemplateColumns: tier === 'gold' ? '1fr' : isSpecial ? 'repeat(2, 1fr)' : '1fr' }}>
                  {tier === 'gold' && (
                    <TokenButton
                      label={t('combination.gold')}
                      sublabel={t('combination.unlimited')}
                      selected={isSelected('gold')}
                      disabled={isDisabled('gold')}
                      onToggle={() => toggleToken('gold')}
                    />
                  )}
                  {tier === 'silver' && (
                    <>
                      <TokenButton
                        label={t('combination.silver')}
                        sublabel={creditsLeft !== null ? `${t('combination.oneCredit')} · ${t('combination.creditsLeft', { count: creditsLeft })}` : t('combination.oneCredit')}
                        selected={isSelected('silver')}
                        disabled={isDisabled('silver') || creditsLeft === 0}
                        onToggle={() => toggleToken('silver')}
                      />
                      {isSpecial && (
                        <TokenButton
                          label={t('combination.2silver')}
                          sublabel={creditsLeft !== null ? `${t('combination.twoCredits')} · ${t('combination.creditsLeft', { count: creditsLeft })}` : t('combination.twoCredits')}
                          selected={isSelected('2silver')}
                          disabled={isDisabled('2silver') || creditsLeft === null || creditsLeft < 2}
                          onToggle={() => toggleToken('2silver')}
                        />
                      )}
                    </>
                  )}
                  {tier === 'bronze' && (
                    <>
                      <TokenButton
                        label={t('combination.bronze')}
                        sublabel={creditsLeft !== null ? `${t('combination.oneCredit')} · ${t('combination.creditsLeft', { count: creditsLeft })}` : t('combination.oneCredit')}
                        selected={isSelected('bronze')}
                        disabled={isDisabled('bronze') || creditsLeft === 0}
                        onToggle={() => toggleToken('bronze')}
                      />
                      {isSpecial && (
                        <TokenButton
                          label={t('combination.2bronze')}
                          sublabel={creditsLeft !== null ? `${t('combination.twoCredits')} · ${t('combination.creditsLeft', { count: creditsLeft })}` : t('combination.twoCredits')}
                          selected={isSelected('2bronze')}
                          disabled={isDisabled('2bronze') || creditsLeft === null || creditsLeft < 2}
                          onToggle={() => toggleToken('2bronze')}
                        />
                      )}
                    </>
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
              <div className="grid grid-cols-3 gap-2">
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
                <TokenButton
                  label={t('combination.cash')}
                  sublabel={pricingConfig ? `€${pricingConfig.dropInCashRate}` : undefined}
                  selected={isSelected('cash')}
                  disabled={isDisabled('cash')}
                  onToggle={() => toggleToken('cash')}
                />
              </div>
              {selection.includes('cash') && (
                <div className="flex items-center gap-2 mt-2 px-3 py-2.5 bg-muted rounded-[0.5rem] border border-border">
                  <label className="text-[0.8125rem] text-muted-foreground whitespace-nowrap">{t('combination.cashAmount')}</label>
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

            {/* Other section */}
            <div>
              <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-muted-foreground mb-2 m-0">
                {t('combination.sectionOther')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <TokenButton
                  label={t('combination.trial')}
                  sublabel={pricingConfig ? `€${pricingConfig.trialRate}` : undefined}
                  selected={isSelected('trial')}
                  disabled={isDisabled('trial')}
                  onToggle={() => toggleToken('trial')}
                />
              </div>
            </div>

            {/* Estimated value */}
            {selection.length > 0 && (
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
