import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { application: { findFirst: vi.fn(), create: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/applications/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/applications', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/applications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not logged in', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(makeRequest({ listingId: 'l1' }))
    expect(res.status).toBe(401)
  })

  it('returns 409 when tenant already applied to this listing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.application.findFirst).mockResolvedValue({ id: 'existing' } as never)

    const res = await POST(
      makeRequest({ listingId: 'l1', applicantName: 'A', phone: '010', desiredDuration: 2, desiredStartDate: '2026-10-01' })
    )
    expect(res.status).toBe(409)
  })

  it('creates application and returns 201', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.application.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.application.create).mockResolvedValue({ id: 'a1', status: 'PENDING' } as never)

    const res = await POST(
      makeRequest({ listingId: 'l1', applicantName: 'A', phone: '010', desiredDuration: 2, desiredStartDate: '2026-10-01' })
    )
    expect(res.status).toBe(201)
  })
})
