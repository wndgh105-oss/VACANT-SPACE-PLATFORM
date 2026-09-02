import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { authorizeCredentials } from '@/lib/auth'

describe('authorizeCredentials', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const result = await authorizeCredentials('a@a.com', 'pw')
    expect(result).toBeNull()
  })

  it('returns null when password does not match', async () => {
    const hash = await bcrypt.hash('correct-password', 10)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1', email: 'a@a.com', passwordHash: hash, name: 'A', role: 'TENANT', createdAt: new Date(),
    } as never)
    const result = await authorizeCredentials('a@a.com', 'wrong-password')
    expect(result).toBeNull()
  })

  it('returns user object when password matches', async () => {
    const hash = await bcrypt.hash('correct-password', 10)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1', email: 'a@a.com', passwordHash: hash, name: 'A', role: 'TENANT', createdAt: new Date(),
    } as never)
    const result = await authorizeCredentials('a@a.com', 'correct-password')
    expect(result).toEqual({ id: '1', email: 'a@a.com', name: 'A', role: 'TENANT' })
  })
})
