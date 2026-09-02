import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { listing: { findMany: vi.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/listings/route'

describe('GET /api/listings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns listings from prisma as JSON', async () => {
    vi.mocked(prisma.listing.findMany).mockResolvedValue([
      { id: 'l1', address: 'A', monthlyRent: 500000, businessTypes: ['CAFE'], status: 'OPEN', photos: [] },
    ] as never)

    const res = await GET(new Request('http://localhost/api/listings?businessType=CAFE'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0].address).toBe('A')
  })
})
