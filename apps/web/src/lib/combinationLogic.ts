import { ExternalProvider, MembershipTier, type CombinationToken, type PricingConfig } from '../types';

export function calcEstimatedValue(
  combination: CombinationToken[],
  pricingConfig: PricingConfig | null,
): number {
  if (!pricingConfig) return 0;
  let value = 0;
  for (const token of combination) {
    if (token === ExternalProvider.USC) value += pricingConfig.uscRatePerCheckin;
    if (token === ExternalProvider.Eversports) value += pricingConfig.eversportsRatePerCheckin;
    if (token === 'dropin') value += pricingConfig.dropInRate;
  }
  return Math.round(value * 100) / 100;
}

/** Compute which tokens should be disabled given current selection */
export function computeDisabled(s: Set<CombinationToken>, isSpecial: boolean): Set<CombinationToken> {
  const disabled = new Set<CombinationToken>();
  const all: CombinationToken[] = [MembershipTier.Gold, MembershipTier.Silver, MembershipTier.Bronze, 'card', ExternalProvider.USC, ExternalProvider.Eversports, 'dropin', 'trial', 'cash'];

  if (s.has(MembershipTier.Gold)) {
    all.filter(t => t !== MembershipTier.Gold).forEach(t => disabled.add(t));
  }
  if (s.has('trial')) {
    all.filter(t => t !== 'trial').forEach(t => disabled.add(t));
  }
  if (s.has('dropin')) {
    all.filter(t => t !== 'dropin').forEach(t => disabled.add(t));
  }

  // Studio pass tokens: lock each other out, allow cash/usc/eversports supplement for specials
  const hasPass = s.has(MembershipTier.Silver) || s.has(MembershipTier.Bronze) || s.has('card');
  if (hasPass) {
    ; ([MembershipTier.Gold, 'trial', 'dropin'] as CombinationToken[]).forEach(t => disabled.add(t));
    // Prevent mixing pass types
    if (s.has(MembershipTier.Silver)) { disabled.add(MembershipTier.Bronze); disabled.add('card'); }
    if (s.has(MembershipTier.Bronze)) { disabled.add(MembershipTier.Silver); disabled.add('card'); }
    if (s.has('card')) { disabled.add(MembershipTier.Silver); disabled.add(MembershipTier.Bronze); }
    // Supplements only allowed for special/event classes
    if (!isSpecial) {
      ; ([ExternalProvider.USC, ExternalProvider.Eversports, 'cash'] as CombinationToken[]).forEach(t => disabled.add(t));
    }
    // Only one supplement allowed
    if (s.has(ExternalProvider.USC)) { disabled.add(ExternalProvider.Eversports); disabled.add('cash'); }
    if (s.has(ExternalProvider.Eversports)) { disabled.add(ExternalProvider.USC); disabled.add('cash'); }
    if (s.has('cash')) { disabled.add(ExternalProvider.USC); disabled.add(ExternalProvider.Eversports); }
  }

  // External provider tokens
  const hasExternal = s.has(ExternalProvider.USC) || s.has(ExternalProvider.Eversports);
  if (hasExternal && !hasPass) {
    ; ([MembershipTier.Gold, 'trial', 'dropin'] as CombinationToken[]).forEach(t => disabled.add(t));
    if (!isSpecial) {
      ; ([MembershipTier.Silver, MembershipTier.Bronze, 'card', 'cash'] as CombinationToken[]).forEach(t => disabled.add(t));
    }
    if (s.has(ExternalProvider.USC)) disabled.add(ExternalProvider.Eversports);
    if (s.has(ExternalProvider.Eversports)) disabled.add(ExternalProvider.USC);
  }

  if (s.has('cash') && !hasPass && !hasExternal) {
    ; ([MembershipTier.Gold, 'trial', 'dropin'] as CombinationToken[]).forEach(t => disabled.add(t));
    if (!isSpecial) {
      ; ([MembershipTier.Silver, MembershipTier.Bronze, 'card', ExternalProvider.USC, ExternalProvider.Eversports] as CombinationToken[]).forEach(t => disabled.add(t));
    }
  }

  return disabled;
}
