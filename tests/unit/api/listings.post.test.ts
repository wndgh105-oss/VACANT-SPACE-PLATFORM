import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { listing: { findMany: vi.fn(), create: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/listings/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/listings', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/listings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when caller is not a landlord', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    const res = await POST(makeRequest({ address: 'A' }))
    expect(res.status).toBe(403)
  })

  it('creates a listing owned by the logged-in landlord', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.create).mockResolvedValue({ id: 'l1' } as never)

    const res = await POST(
      makeRequest({
        address: 'A', area: 20, monthlyRent: 500000, deposit: 1000000,
        photos: ['/uploads/a.jpg'], contractDurations: [2, 4], businessTypes: ['CAFE'],
      })
    )
    expect(res.status).toBe(201)
    expect(prisma.listing.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ landlordId: 'lord1' }) })
    )
  })
})
