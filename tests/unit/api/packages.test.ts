import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/requireAdmin', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    equipmentPackage: {
      findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    },
    equipmentItem: { createMany: vi.fn() },
    $transaction: vi.fn(),
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
  beforeEach(() => {
    vi.clearAllMocks()
    // $transaction(callback) 실행을 흉내낸다: callback에 prisma 자체를 tx로 넘긴다.
    vi.mocked(prisma.$transaction).mockImplementation((cb: unknown) =>
      (cb as (tx: typeof prisma) => unknown)(prisma) as never
    )
  })

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
    expect(prisma.equipmentPackage.create).not.toHaveBeenCalled()
  })

  it('creates package when admin and business type is free', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.equipmentPackage.create).mockResolvedValue({ id: 'p1' } as never)
    const res = await POST(makeRequest('POST', { businessType: 'CAFE', name: 'X', items: ['a'], monthlyFee: 1 }))
    expect(res.status).toBe(201)
  })

  it('creates one required EquipmentItem per legacy item name, so the quote builder sees real items', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.equipmentPackage.create).mockResolvedValue({ id: 'p1' } as never)

    await POST(
      makeRequest('POST', {
        businessType: 'OFFICE',
        name: '사무실 패키지',
        items: ['책상', '의자', '복합기'],
        monthlyFee: 100,
      })
    )

    expect(prisma.equipmentItem.createMany).toHaveBeenCalledTimes(1)
    const call = vi.mocked(prisma.equipmentItem.createMany).mock.calls[0][0] as {
      data: Array<{ packageId: string; name: string; monthlyFee: number; optional: boolean }>
    }
    expect(call.data).toHaveLength(3)
    expect(call.data.every((i) => i.packageId === 'p1' && i.optional === false)).toBe(true)
    // 100원을 3품목에 균등 배분하되 나머지는 마지막 품목에 몰아 총합이 정확히 맞아야 한다.
    expect(call.data.map((i) => i.monthlyFee)).toEqual([33, 33, 34])
    expect(call.data.reduce((s, i) => s + i.monthlyFee, 0)).toBe(100)
  })

  it('skips EquipmentItem creation entirely when no item names are given', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.equipmentPackage.create).mockResolvedValue({ id: 'p1' } as never)

    await POST(makeRequest('POST', { businessType: 'CAFE', name: 'X', items: [], monthlyFee: 0 }))

    expect(prisma.equipmentItem.createMany).not.toHaveBeenCalled()
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
