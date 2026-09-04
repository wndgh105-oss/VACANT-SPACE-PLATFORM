'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'
import { manWon, won } from '@/lib/quote'
import { SpaceCard, SpaceCardData, SpaceCardSkeleton } from '@/components/SpaceCard'
import { fullStartupCost } from '@/lib/startupBaseline'

export type CalculatorPackage = {
  businessType: BusinessType
  name: string
  requiredMonthly: number
  fullMonthly: number
}

/** 부가 옵션(간판·인허가·보험·청소) 기본 가정 합계 */
const ADDON_ASSUMPTION = 630_000
/** 관리비를 월 이용료의 비율로 가정 */
const MAINTENANCE_RATE = 0.08

const TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OFFICE', 'STUDY']
const MONTH_OPTIONS = [1, 2, 3, 6]

export function BudgetCalculator({ packages }: { packages: CalculatorPackage[] }) {
  const [budgetMan, setBudgetMan] = useState(800)
  const [months, setMonths] = useState(2)
  const [businessType, setBusinessType] = useState<BusinessType>('CAFE')
  const [listings, setListings] = useState<SpaceCardData[] | null>(null)
  const [loading, setLoading] = useState(false)

  const pkg = packages.find((p) => p.businessType === businessType) ?? null
  const budget = budgetMan * 10_000

  const plan = useMemo(() => {
    const equipMonthly = pkg?.requiredMonthly ?? 0
    const remaining = budget - equipMonthly * months - ADDON_ASSUMPTION
    // R*(월수*(1+관리비율)) + 보증금(=R 1개월분) ≤ remaining
    const divisor = months * (1 + MAINTENANCE_RATE) + 1
    const affordableRent = Math.floor(remaining / divisor / 10_000) * 10_000
    return {
      equipMonthly,
      equipTotal: equipMonthly * months,
      addon: ADDON_ASSUMPTION,
      affordableRent,
      feasible: affordableRent >= 300_000,
    }
  }, [budget, months, pkg])

  useEffect(() => {
    if (!plan.feasible) {
      setListings([])
      return
    }
    let cancelled = false
    setLoading(true)
    const sp = new URLSearchParams({
      maxPrice: String(plan.affordableRent),
      businessType,
      duration: String(months),
    })
    fetch(`/api/listings?${sp.toString()}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (!cancelled) setListings(data)
      })
      .catch(() => {
        if (!cancelled) setListings([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [plan.affordableRent, plan.feasible, businessType, months])

  const sampleFull = plan.feasible
    ? fullStartupCost({ area: 12, monthlyRent: plan.affordableRent, businessType })
    : null

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className="lg:sticky lg:top-20 lg:h-fit">
        <div className="vs-card p-5">
          <h2 className="vs-section-title">내 조건</h2>

          <div className="mt-4">
            <label className="vs-label" htmlFor="calc-budget">
              쓸 수 있는 총 예산
            </label>
            <div className="flex items-center gap-2">
              <input
                id="calc-budget"
                type="number"
                min={100}
                max={5000}
                step={50}
                inputMode="numeric"
                className="vs-input"
                value={budgetMan}
                onChange={(e) => setBudgetMan(Math.max(0, Number(e.target.value)))}
              />
              <span className="shrink-0 text-[14px] font-semibold">만 원</span>
            </div>
            <input
              type="range"
              aria-label="예산 슬라이더"
              min={200}
              max={3000}
              step={50}
              value={Math.min(3000, budgetMan)}
              onChange={(e) => setBudgetMan(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--brand)]"
            />
          </div>

          <fieldset className="mt-5">
            <legend className="vs-label">해보고 싶은 기간</legend>
            <div className="flex flex-wrap gap-1.5">
              {MONTH_OPTIONS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={months === m}
                  onClick={() => setMonths(m)}
                  className={`vs-btn !px-3 !py-1.5 !text-[13px] ${
                    months === m ? 'vs-btn-primary' : 'vs-btn-secondary'
                  }`}
                >
                  {m}개월
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="vs-label">하려는 업종</legend>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={businessType === t}
                  onClick={() => setBusinessType(t)}
                  className={`vs-btn !px-3 !py-1.5 !text-[13px] ${
                    businessType === t ? 'vs-btn-primary' : 'vs-btn-secondary'
                  }`}
                >
                  {businessTypeLabel(t)}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <div className="min-w-0 space-y-6">
        <div className="vs-card p-6" aria-live="polite">
          {plan.feasible ? (
            <>
              <p className="text-[13px] text-[var(--ink-muted)]">
                예산 {manWon(budget)}으로 {months}개월 동안
              </p>
              <p className="mt-1 text-[26px] font-bold leading-tight">
                월 이용료 <span className="text-[var(--brand)]">{won(plan.affordableRent)}</span> 이하의
                공간이면
                <br />
                {businessTypeLabel(businessType)}를 열어볼 수 있어요
              </p>

              <dl className="mt-5 grid gap-3 sm:grid-cols-2">
                <Tile label={`장비 렌탈 ${months}개월`} value={won(plan.equipTotal)} sub={pkg?.name ?? '장비 없음'} />
                <Tile label="부가 옵션 (가정)" value={won(plan.addon)} sub="간판·인허가·보험·청소" />
                <Tile label="보증금 (반환)" value={won(plan.affordableRent)} sub="월 이용료 1개월분 가정" />
                <Tile
                  label={`공간 이용료 ${months}개월`}
                  value={won(Math.round(plan.affordableRent * months * (1 + MAINTENANCE_RATE)))}
                  sub="관리비 포함 가정"
                />
              </dl>

              {sampleFull && (
                <div className="mt-5 rounded-[12px] bg-[var(--ok-soft)] p-4">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-semibold text-[var(--ok)]">
                      같은 조건으로 정식 창업했다면
                    </p>
                    <span className="vs-badge vs-badge-warn">가정 기준</span>
                  </div>
                  <p className="mt-1 text-[20px] font-bold text-[var(--ok)]">
                    {manWon(sampleFull.total)}가 필요합니다
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-[20px] font-bold">이 예산으로는 조금 빠듯해요</p>
              <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-muted)]">
                {businessTypeLabel(businessType)} 장비만 {months}개월에 {won(plan.equipTotal)},
                부가 옵션이 {won(plan.addon)} 정도 듭니다.
                <br />
                기간을 줄이거나, 장비가 적게 드는 업종부터 시작해 보는 것을 권합니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="vs-btn vs-btn-secondary !text-[13px]"
                  onClick={() => setMonths(1)}
                >
                  1개월로 줄이기
                </button>
                <button
                  type="button"
                  className="vs-btn vs-btn-secondary !text-[13px]"
                  onClick={() => setBusinessType('STUDY')}
                >
                  스터디·모임으로 바꾸기
                </button>
              </div>
            </>
          )}
        </div>

        <div>
          <h2 className="text-[20px] font-bold tracking-tight">
            지금 예산으로 가능한 공간{' '}
            {listings && !loading && (
              <span className="text-[var(--brand)]">{listings.length}곳</span>
            )}
          </h2>

          {loading || listings === null ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <SpaceCardSkeleton key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="vs-card mt-4 p-8 text-center">
              <p className="text-[15px] font-semibold">조건에 맞는 공간이 아직 없어요</p>
              <p className="mt-2 text-[13px] text-[var(--ink-muted)]">
                예산을 조금 올리거나 기간을 줄이면 결과가 나타납니다.
              </p>
              <Link href="/spaces" className="vs-btn vs-btn-secondary mt-4">
                전체 공간 보기
              </Link>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {listings.slice(0, 6).map((l, i) => (
                <SpaceCard key={l.id} listing={l} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[12px] bg-[var(--surface-alt)] p-4">
      <dt className="text-[12px] text-[var(--ink-muted)]">{label}</dt>
      <dd className="mt-0.5 text-[18px] font-bold">{value}</dd>
      <p className="text-[11px] text-[var(--ink-muted)]">{sub}</p>
    </div>
  )
}
