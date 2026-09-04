'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessType } from '@prisma/client'
import { ADDONS, computeQuote, manWon, won } from '@/lib/quote'
import { businessTypeLabel } from '@/lib/labels'

export type QuotePackage = {
  id: string
  businessType: BusinessType
  name: string
  description: string | null
  items: Array<{ id: string; name: string; monthlyFee: number; optional: boolean }>
}

export type QuoteListing = {
  id: string
  title: string | null
  address: string
  area: number
  monthlyRent: number
  maintenanceFee: number
  deposit: number
  contractDurations: number[]
  businessTypes: BusinessType[]
  recommendedTypes: BusinessType[]
}

export function QuoteBuilder({
  listing,
  packages,
}: {
  listing: QuoteListing
  packages: QuotePackage[]
}) {
  const router = useRouter()

  const durationOptions = listing.contractDurations.length
    ? [...listing.contractDurations].sort((a, b) => a - b)
    : [1, 2, 3, 6]

  const defaultPackage =
    packages.find((p) => p.businessType === (listing.recommendedTypes[0] ?? listing.businessTypes[0])) ??
    packages[0] ??
    null

  const [months, setMonths] = useState<number>(
    durationOptions.includes(2) ? 2 : durationOptions[0]
  )
  const [packageId, setPackageId] = useState<string | null>(defaultPackage?.id ?? null)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [addonIds, setAddonIds] = useState<string[]>(['signage', 'permit'])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pkg = packages.find((p) => p.id === packageId) ?? null

  const selectedItems = useMemo(
    () => (pkg ? pkg.items.filter((i) => !i.optional || !excluded.has(i.id)) : []),
    [pkg, excluded]
  )
  const equipmentMonthly = selectedItems.reduce((s, i) => s + i.monthlyFee, 0)

  const businessType: BusinessType =
    pkg?.businessType ?? listing.recommendedTypes[0] ?? listing.businessTypes[0] ?? 'OTHER'

  const result = computeQuote({
    months,
    monthlyRent: listing.monthlyRent,
    maintenanceFee: listing.maintenanceFee,
    deposit: listing.deposit,
    area: listing.area,
    businessType,
    equipmentMonthly,
    addonIds,
  })

  function toggleItem(id: string) {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectPackage(id: string | null) {
    setPackageId(id)
    setExcluded(new Set())
  }

  async function submit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          months,
          packageId,
          itemIds: selectedItems.filter((i) => i.optional).map((i) => i.id),
          addonIds,
        }),
      })
      if (!res.ok) throw new Error('견적을 저장하지 못했습니다.')
      const data = await res.json()
      router.push(`/spaces/${listing.id}/quote/request?quoteId=${data.id}&months=${months}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      <div className="min-w-0 space-y-5">
        {/* ① 기간 */}
        <section className="vs-card p-5" aria-labelledby="q-duration">
          <h2 id="q-duration" className="vs-section-title">
            <span className="mr-2 text-[var(--brand)]">①</span>얼마나 빌릴까요?
          </h2>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
            이 공간은 {durationOptions.map((d) => `${d}개월`).join(' · ')} 계약이 가능합니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {durationOptions.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={months === d}
                onClick={() => setMonths(d)}
                className={`vs-btn ${months === d ? 'vs-btn-primary' : 'vs-btn-secondary'}`}
              >
                {d}개월
              </button>
            ))}
          </div>
        </section>

        {/* ② 장비 패키지 */}
        <section className="vs-card p-5" aria-labelledby="q-package">
          <h2 id="q-package" className="vs-section-title">
            <span className="mr-2 text-[var(--brand)]">②</span>어떤 장비가 필요한가요?
          </h2>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
            구매가 아니라 월 렌탈입니다. 종료 시 반납하므로 실패 비용이 남지 않습니다.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {packages.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={packageId === p.id}
                onClick={() => selectPackage(p.id)}
                className={`rounded-[12px] border p-3 text-left transition-colors ${
                  packageId === p.id
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]'
                }`}
              >
                <p className="text-[15px] font-bold">{p.name}</p>
                <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
                  {businessTypeLabel(p.businessType)} · 품목 {p.items.length}개
                </p>
                <p className="mt-1 text-[14px] font-semibold text-[var(--brand)]">
                  월 {won(p.items.reduce((s, i) => s + i.monthlyFee, 0))}부터
                </p>
              </button>
            ))}
            <button
              type="button"
              aria-pressed={packageId === null}
              onClick={() => selectPackage(null)}
              className={`rounded-[12px] border p-3 text-left transition-colors ${
                packageId === null
                  ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                  : 'border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]'
              }`}
            >
              <p className="text-[15px] font-bold">장비 없이 공간만</p>
              <p className="mt-0.5 text-[12px] text-[var(--ink-muted)]">
                이미 장비를 가지고 있어요
              </p>
            </button>
          </div>

          {pkg && (
            <div className="vs-fade mt-5 border-t border-[var(--line)] pt-4">
              <p className="text-[13px] font-semibold">
                {pkg.name} 구성 품목{' '}
                <span className="vs-muted font-normal">— 필요 없는 품목은 빼도 됩니다</span>
              </p>
              <ul className="mt-3 space-y-1">
                {pkg.items.map((item) => {
                  const on = !item.optional || !excluded.has(item.id)
                  return (
                    <li key={item.id}>
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-2 transition-colors ${
                          on ? '' : 'opacity-45'
                        } hover:bg-[var(--surface-alt)]`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-[var(--brand)]"
                          checked={on}
                          disabled={!item.optional}
                          onChange={() => toggleItem(item.id)}
                        />
                        <span className="flex-1 text-[14px]">
                          {item.name}
                          {!item.optional && <span className="vs-badge ml-2">필수</span>}
                        </span>
                        <span className="text-[13px] font-semibold tabular-nums">
                          월 {won(item.monthlyFee)}
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </section>

        {/* ③ 부가 옵션 */}
        <section className="vs-card p-5" aria-labelledby="q-addon">
          <h2 id="q-addon" className="vs-section-title">
            <span className="mr-2 text-[var(--brand)]">③</span>함께 준비할 것
          </h2>
          <ul className="mt-4 space-y-1">
            {ADDONS.map((a) => {
              const on = addonIds.includes(a.id)
              return (
                <li key={a.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-[10px] px-2 py-2 hover:bg-[var(--surface-alt)]">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-[var(--brand)]"
                      checked={on}
                      onChange={() =>
                        setAddonIds((prev) =>
                          prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id]
                        )
                      }
                    />
                    <span className="flex-1">
                      <span className="block text-[14px] font-medium">{a.label}</span>
                      <span className="block text-[12px] text-[var(--ink-muted)]">{a.note}</span>
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums">{won(a.onceFee)}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      {/* 견적 요약 */}
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <div className="vs-card overflow-hidden">
          <div className="border-b border-[var(--line)] bg-[var(--surface-alt)] px-5 py-3">
            <p className="text-[13px] font-bold">예상 견적서</p>
            <p className="text-[11px] text-[var(--ink-muted)]">
              {listing.title ?? listing.address} · {result.months}개월
            </p>
          </div>

          <dl className="space-y-2 px-5 py-4 text-[14px]">
            <Row label={`공간 이용료 (${result.months}개월)`} value={won(result.spaceTotal)} />
            {result.maintenanceTotal > 0 && (
              <Row label="관리비" value={won(result.maintenanceTotal)} />
            )}
            <Row
              label={pkg ? `${pkg.name} (${selectedItems.length}품목)` : '장비'}
              value={won(result.equipmentTotal)}
            />
            <Row label="부가 옵션" value={won(result.addonTotal)} />
            <div className="!mt-3 border-t border-[var(--line)] pt-3">
              <Row label="지출 합계" value={won(result.grandTotal)} strong />
              <Row
                label="보증금 (종료 시 반환)"
                value={won(result.depositAmount)}
                muted
              />
            </div>
          </dl>

          <div className="bg-[var(--brand-soft)] px-5 py-4">
            <p className="text-[12px] font-semibold text-[var(--brand-strong)]">
              계약 시점에 필요한 현금
            </p>
            <p className="text-[28px] font-bold leading-tight text-[var(--brand-strong)]">
              {won(result.needCash)}
            </p>
            <p className="mt-0.5 text-[12px] text-[var(--brand-strong)]/80">
              월 평균 {won(result.monthlyAvg)}
            </p>
          </div>

          <div className="px-5 py-4">
            <div className="flex items-center gap-2">
              <p className="text-[13px] font-semibold">정식 창업 대비</p>
              <span className="vs-badge vs-badge-warn">가정 기준</span>
            </div>
            <p className="mt-1 text-[20px] font-bold text-[var(--ok)]">
              {manWon(result.savedVsFull)} 덜 듭니다
            </p>
            <div
              className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-alt)]"
              role="img"
              aria-label={`정식 창업 대비 ${Math.round(result.savedRate * 100)}퍼센트 절감`}
            >
              <div
                className="h-full rounded-full bg-[var(--ok)] transition-[width] duration-500"
                style={{ width: `${Math.round(result.savedRate * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[12px] text-[var(--ink-muted)]">
              정식 창업 시 {manWon(result.fullStartup.total)} 필요 · 약{' '}
              {Math.round(result.savedRate * 100)}% 절감
            </p>
          </div>

          <div className="border-t border-[var(--line)] p-5">
            {error && (
              <p role="alert" className="mb-3 text-[13px] text-[var(--danger)]">
                {error}
              </p>
            )}
            <button
              type="button"
              className="vs-btn vs-btn-primary w-full"
              onClick={submit}
              disabled={submitting}
            >
              {submitting ? '견적 저장 중…' : '상담·예약 요청하기'}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--ink-muted)]">
              결제나 계약이 진행되지 않습니다. 운영자가 조건을 확인한 뒤 연락하는 <strong>데모 요청</strong>입니다.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string
  value: string
  strong?: boolean
  muted?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={`text-[13px] ${muted ? 'text-[var(--ink-muted)]' : ''}`}>{label}</dt>
      <dd
        className={`tabular-nums ${
          strong ? 'text-[16px] font-bold' : muted ? 'text-[13px] text-[var(--ink-muted)]' : 'font-medium'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
