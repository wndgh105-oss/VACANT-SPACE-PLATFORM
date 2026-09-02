import { describe, it, expect } from 'vitest'
import { summarizeRecentApplications } from '@/lib/applicationSummary'

describe('summarizeRecentApplications', () => {
  it('returns at most `limit` items, most recent first', () => {
    const apps = [
      { id: '1', createdAt: '2026-01-01' },
      { id: '2', createdAt: '2026-01-03' },
      { id: '3', createdAt: '2026-01-02' },
    ]
    expect(summarizeRecentApplications(apps, 2).map((a) => a.id)).toEqual(['2', '3'])
  })

  it('returns empty array when given no applications', () => {
    expect(summarizeRecentApplications([], 3)).toEqual([])
  })
})
