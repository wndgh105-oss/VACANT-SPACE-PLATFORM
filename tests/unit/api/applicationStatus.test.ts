import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/requireAdmin', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: { findUnique: vi.fn(), update: vi.fn() },
    listing: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}))

import { requireAdmin } from '@/lib/requireAdmin'
import { prisma } from '@/lib/prisma'
import { PATCH } from '@/app/api/applications/[id]/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/applications/a1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('PATCH /api/applications/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Simulate a real transaction: resolve every operation passed in, preserving order.
    vi.mocked(prisma.$transaction).mockImplementation(
      (ops: unknown) => Promise.all(ops as Promise<unknown>[]) as never
    )
  })

  it('delegates to requireAdmin and returns its response when unauthorized', async () => {
    const forbiddenResponse = new Response(null, { status: 403 })
    vi.mocked(requireAdmin).mockResolvedValue({ ok: false, response: forbiddenResponse as never })

    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })
    expect(res.status).toBe(403)
    expect(prisma.application.findUnique).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('updates application and closes the listing when confirming', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'PENDING', listingId: 'l1' } as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONFIRMED', listingId: 'l1' } as never)
    vi.mocked(prisma.listing.update).mockResolvedValue({ id: 'l1', status: 'CLOSED' } as never)

    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })
    expect(res.status).toBe(200)
    expect(prisma.listing.update).toHaveBeenCalledWith({ where: { id: 'l1' }, data: { status: 'CLOSED' } })
  })

  it('reopens the listing when moving an application away from CONFIRMED', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'CONFIRMED', listingId: 'l1' } as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'REJECTED', listingId: 'l1' } as never)
    vi.mocked(prisma.listing.update).mockResolvedValue({ id: 'l1', status: 'OPEN' } as never)

    const res = await PATCH(makeRequest({ status: 'REJECTED' }), { params: { id: 'a1' } })
    expect(res.status).toBe(200)
    expect(prisma.listing.update).toHaveBeenCalledWith({ where: { id: 'l1' }, data: { status: 'OPEN' } })
  })

  it('does not touch the listing when the transition does not involve CONFIRMED', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'PENDING', listingId: 'l1' } as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONTACTING', listingId: 'l1' } as never)

    await PATCH(makeRequest({ status: 'CONTACTING' }), { params: { id: 'a1' } })
    expect(prisma.listing.update).not.toHaveBeenCalled()
  })

  it('returns 404 when the application does not exist', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue(null as never)

    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'missing' } })
    expect(res.status).toBe(404)
    expect(prisma.application.update).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('only ever writes the client-supplied status field (no mass-assignment)', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'PENDING', listingId: 'l1' } as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONTACTING', listingId: 'l1' } as never)

    await PATCH(
      makeRequest({
        status: 'CONTACTING',
        listingId: 'attacker-listing',
        id: 'someone-elses-id',
        tenantId: 'attacker-id',
      }),
      { params: { id: 'a1' } }
    )

    const call = vi.mocked(prisma.application.update).mock.calls[0][0] as { data: Record<string, unknown> }
    expect(Object.keys(call.data)).toEqual(['status'])
  })

  it('wraps the application update and the listing update in a single $transaction call when confirming', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'PENDING', listingId: 'l1' } as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONFIRMED', listingId: 'l1' } as never)
    vi.mocked(prisma.listing.update).mockResolvedValue({ id: 'l1', status: 'CLOSED' } as never)

    await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    const operations = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown as unknown[]
    expect(operations).toHaveLength(2)
  })

  it('wraps only the application update in $transaction when the listing is not touched', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'PENDING', listingId: 'l1' } as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONTACTING', listingId: 'l1' } as never)

    await PATCH(makeRequest({ status: 'CONTACTING' }), { params: { id: 'a1' } })

    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    const operations = vi.mocked(prisma.$transaction).mock.calls[0][0] as unknown as unknown[]
    expect(operations).toHaveLength(1)
  })

  it('does not persist the application update if the listing update in the transaction fails', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'PENDING', listingId: 'l1' } as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONFIRMED', listingId: 'l1' } as never)
    vi.mocked(prisma.listing.update).mockResolvedValue({ id: 'l1', status: 'CLOSED' } as never)
    // Simulate a real DB transaction: if any operation fails, $transaction rejects as a whole.
    vi.mocked(prisma.$transaction).mockRejectedValue(new Error('db blip'))

    await expect(PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })).rejects.toThrow('db blip')
  })
})
