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

  it('always starts a new listing in PENDING_REVIEW so it is not searchable until an admin approves it', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.create).mockResolvedValue({ id: 'l1' } as never)

    await POST(
      makeRequest({
        address: 'A', area: 20, monthlyRent: 500000, deposit: 1000000,
        photos: [], contractDurations: [2], businessTypes: ['CAFE'],
      })
    )

    expect(prisma.listing.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'PENDING_REVIEW' }) })
    )
  })

  it('does not let the body set id, createdAt, status, or nested relation writes (mass-assignment)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.create).mockResolvedValue({ id: 'l1' } as never)

    const res = await POST(
      makeRequest({
        address: 'A', area: 20, monthlyRent: 500000, deposit: 1000000,
        photos: ['/uploads/a.jpg'], contractDurations: [2, 4], businessTypes: ['CAFE'],
        id: 'attacker-chosen-id',
        createdAt: '2000-01-01T00:00:00.000Z',
        status: 'CLOSED',
        landlordId: 'attacker-id',
        applications: {
          create: [{ tenant: { connect: { id: 'victim-tenant-id' } }, status: 'CONFIRMED' }],
        },
      })
    )

    expect(res.status).toBe(201)
    const call = vi.mocked(prisma.listing.create).mock.calls[0][0] as { data: Record<string, unknown> }
    expect(call.data).not.toHaveProperty('id')
    expect(call.data).not.toHaveProperty('createdAt')
    expect(call.data).not.toHaveProperty('applications')
    expect(call.data.landlordId).toBe('lord1')
    // status는 클라이언트가 'CLOSED'를 보냈어도 서버가 항상 실사 대기로 강제한다 (등록만으로 즉시 노출되는 것을 방지).
    expect(call.data.status).toBe('PENDING_REVIEW')
    // 확장된 등록 필드는 서버가 명시적으로 화이트리스트해서 채운다.
    expect(call.data).toEqual({
      status: 'PENDING_REVIEW',
      title: null,
      address: 'A',
      region: null,
      lat: null,
      lng: null,
      area: 20,
      monthlyRent: 500000,
      deposit: 1000000,
      maintenanceFee: 0,
      photos: ['/uploads/a.jpg'],
      contractDurations: [2, 4],
      businessTypes: ['CAFE'],
      recommendedTypes: [],
      parking: false,
      powerKw: 0,
      hasGas: false,
      hasDrain: false,
      immediateMoveIn: false,
      areaSummary: null,
      description: null,
      landlordId: 'lord1',
    })
  })
})
