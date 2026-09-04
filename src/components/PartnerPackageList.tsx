'use client'

import { useState } from 'react'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'
import { won } from '@/lib/quote'

export type PartnerPackage = {
  id: string
  name: string
  businessType: BusinessType
  description: string | null
  active: boolean
  items: Array<{ id: string; name: string; monthlyFee: number; optional: boolean }>
}

export function PartnerPackageList({ packages }: { packages: PartnerPackage[] }) {
  const [rows, setRows] = useState(packages)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggleActive(id: string, active: boolean) {
    setBusy(id)
    setError(null)
    try {
      const res = await fetch(`/api/partner/packages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      if (!res.ok) throw new Error('변경하지 못했습니다.')
      setRows((prev) => prev.map((p) => (p.id === id ? { ...p, active } : p)))
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setBusy(null)
    }
  }

  if (rows.length === 0) {
    return (
      <p className="vs-card p-10 text-center text-[14px] text-[var(--ink-muted)]">
        등록된 패키지가 없습니다.
      </p>
    )
  }

  return (
    <>
      {error && (
        <p role="alert" className="mb-4 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      )}
      <ul className="space-y-4">
        {rows.map((p) => (
          <li key={p.id} className="vs-card p-5">
            <div className="flex flex-wrap items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-bold">{p.name}</p>
                <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
                  {businessTypeLabel(p.businessType)} · 품목 {p.items.length}개 · 월{' '}
                  {won(p.items.reduce((s, i) => s + i.monthlyFee, 0))}
                </p>
                {p.description && (
                  <p className="mt-2 text-[13px] text-[var(--ink-muted)]">{p.description}</p>
                )}
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--brand)]"
                  checked={p.active}
                  disabled={busy === p.id}
                  onChange={(e) => toggleActive(p.id, e.target.checked)}
                />
                견적 화면에 노출
              </label>
            </div>

            <table className="mt-4 w-full text-left text-[13px]">
              <caption className="sr-only">{p.name} 구성 품목</caption>
              <thead>
                <tr className="border-b border-[var(--line)] text-[12px] text-[var(--ink-muted)]">
                  <th scope="col" className="py-2 font-medium">
                    품목
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    구분
                  </th>
                  <th scope="col" className="py-2 text-right font-medium">
                    월 렌탈료
                  </th>
                </tr>
              </thead>
              <tbody>
                {p.items.map((i) => (
                  <tr key={i.id} className="border-b border-[var(--line)] last:border-0">
                    <td className="py-2">{i.name}</td>
                    <td className="py-2">
                      <span className="vs-badge">{i.optional ? '선택' : '필수'}</span>
                    </td>
                    <td className="py-2 text-right tabular-nums font-semibold">{won(i.monthlyFee)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </li>
        ))}
      </ul>
    </>
  )
}
