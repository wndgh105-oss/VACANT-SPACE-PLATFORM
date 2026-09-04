'use client'

import { useState } from 'react'
import { won } from '@/lib/quote'

export type ReviewRow = {
  id: string
  title: string | null
  address: string
  region: string | null
  area: number
  monthlyRent: number
  landlordName: string
}

export function ReviewQueue({ rows }: { rows: ReviewRow[] }) {
  const [items, setItems] = useState(rows)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function review(id: string, approve: boolean) {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/listings/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve }),
      })
      if (!res.ok) throw new Error('처리하지 못했습니다.')
      setItems((prev) => prev.filter((r) => r.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setBusy(null)
    }
  }

  if (items.length === 0) {
    return (
      <p className="vs-card p-8 text-center text-[14px] text-[var(--ink-muted)]">
        실사 대기 중인 공실이 없습니다.
      </p>
    )
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-3 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.id} className="vs-card flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold">{r.title ?? r.address}</p>
              <p className="text-[12px] text-[var(--ink-muted)]">
                {r.landlordName} · {r.region ?? '지역 미입력'} · {r.area}평 · 월 {won(r.monthlyRent)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="vs-btn vs-btn-primary !px-3 !py-1.5 !text-[13px]"
                disabled={busy === r.id}
                onClick={() => review(r.id, true)}
              >
                실사 승인
              </button>
              <button
                type="button"
                className="vs-btn vs-btn-secondary !px-3 !py-1.5 !text-[13px]"
                disabled={busy === r.id}
                onClick={() => review(r.id, false)}
              >
                반려
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
