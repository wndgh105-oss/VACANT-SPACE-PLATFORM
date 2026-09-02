import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/auth/register/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 409 when email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as never)
    const res = await POST(makeRequest({ email: 'a@a.com', password: 'pw123456', name: 'A', role: 'TENANT' }))
    expect(res.status).toBe(409)
  })

  it('creates user and returns 201 on valid input', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: '1', email: 'a@a.com', name: 'A', role: 'TENANT', passwordHash: 'x', createdAt: new Date(),
    } as never)
    const res = await POST(makeRequest({ email: 'a@a.com', password: 'pw123456', name: 'A', role: 'TENANT' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toEqual({ id: '1', email: 'a@a.com', name: 'A', role: 'TENANT' })
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ email: 'a@a.com' }))
    expect(res.status).toBe(400)
  })
})
