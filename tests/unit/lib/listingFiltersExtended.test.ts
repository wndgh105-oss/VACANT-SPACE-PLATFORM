import { describe, it, expect } from 'vitest'
import { parseListingFilters, buildListingWhere, relaxationSuggestions } from '@/lib/listingFilters'

const parse = (qs: string) => parseListingFilters(new URLSearchParams(qs))

describe('parseListingFilters — 확장 필터', () => {
  it('reads region, deposit, area and power thresholds', () => {
    const f = parse('region=성수동&maxDeposit=2000000&minArea=10&minPowerKw=8')
    expect(f).toMatchObject({
      region: '성수동',
      maxDeposit: 2_000_000,
      minArea: 10,
      minPowerKw: 8,
    })
  })

  it('treats only "1" and "true" as an enabled facility flag', () => {
    expect(parse('parking=1').parking).toBe(true)
    expect(parse('parking=true').parking).toBe(true)
    expect(parse('parking=0').parking).toBeUndefined()
    expect(parse('parking=').parking).toBeUndefined()
  })

  it('drops non-numeric values instead of producing NaN filters', () => {
    expect(parse('maxPrice=abc').maxPrice).toBeUndefined()
    expect(parse('minArea=').minArea).toBeUndefined()
  })
})

describe('buildListingWhere — 확장 필터', () => {
  it('always restricts to OPEN listings so pending-review spaces stay hidden', () => {
    expect(buildListingWhere({}).status).toBe('OPEN')
  })

  it('maps facility flags onto the matching columns', () => {
    const where = buildListingWhere({ parking: true, gas: true, drain: true, immediate: true })
    expect(where).toMatchObject({
      parking: true,
      hasGas: true,
      hasDrain: true,
      immediateMoveIn: true,
    })
  })

  it('turns deposit and area limits into range filters', () => {
    const where = buildListingWhere({ maxDeposit: 2_000_000, minArea: 10 })
    expect(where.deposit).toEqual({ lte: 2_000_000 })
    expect(where.area).toEqual({ gte: 10 })
  })

  it('omits facility columns entirely when the flag is not set', () => {
    const where = buildListingWhere({ region: '연남동' })
    expect(where).not.toHaveProperty('parking')
    expect(where).not.toHaveProperty('hasGas')
    expect(where.region).toBe('연남동')
  })
})

describe('relaxationSuggestions', () => {
  it('suggests a concrete higher budget when a price cap is active', () => {
    expect(relaxationSuggestions({ maxPrice: 1_200_000 })[0]).toContain('140만 원')
  })

  it('returns nothing to relax when no filters are applied', () => {
    expect(relaxationSuggestions({})).toEqual([])
  })
})
