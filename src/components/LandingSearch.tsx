'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'

const REGIONS = ['성수동', '연남동', '망원동', '을지로', '상수동', '문래동', '해방촌', '창신동']
const TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OFFICE', 'STUDY']

/** 랜딩 히어로의 퀵 검색 — /spaces 필터로 그대로 넘긴다. */
export function LandingSearch() {
  const router = useRouter()
  const [region, setRegion] = useState('성수동')
  const [duration, setDuration] = useState('2')
  const [maxPrice, setMaxPrice] = useState('1500000')
  const [businessType, setBusinessType] = useState<BusinessType>('CAFE')

  function search(e: React.FormEvent) {
    e.preventDefault()
    const sp = new URLSearchParams()
    if (region) sp.set('region', region)
    if (duration) sp.set('duration', duration)
    if (maxPrice) sp.set('maxPrice', maxPrice)
    if (businessType) sp.set('businessType', businessType)
    router.push(`/spaces?${sp.toString()}`)
  }

  return (
    <form onSubmit={search} className="vs-card p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="vs-label" htmlFor="ls-region">
            지역
          </label>
          <select
            id="ls-region"
            className="vs-select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          >
            <option value="">전체</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="vs-label" htmlFor="ls-duration">
            이용 기간
          </label>
          <select
            id="ls-duration"
            className="vs-select"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          >
            <option value="">전체</option>
            {[1, 2, 3, 6].map((d) => (
              <option key={d} value={d}>
                {d}개월
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="vs-label" htmlFor="ls-budget">
            월 예산
          </label>
          <select
            id="ls-budget"
            className="vs-select"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          >
            <option value="">전체</option>
            <option value="800000">80만 원 이하</option>
            <option value="1200000">120만 원 이하</option>
            <option value="1500000">150만 원 이하</option>
            <option value="2500000">250만 원 이하</option>
          </select>
        </div>
        <div>
          <label className="vs-label" htmlFor="ls-type">
            하려는 업종
          </label>
          <select
            id="ls-type"
            className="vs-select"
            value={businessType}
            onChange={(e) => setBusinessType(e.target.value as BusinessType)}
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {businessTypeLabel(t)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="vs-btn vs-btn-primary mt-3 w-full !py-3 !text-[16px]">
        조건에 맞는 공간 찾기
      </button>
    </form>
  )
}
