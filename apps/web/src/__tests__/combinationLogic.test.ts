import { describe, it, expect } from 'vitest';
import { calcEstimatedValue, computeDisabled } from '../lib/combinationLogic';
import { ExternalProvider, MembershipTier, type CombinationToken, type PricingConfig } from '../types';

const mockPricing: PricingConfig = {
  dropInRate: 13,
  silverMonthlyPrice: 50,
  bronzeMonthlyPrice: 35,
  goldMonthlyPrice: 70,
  tenClassCardPrice: 90,
  fiveClassCardPrice: 50,
  uscRatePerCheckin: 8,
  eversportsRatePerCheckin: 10,
  updatedAt: new Date(),
  updatedBy: 'test',
};

describe('calcEstimatedValue', () => {
  it('returns 0 for pass-only combinations', () => {
    expect(calcEstimatedValue([MembershipTier.Silver], mockPricing)).toBe(0);
    expect(calcEstimatedValue([MembershipTier.Gold], mockPricing)).toBe(0);
    expect(calcEstimatedValue(['card'], mockPricing)).toBe(0);
  });
  it('returns dropInRate for dropin', () => {
    expect(calcEstimatedValue(['dropin'], mockPricing)).toBe(13);
  });
  it('returns usc rate for usc', () => {
    expect(calcEstimatedValue([ExternalProvider.USC], mockPricing)).toBe(8);
  });
  it('returns eversports rate for eversports', () => {
    expect(calcEstimatedValue([ExternalProvider.Eversports], mockPricing)).toBe(10);
  });
  it('returns 0 for trial', () => {
    expect(calcEstimatedValue(['trial'], mockPricing)).toBe(0);
  });
  it('returns 0 for cash supplement alone', () => {
    expect(calcEstimatedValue(['cash'], mockPricing)).toBe(0);
  });
  it('returns 0 for empty combination (party)', () => {
    expect(calcEstimatedValue([], mockPricing)).toBe(0);
  });
  it('sums usc + cash', () => {
    expect(calcEstimatedValue([ExternalProvider.USC, 'cash'], mockPricing)).toBe(8);
  });
  it('returns 0 when pricingConfig is null', () => {
    expect(calcEstimatedValue(['dropin'], null)).toBe(0);
  });
});

describe('computeDisabled', () => {
  it('gold disables all other tokens', () => {
    const disabled = computeDisabled(new Set<CombinationToken>([MembershipTier.Gold]), false);
    expect(disabled.has(MembershipTier.Silver)).toBe(true);
    expect(disabled.has(MembershipTier.Bronze)).toBe(true);
    expect(disabled.has('card')).toBe(true);
    expect(disabled.has(ExternalProvider.USC)).toBe(true);
    expect(disabled.has('dropin')).toBe(true);
    expect(disabled.has('trial')).toBe(true);
    expect(disabled.has('cash')).toBe(true);
    expect(disabled.has(MembershipTier.Gold)).toBe(false);
  });
  it('trial disables all other tokens', () => {
    const disabled = computeDisabled(new Set<CombinationToken>(['trial']), false);
    expect(disabled.has(MembershipTier.Gold)).toBe(true);
    expect(disabled.has(MembershipTier.Silver)).toBe(true);
    expect(disabled.has('cash')).toBe(true);
    expect(disabled.has('trial')).toBe(false);
  });
  it('dropin disables all other tokens', () => {
    const disabled = computeDisabled(new Set<CombinationToken>(['dropin']), false);
    expect(disabled.has(MembershipTier.Gold)).toBe(true);
    expect(disabled.has(MembershipTier.Silver)).toBe(true);
    expect(disabled.has('cash')).toBe(true);
    expect(disabled.has('dropin')).toBe(false);
  });
  it('silver disables bronze and card, allows supplements only for special', () => {
    const disabledRegular = computeDisabled(new Set<CombinationToken>([MembershipTier.Silver]), false);
    expect(disabledRegular.has(MembershipTier.Bronze)).toBe(true);
    expect(disabledRegular.has('card')).toBe(true);
    expect(disabledRegular.has(ExternalProvider.USC)).toBe(true);   // no supplement for regular
    expect(disabledRegular.has('cash')).toBe(true);
    const disabledSpecial = computeDisabled(new Set<CombinationToken>([MembershipTier.Silver]), true);
    expect(disabledSpecial.has(ExternalProvider.USC)).toBe(false);  // supplement allowed for special
    expect(disabledSpecial.has('cash')).toBe(false);
    expect(disabledSpecial.has(MembershipTier.Bronze)).toBe(true); // still disabled
  });
  it('only one supplement allowed: usc disables eversports and cash', () => {
    const disabled = computeDisabled(new Set<CombinationToken>([MembershipTier.Silver, ExternalProvider.USC]), true);
    expect(disabled.has(ExternalProvider.Eversports)).toBe(true);
    expect(disabled.has('cash')).toBe(true);
  });
  it('empty set disables nothing', () => {
    const disabled = computeDisabled(new Set<CombinationToken>(), false);
    expect(disabled.size).toBe(0);
  });
});
