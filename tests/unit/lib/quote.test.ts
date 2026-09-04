import { describe, it, expect } from 'vitest'
import { computeQuote, findAddons, manWon, won } from '@/lib/quote'
import { fullStartupCost } from '@/lib/startupBaseline'

const base = {
  months: 2,
  monthlyRent: 1_500_000,
  maintenanceFee: 120_000,
  deposit: 1_500_000,
  area: 12,
  businessType: 'CAFE' as const,
  equipmentMonthly: 650_000,
  addonIds: [] as string[],
}

describe('computeQuote', () => {
  it('multiplies every recurring line by the number of months', () => {
    const r = computeQuote(base)
    expect(r.spaceTotal).toBe(3_000_000)
    expect(r.maintenanceTotal).toBe(240_000)
    expect(r.equipmentTotal).toBe(1_300_000)
  })

  it('keeps the deposit out of the spend total but inside the cash needed', () => {
    const r = computeQuote(base)
    expect(r.grandTotal).toBe(3_000_000 + 240_000 + 1_300_000)
    expect(r.needCash).toBe(r.grandTotal + 1_500_000)
  })

  it('adds one-off addon fees exactly once regardless of duration', () => {
    const two = computeQuote({ ...base, addonIds: ['signage', 'permit'] })
    const six = computeQuote({ ...base, months: 6, addonIds: ['signage', 'permit'] })
    expect(two.addonTotal).toBe(400_000)
    expect(six.addonTotal).toBe(400_000)
  })

  it('ignores unknown addon ids instead of throwing', () => {
    const r = computeQuote({ ...base, addonIds: ['signage', 'does-not-exist'] })
    expect(r.addonTotal).toBe(300_000)
    expect(findAddons(['nope'])).toEqual([])
  })

  it('clamps the duration into the supported 1~12 month range', () => {
    expect(computeQuote({ ...base, months: 0 }).months).toBe(1)
    expect(computeQuote({ ...base, months: 99 }).months).toBe(12)
  })

  it('never reports a negative saving when the short-term plan costs more', () => {
    // 임대료는 싸지만 장비를 12개월 내내 빌리면 구매보다 비싸지는 구간
    const r = computeQuote({
      ...base,
      months: 12,
      area: 1,
      monthlyRent: 300_000,
      maintenanceFee: 0,
      deposit: 300_000,
      equipmentMonthly: 5_000_000,
    })
    expect(r.savedVsFull).toBe(0)
    expect(r.savedRate).toBe(0)
  })

  it('measures the saving against the assumed full startup cost for the same space', () => {
    const r = computeQuote(base)
    const baseline = fullStartupCost({ area: 12, monthlyRent: 1_500_000, businessType: 'CAFE' })
    expect(r.fullStartup.total).toBe(baseline.total)
    expect(r.savedVsFull).toBe(baseline.total - r.needCash)
    expect(r.savedRate).toBeGreaterThan(0.8)
  })

  it('computes the monthly average from the spend total, not the cash needed', () => {
    const r = computeQuote(base)
    expect(r.monthlyAvg).toBe(Math.round(r.grandTotal / 2))
  })
})

describe('fullStartupCost', () => {
  it('scales interior cost with the floor area', () => {
    const small = fullStartupCost({ area: 10, monthlyRent: 1_000_000, businessType: 'CAFE' })
    const big = fullStartupCost({ area: 20, monthlyRent: 1_000_000, businessType: 'CAFE' })
    expect(big.interior).toBe(small.interior * 2)
  })

  it('charges no key money for office and study spaces', () => {
    expect(fullStartupCost({ area: 20, monthlyRent: 800_000, businessType: 'OFFICE' }).premium).toBe(0)
    expect(fullStartupCost({ area: 20, monthlyRent: 800_000, businessType: 'STUDY' }).premium).toBe(0)
  })
})

describe('currency formatting', () => {
  it('formats plain won with thousand separators', () => {
    expect(won(1_250_000)).toBe('1,250,000원')
  })

  it('summarises large amounts in 만/억 units', () => {
    expect(manWon(6_280_000)).toBe('628만 원')
    expect(manWon(107_500_000)).toBe('1억 750만 원')
    expect(manWon(200_000_000)).toBe('2억 원')
  })
})
