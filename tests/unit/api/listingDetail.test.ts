import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    listing: { findUnique: vi.fn() },
    equipmentPackage: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/listings/[id]/route'

describe('GET /api/listings/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when listing does not exist', async () => {
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/listings/x'), { params: { id: 'x' } })
    expect(res.status).toBe(404)
  })

  it('returns listing with matching equipment packages', async () => {
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({
      id: 'l1', address: 'A', businessTypes: ['CAFE'], monthlyRent: 500000, deposit: 1000000,
      area: 20, photos: [], contractDurations: [2, 4], status: 'OPEN', createdAt: new Date(),
    } as never)
    vi.mocked(prisma.equipmentPackage.findMany).mockResolvedValue([
      { id: 'p1', businessType: 'CAFE', name: '카페 스타터 패키지', items: ['에스프레소 머신'], monthlyFee: 100000 },
    ] as never)

    const res = await GET(new Request('http://localhost/api/listings/l1'), { params: { id: 'l1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.address).toBe('A')
    expect(json.equipmentPackages).toHaveLength(1)
  })
})
