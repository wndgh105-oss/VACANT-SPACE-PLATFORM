import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('fs/promises', () => {
  const writeFile = vi.fn()
  const mkdir = vi.fn()
  return { writeFile, mkdir, default: { writeFile, mkdir } }
})

import { getServerSession } from 'next-auth'
import { writeFile, mkdir } from 'fs/promises'
import { POST } from '@/app/api/upload/route'

type FakeFile = { name: string; arrayBuffer: () => Promise<ArrayBuffer> } | null

function makeRequest(file: FakeFile) {
  return {
    formData: async () => ({
      get: (_key: string) => file,
    }),
  } as unknown as Request
}

describe('POST /api/upload', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when there is no session (unauthenticated)', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never)
    const res = await POST(makeRequest({ name: 'a.jpg', arrayBuffer: async () => new ArrayBuffer(1) }))
    expect(res.status).toBe(403)
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('returns 403 when caller is not a landlord', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    const res = await POST(makeRequest({ name: 'a.jpg', arrayBuffer: async () => new ArrayBuffer(1) }))
    expect(res.status).toBe(403)
    expect(writeFile).not.toHaveBeenCalled()
  })

  it('returns 400 when no file is provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    const res = await POST(makeRequest(null))
    expect(res.status).toBe(400)
  })

  it('sanitizes a path-traversal extension to a safe default instead of using it verbatim', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(mkdir).mockResolvedValue(undefined as never)
    vi.mocked(writeFile).mockResolvedValue(undefined as never)

    const res = await POST(
      makeRequest({ name: 'a.b/../../../../tmp/evil', arrayBuffer: async () => new ArrayBuffer(3) })
    )

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toMatch(/^\/uploads\/[^/]+\.jpg$/)
    expect(json.url).not.toContain('..')

    const writtenPath = vi.mocked(writeFile).mock.calls[0][0] as string
    expect(writtenPath).not.toContain('..')
  })

  it('preserves an allowed image extension (case-insensitively, lowercased)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(mkdir).mockResolvedValue(undefined as never)
    vi.mocked(writeFile).mockResolvedValue(undefined as never)

    const res = await POST(makeRequest({ name: 'photo.PNG', arrayBuffer: async () => new ArrayBuffer(3) }))

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toMatch(/^\/uploads\/[^/]+\.png$/)
  })
})
