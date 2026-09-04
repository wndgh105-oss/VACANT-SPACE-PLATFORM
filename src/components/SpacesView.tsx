'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { BusinessType } from '@prisma/client'
import { SpaceCard, SpaceCardData } from '@/components/SpaceCard'
import { SpaceMap } from '@/components/SpaceMap'
import { businessTypeLabel } from '@/lib/labels'

export type SpacesViewListing = SpaceCardData & {
  lat: number | null
  lng: number | null
}

const REGIONS = ['성수동', '연남동', '망원동', '을지로', '상수동', '문래동', '해방촌', '창신동', '합정동']
const BUDGETS = [
  { label: '80만 원 이하', value: 800_000 },
  { label: '120만 원 이하', value: 1_200_000 },
  { label: '150만 원 이하', value: 1_500_000 },
  { label: '250만 원 이하', value: 2_500_000 },
]
const DURATIONS = [1, 2, 3, 6]
const TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OFFICE', 'STUDY']

type Facility = 'parking' | 'gas' | 'drain' | 'immediate'
const FACILITIES: Array<{ key: Facility; label: string }> = [
  { key: 'immediate', label: '즉시 입주' },
  { key: 'gas', label: '가스' },
  { key: 'drain', label: '배수' },
  { key: 'parking', label: '주차' },
]

