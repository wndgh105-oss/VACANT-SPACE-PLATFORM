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

  it('does not let the body reassign landlordId, id, or createdAt (mass-assignment)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({ id: 'l1', landlordId: 'lord1' } as never)
    vi.mocked(prisma.listing.update).mockResolvedValue({ id: 'l1', landlordId: 'lord1' } as never)

    const res = await PATCH(
      makeRequest({
        monthlyRent: 600000,
        landlordId: 'attacker-id',
        id: 'someone-elses-id',
        createdAt: '2000-01-01T00:00:00.000Z',
      }),
      { params: { id: 'l1' } }
    )

    expect(res.status).toBe(200)
    const call = vi.mocked(prisma.listing.update).mock.calls[0][0] as { data: Record<string, unknown> }
    expect(call.data).not.toHaveProperty('landlordId')
    expect(call.data).not.toHaveProperty('id')
    expect(call.data).not.toHaveProperty('createdAt')
    expect(call.data.monthlyRent).toBe(600000)
  })

  it('does not let a landlord reopen/close a listing via status in the PATCH body', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({ id: 'l1', landlordId: 'lord1' } as never)
    vi.mocked(prisma.listing.update).mockResolvedValue({ id: 'l1' } as never)

    const res = await PATCH(
      makeRequest({ monthlyRent: 600000, status: 'OPEN' }),
      { params: { id: 'l1' } }
    )

    expect(res.status).toBe(200)
    const call = vi.mocked(prisma.listing.update).mock.calls[0][0] as { data: Record<string, unknown> }
    expect(call.data).not.toHaveProperty('status')
  })
})
