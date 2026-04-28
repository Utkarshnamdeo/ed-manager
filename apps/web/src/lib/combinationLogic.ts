import type { CombinationToken, PricingConfig } from '../types'

export function calcEstimatedValue(
  combination: CombinationToken[],
  pricingConfig: PricingConfig | null,
): number {
  if (!pricingConfig) return 0
  let value = 0
  for (const token of combination) {
    if (token === 'usc')         value += pricingConfig.uscRatePerCheckin
    if (token === 'eversports')  value += pricingConfig.eversportsRatePerCheckin
    if (token === 'dropin')      value += pricingConfig.dropInRate
  }
  return Math.round(value * 100) / 100
}

/** Compute which tokens should be disabled given current selection */
export function computeDisabled(s: Set<CombinationToken>, isSpecial: boolean): Set<CombinationToken> {
  const disabled = new Set<CombinationToken>()
  const all: CombinationToken[] = ['gold', 'silver', 'bronze', 'card', 'usc', 'eversports', 'dropin', 'trial', 'cash']

  if (s.has('gold')) {
    all.filter(t => t !== 'gold').forEach(t => disabled.add(t))
  }
  if (s.has('trial')) {
    all.filter(t => t !== 'trial').forEach(t => disabled.add(t))
  }
  if (s.has('dropin')) {
    all.filter(t => t !== 'dropin').forEach(t => disabled.add(t))
  }

  // Studio pass tokens: lock each other out, allow cash/usc/eversports supplement for specials
  const hasPass = s.has('silver') || s.has('bronze') || s.has('card')
  if (hasPass) {
    ;(['gold', 'trial', 'dropin'] as CombinationToken[]).forEach(t => disabled.add(t))
    // Prevent mixing pass types
    if (s.has('silver')) { disabled.add('bronze'); disabled.add('card') }
    if (s.has('bronze')) { disabled.add('silver'); disabled.add('card') }
    if (s.has('card'))   { disabled.add('silver'); disabled.add('bronze') }
    // Supplements only allowed for special/event classes
    if (!isSpecial) {
      ;(['usc', 'eversports', 'cash'] as CombinationToken[]).forEach(t => disabled.add(t))
    }
    // Only one supplement allowed
    if (s.has('usc'))        { disabled.add('eversports'); disabled.add('cash') }
    if (s.has('eversports')) { disabled.add('usc'); disabled.add('cash') }
    if (s.has('cash'))       { disabled.add('usc'); disabled.add('eversports') }
  }

  // External provider tokens
  const hasExternal = s.has('usc') || s.has('eversports')
  if (hasExternal && !hasPass) {
    ;(['gold', 'trial', 'dropin'] as CombinationToken[]).forEach(t => disabled.add(t))
    if (!isSpecial) {
      ;(['silver', 'bronze', 'card', 'cash'] as CombinationToken[]).forEach(t => disabled.add(t))
    }
    if (s.has('usc'))        disabled.add('eversports')
    if (s.has('eversports')) disabled.add('usc')
  }

  if (s.has('cash') && !hasPass && !hasExternal) {
    ;(['gold', 'trial', 'dropin'] as CombinationToken[]).forEach(t => disabled.add(t))
    if (!isSpecial) {
      ;(['silver', 'bronze', 'card', 'usc', 'eversports'] as CombinationToken[]).forEach(t => disabled.add(t))
    }
  }

  return disabled
}
