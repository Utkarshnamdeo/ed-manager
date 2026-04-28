import { describe, it, expect } from 'vitest'
import { calcEstimatedValue, computeDisabled } from '../lib/combinationLogic'
import type { CombinationToken, PricingConfig } from '../types'

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
}

describe('calcEstimatedValue', () => {
  it('returns 0 for pass-only combinations', () => {
    expect(calcEstimatedValue(['silver'], mockPricing)).toBe(0)
    expect(calcEstimatedValue(['gold'], mockPricing)).toBe(0)
    expect(calcEstimatedValue(['card'], mockPricing)).toBe(0)
  })
  it('returns dropInRate for dropin', () => {
    expect(calcEstimatedValue(['dropin'], mockPricing)).toBe(13)
  })
  it('returns usc rate for usc', () => {
    expect(calcEstimatedValue(['usc'], mockPricing)).toBe(8)
  })
  it('returns eversports rate for eversports', () => {
    expect(calcEstimatedValue(['eversports'], mockPricing)).toBe(10)
  })
  it('returns 0 for trial', () => {
    expect(calcEstimatedValue(['trial'], mockPricing)).toBe(0)
  })
  it('returns 0 for cash supplement alone', () => {
    expect(calcEstimatedValue(['cash'], mockPricing)).toBe(0)
  })
  it('returns 0 for empty combination (party)', () => {
    expect(calcEstimatedValue([], mockPricing)).toBe(0)
  })
  it('sums usc + cash', () => {
    expect(calcEstimatedValue(['usc', 'cash'], mockPricing)).toBe(8)
  })
  it('returns 0 when pricingConfig is null', () => {
    expect(calcEstimatedValue(['dropin'], null)).toBe(0)
  })
})

describe('computeDisabled', () => {
  it('gold disables all other tokens', () => {
    const disabled = computeDisabled(new Set<CombinationToken>(['gold']), false)
    expect(disabled.has('silver')).toBe(true)
    expect(disabled.has('bronze')).toBe(true)
    expect(disabled.has('card')).toBe(true)
    expect(disabled.has('usc')).toBe(true)
    expect(disabled.has('dropin')).toBe(true)
    expect(disabled.has('trial')).toBe(true)
    expect(disabled.has('cash')).toBe(true)
    expect(disabled.has('gold')).toBe(false)
  })
  it('trial disables all other tokens', () => {
    const disabled = computeDisabled(new Set<CombinationToken>(['trial']), false)
    expect(disabled.has('gold')).toBe(true)
    expect(disabled.has('silver')).toBe(true)
    expect(disabled.has('cash')).toBe(true)
    expect(disabled.has('trial')).toBe(false)
  })
  it('dropin disables all other tokens', () => {
    const disabled = computeDisabled(new Set<CombinationToken>(['dropin']), false)
    expect(disabled.has('gold')).toBe(true)
    expect(disabled.has('silver')).toBe(true)
    expect(disabled.has('cash')).toBe(true)
    expect(disabled.has('dropin')).toBe(false)
  })
  it('silver disables bronze and card, allows supplements only for special', () => {
    const disabledRegular = computeDisabled(new Set<CombinationToken>(['silver']), false)
    expect(disabledRegular.has('bronze')).toBe(true)
    expect(disabledRegular.has('card')).toBe(true)
    expect(disabledRegular.has('usc')).toBe(true)   // no supplement for regular
    expect(disabledRegular.has('cash')).toBe(true)
    const disabledSpecial = computeDisabled(new Set<CombinationToken>(['silver']), true)
    expect(disabledSpecial.has('usc')).toBe(false)  // supplement allowed for special
    expect(disabledSpecial.has('cash')).toBe(false)
    expect(disabledSpecial.has('bronze')).toBe(true) // still disabled
  })
  it('only one supplement allowed: usc disables eversports and cash', () => {
    const disabled = computeDisabled(new Set<CombinationToken>(['silver', 'usc']), true)
    expect(disabled.has('eversports')).toBe(true)
    expect(disabled.has('cash')).toBe(true)
  })
  it('empty set disables nothing', () => {
    const disabled = computeDisabled(new Set<CombinationToken>(), false)
    expect(disabled.size).toBe(0)
  })
})