export function SpacesView({
  listings,
  suggestions,
}: {
  listings: SpacesViewListing[]
  suggestions: string[]
}) {
  const router = useRouter()
  const params = useSearchParams()
  const [view, setView] = useState<'list' | 'map'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const current = useMemo(() => {
    return {
      region: params.get('region') ?? '',
      maxPrice: params.get('maxPrice') ?? '',
      duration: params.get('duration') ?? '',
      businessType: params.get('businessType') ?? '',
      parking: params.get('parking') === '1',
      gas: params.get('gas') === '1',
      drain: params.get('drain') === '1',
      immediate: params.get('immediate') === '1',
      maxDeposit: params.get('maxDeposit') ?? '',
      minArea: params.get('minArea') ?? '',
    }
  }, [params])

  const activeCount = useMemo(
    () => Object.values(current).filter((v) => v !== '' && v !== false).length,
    [current]
  )

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    router.push(`/spaces?${next.toString()}`, { scroll: false })
  }

  function toggleParam(key: string, value: string) {
    update({ [key]: current[key as keyof typeof current] === value ? null : value })
  }

  const selected = listings.find((l) => l.id === selectedId) ?? null

  const filterPanel = (
    <div className="space-y-5">
      <fieldset>
        <legend className="vs-label">지역</legend>
        <div className="flex flex-wrap gap-1.5">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={current.region === r}
              onClick={() => toggleParam('region', r)}
              className={`vs-btn !px-3 !py-1.5 !text-[13px] ${
                current.region === r ? 'vs-btn-primary' : 'vs-btn-secondary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="vs-label">월 예산</legend>
        <div className="flex flex-wrap gap-1.5">
          {BUDGETS.map((b) => (
            <button
              key={b.value}
              type="button"
              aria-pressed={current.maxPrice === String(b.value)}
              onClick={() => toggleParam('maxPrice', String(b.value))}
              className={`vs-btn !px-3 !py-1.5 !text-[13px] ${
                current.maxPrice === String(b.value) ? 'vs-btn-primary' : 'vs-btn-secondary'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="vs-label">계약 가능 기간</legend>
        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={current.duration === String(d)}
              onClick={() => toggleParam('duration', String(d))}
              className={`vs-btn !px-3 !py-1.5 !text-[13px] ${
                current.duration === String(d) ? 'vs-btn-primary' : 'vs-btn-secondary'
              }`}
            >
              {d}개월
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="vs-label">업종 가능 여부</legend>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={current.businessType === t}
              onClick={() => toggleParam('businessType', t)}
              className={`vs-btn !px-3 !py-1.5 !text-[13px] ${
                current.businessType === t ? 'vs-btn-primary' : 'vs-btn-secondary'
              }`}
            >
              {businessTypeLabel(t)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="vs-label">설비·조건</legend>
        <div className="flex flex-wrap gap-1.5">
          {FACILITIES.map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={current[f.key]}
              onClick={() => update({ [f.key]: current[f.key] ? null : '1' })}
              className={`vs-btn !px-3 !py-1.5 !text-[13px] ${
                current[f.key] ? 'vs-btn-primary' : 'vs-btn-secondary'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="vs-label" htmlFor="filter-deposit">
            보증금 상한 (만 원)
          </label>
          <input
            id="filter-deposit"
            className="vs-input"
            type="number"
            min={0}
            step={10}
            inputMode="numeric"
            placeholder="예: 200"
            value={current.maxDeposit ? String(Number(current.maxDeposit) / 10_000) : ''}
            onChange={(e) =>
              update({ maxDeposit: e.target.value ? String(Number(e.target.value) * 10_000) : null })
            }
          />
        </div>
        <div>
          <label className="vs-label" htmlFor="filter-area">
            최소 면적 (평)
          </label>
          <input
            id="filter-area"
            className="vs-input"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="예: 10"
            value={current.minArea}
            onChange={(e) => update({ minArea: e.target.value || null })}
          />
        </div>
      </div>

      {activeCount > 0 && (
        <button type="button" className="vs-btn vs-btn-ghost w-full" onClick={() => router.push('/spaces')}>
          필터 전체 해제 ({activeCount})
        </button>
      )}
    </div>
  )

  return (
    <div className="vs-container py-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight">공간 찾기</h1>
          <p aria-live="polite" className="mt-1 text-[14px] text-[var(--ink-muted)]">
            조건에 맞는 공간 <strong className="text-[var(--ink)]">{listings.length}곳</strong>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="vs-btn vs-btn-secondary lg:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            필터 {activeCount > 0 && <span className="vs-badge vs-badge-brand">{activeCount}</span>}
          </button>
          <div className="inline-flex overflow-hidden rounded-btn border border-[var(--line)]">
            <button
              type="button"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
              className={`px-4 py-2 text-[14px] font-semibold ${
                view === 'list' ? 'bg-[var(--brand)] text-white' : 'bg-[var(--surface)]'
              }`}
            >
              목록
            </button>
            <button
              type="button"
              aria-pressed={view === 'map'}
              onClick={() => setView('map')}
              className={`px-4 py-2 text-[14px] font-semibold ${
                view === 'map' ? 'bg-[var(--brand)] text-white' : 'bg-[var(--surface)]'
              }`}
            >
              지도
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="vs-card sticky top-20 p-4">{filterPanel}</div>
        </aside>

        <div className="min-w-0 flex-1">
          {listings.length === 0 ? (
            <div className="vs-card p-10 text-center">
              <p className="text-[17px] font-bold">조건에 맞는 공간이 아직 없어요</p>
              <p className="mt-2 text-[14px] text-[var(--ink-muted)]">
                조건을 조금만 풀면 더 많은 공간을 볼 수 있어요.
              </p>
              {suggestions.length > 0 && (
                <ul className="mt-4 flex flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <li key={s} className="vs-badge">
                      {s}
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="vs-btn vs-btn-primary mt-6"
                onClick={() => router.push('/spaces')}
              >
                전체 공간 보기
              </button>
            </div>
          ) : view === 'map' ? (
            <div className="space-y-4">
              <SpaceMap points={listings} selectedId={selectedId} onSelect={setSelectedId} />
              {selected ? (
                <div className="vs-fade">
                  <p className="mb-2 text-[13px] font-semibold text-[var(--ink-muted)]">선택한 공간</p>
                  <div className="max-w-sm">
                    <SpaceCard listing={selected} highlighted />
                  </div>
                </div>
              ) : (
                <p className="text-center text-[13px] text-[var(--ink-muted)]">
                  지도의 가격 핀을 선택하면 공간 정보가 나타납니다.
                </p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((l, i) => (
                <SpaceCard key={l.id} listing={l} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden" role="dialog" aria-modal="true" aria-label="필터">
          <button
            type="button"
            aria-label="필터 닫기"
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="vs-rise relative max-h-[80vh] w-full overflow-y-auto rounded-t-[20px] bg-[var(--surface)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[18px] font-bold">필터</h2>
              <button type="button" className="vs-btn vs-btn-ghost" onClick={() => setFiltersOpen(false)}>
                닫기
              </button>
            </div>
            {filterPanel}
            <button
              type="button"
              className="vs-btn vs-btn-primary mt-5 w-full"
              onClick={() => setFiltersOpen(false)}
            >
              공간 {listings.length}곳 보기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
