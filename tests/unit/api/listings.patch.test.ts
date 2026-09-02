import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { listing: { findUnique: vi.fn(), update: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { PATCH } from '@/app/api/listings/[id]/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/listings/l1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('PATCH /api/listings/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when caller does not own the listing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord2', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({ id: 'l1', landlordId: 'lord1' } as never)

    const res = await PATCH(makeRequest({ monthlyRent: 600000 }), { params: { id: 'l1' } })
    expect(res.status).toBe(403)
  })

  it('updates listing when caller owns it', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({ id: 'l1', landlordId: 'lord1' } as never)
    vi.mocked(prisma.listing.update).mockResolvedValue({ id: 'l1', monthlyRent: 600000 } as never)

    const res = await PATCH(makeRequest({ monthlyRent: 600000 }), { params: { id: 'l1' } })
    expect(res.status).toBe(200)
  })
})
