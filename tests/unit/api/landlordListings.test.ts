import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { listing: { findMany: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/landlord/listings/route'

describe('GET /api/landlord/listings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when caller is not a landlord', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns only listings owned by the logged-in landlord with application counts', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.findMany).mockResolvedValue([
      { id: 'l1', address: 'A', _count: { applications: 3 } },
    ] as never)

    const res = await GET()
    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { landlordId: 'lord1' } })
    )
    const json = await res.json()
    expect(json[0]._count.applications).toBe(3)
  })
})
