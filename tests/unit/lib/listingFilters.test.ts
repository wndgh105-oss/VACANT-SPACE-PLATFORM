import { describe, it, expect } from 'vitest'
import { parseListingFilters, buildListingWhere } from '@/lib/listingFilters'

describe('parseListingFilters', () => {
  it('parses all provided filters', () => {
    const params = new URLSearchParams('minPrice=500000&maxPrice=1000000&businessType=CAFE&duration=2')
    expect(parseListingFilters(params)).toEqual({
      minPrice: 500000,
      maxPrice: 1000000,
      businessType: 'CAFE',
      duration: 2,
    })
  })

  it('returns empty object when no params given', () => {
    expect(parseListingFilters(new URLSearchParams())).toEqual({})
  })
})

describe('buildListingWhere', () => {
  it('always restricts to OPEN listings', () => {
    expect(buildListingWhere({})).toMatchObject({ status: 'OPEN' })
  })

  it('adds price range, business type, and duration conditions', () => {
    const where = buildListingWhere({ minPrice: 500000, maxPrice: 1000000, businessType: 'CAFE', duration: 2 })
    expect(where).toMatchObject({
      status: 'OPEN',
      monthlyRent: { gte: 500000, lte: 1000000 },
      businessTypes: { has: 'CAFE' },
      contractDurations: { has: 2 },
    })
  })
})
