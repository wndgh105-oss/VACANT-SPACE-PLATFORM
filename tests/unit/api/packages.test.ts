import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/requireAdmin', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    equipmentPackage: {
      findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    },
  },
}))

import { requireAdmin } from '@/lib/requireAdmin'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/packages/route'
import { PATCH, DELETE } from '@/app/api/packages/[id]/route'

function makeRequest(method: string, body?: unknown) {
  return new Request('http://localhost/api/packages', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/packages', () => {
  it('returns all packages without requiring admin', async () => {
    vi.mocked(prisma.equipmentPackage.findMany).mockResolvedValue([{ id: 'p1' }] as never)
    const res = await GET()
    expect(res.status).toBe(200)
  })
})

describe('POST /api/packages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when not admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) as never })
    const res = await POST(makeRequest('POST', { businessType: 'CAFE', name: 'X', items: [], monthlyFee: 1 }))
    expect(res.status).toBe(403)
  })

  it('returns 409 when a package for this business type already exists', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.findUnique).mockResolvedValue({ id: 'existing' } as never)
    const res = await POST(makeRequest('POST', { businessType: 'CAFE', name: 'X', items: [], monthlyFee: 1 }))
    expect(res.status).toBe(409)
  })

  it('creates package when admin and business type is free', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.equipmentPackage.create).mockResolvedValue({ id: 'p1' } as never)
    const res = await POST(makeRequest('POST', { businessType: 'CAFE', name: 'X', items: ['a'], monthlyFee: 1 }))
    expect(res.status).toBe(201)
  })
})

describe('DELETE /api/packages/:id', () => {
  it('returns 403 when not admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) as never })
    const res = await DELETE(makeRequest('DELETE'), { params: { id: 'p1' } })
    expect(res.status).toBe(403)
  })

  it('deletes package when admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.delete).mockResolvedValue({ id: 'p1' } as never)
    const res = await DELETE(makeRequest('DELETE'), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/packages/:id', () => {
  it('updates package when admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.update).mockResolvedValue({ id: 'p1', name: 'Y' } as never)
    const res = await PATCH(makeRequest('PATCH', { name: 'Y' }), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
  })
})
