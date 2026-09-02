import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { getServerSession } from 'next-auth'
import { requireAdmin } from '@/lib/requireAdmin'

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ok: false with 401 when not logged in', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it('returns ok: false with 403 when logged in but not ADMIN', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('returns ok: true with session when caller is ADMIN', async () => {
    const session = { user: { id: 'admin1', role: 'ADMIN' } }
    vi.mocked(getServerSession).mockResolvedValue(session as never)
    const result = await requireAdmin()
    expect(result).toEqual({ ok: true, session })
  })
})
