import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { application: { findMany: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/applications/route'

describe('GET /api/applications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not logged in', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/applications'))
    expect(res.status).toBe(401)
  })

  it('filters by tenantId for TENANT role', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.application.findMany).mockResolvedValue([])

    await GET(new Request('http://localhost/api/applications'))
    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1' } })
    )
  })

  it('filters by listing.landlordId for LANDLORD role', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.application.findMany).mockResolvedValue([])

    await GET(new Request('http://localhost/api/applications'))
    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { listing: { landlordId: 'lord1' } } })
    )
  })

  it('returns all applications for ADMIN role', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'admin1', role: 'ADMIN' } } as never)
    vi.mocked(prisma.application.findMany).mockResolvedValue([])

    await GET(new Request('http://localhost/api/applications'))
    expect(prisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })
})
