import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    favorite: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { POST, GET } from '@/app/api/favorites/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/favorites', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/favorites (toggle)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a favorite when none exists and returns favorited: true', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.favorite.create).mockResolvedValue({ id: 'f1' } as never)

    const res = await POST(makeRequest({ listingId: 'l1' }))
    const json = await res.json()
    expect(json).toEqual({ favorited: true })
  })

  it('deletes an existing favorite and returns favorited: false', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue({ id: 'f1' } as never)
    vi.mocked(prisma.favorite.delete).mockResolvedValue({ id: 'f1' } as never)

    const res = await POST(makeRequest({ listingId: 'l1' }))
    const json = await res.json()
    expect(json).toEqual({ favorited: false })
  })
})

describe('GET /api/favorites', () => {
  it('returns favorites with listing data for the logged-in tenant', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.favorite.findMany).mockResolvedValue([{ id: 'f1', listing: { id: 'l1' } }] as never)

    const res = await GET()
    const json = await res.json()
    expect(json).toHaveLength(1)
  })
})
