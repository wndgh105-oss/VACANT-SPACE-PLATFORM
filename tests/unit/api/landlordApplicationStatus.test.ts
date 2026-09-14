import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/notify', () => ({ notify: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: { findUnique: vi.fn(), update: vi.fn() },
    listing: { update: vi.fn() },
    tenancy: { count: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { PATCH } from '@/app/api/landlord/applications/[id]/route'

const LISTING = { id: 'l1', title: '연무장길 코너', address: '서울 성동구', landlordId: 'landlord1', monthlyRent: 1000000, maintenanceFee: 0 }

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/landlord/applications/a1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function baseApplication(overrides: Record<string, unknown> = {}) {
  return {
    id: 'a1',
    status: 'CONTACTING',
    listingId: 'l1',
    tenantId: 't1',
    quote: null,
    desiredStartDate: new Date('2026-10-01'),
    desiredDuration: 2,
    listing: LISTING,
    ...overrides,
  }
}

describe('PATCH /api/landlord/applications/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'landlord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.$transaction).mockImplementation(
      (ops: unknown) => Promise.all(ops as Promise<unknown>[]) as never
    )
    vi.mocked(prisma.tenancy.count).mockResolvedValue(0)
    vi.mocked(prisma.tenancy.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONFIRMED' } as never)
    vi.mocked(prisma.listing.update).mockResolvedValue({ id: 'l1', status: 'CLOSED' } as never)
    vi.mocked(prisma.tenancy.create).mockResolvedValue({ id: 'tn1' } as never)
  })

  it('confirms normally when the listing has no active tenancy yet', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(baseApplication() as never)

    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })

    expect(res.status).toBe(200)
    expect(prisma.tenancy.create).toHaveBeenCalledTimes(1)
  })

  it('rejects with 409 when another application already holds an active tenancy on the same listing', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(baseApplication() as never)
    vi.mocked(prisma.tenancy.findFirst).mockResolvedValue({ id: 'tn-existing', listingId: 'l1', status: 'ACTIVE' } as never)

    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })

    expect(res.status).toBe(409)
    expect(prisma.tenancy.create).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('does not treat re-confirming the same application (idempotent) as a conflict', async () => {
    // The application being confirmed already owns the active tenancy from a prior click.
    vi.mocked(prisma.application.findUnique).mockResolvedValue(baseApplication({ status: 'PENDING' }) as never)
    vi.mocked(prisma.tenancy.count).mockResolvedValue(1)

    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })

    expect(res.status).toBe(200)
    expect(prisma.tenancy.findFirst).not.toHaveBeenCalled()
    expect(prisma.tenancy.create).not.toHaveBeenCalled()
  })

  it('does not check for conflicts when the transition does not involve CONFIRMED', async () => {
    vi.mocked(prisma.application.findUnique).mockResolvedValue(baseApplication({ status: 'PENDING' }) as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONTACTING' } as never)

    const res = await PATCH(makeRequest({ status: 'CONTACTING' }), { params: { id: 'a1' } })

    expect(res.status).toBe(200)
    expect(prisma.tenancy.findFirst).not.toHaveBeenCalled()
  })

  it('returns 403 when the requester does not own the listing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'someone-else', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.application.findUnique).mockResolvedValue(baseApplication() as never)

    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })

    expect(res.status).toBe(403)
    expect(prisma.tenancy.findFirst).not.toHaveBeenCalled()
  })
})
