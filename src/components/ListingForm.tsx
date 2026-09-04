'use client'

import { useState } from 'react'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'

export type ListingFormData = {
  title: string
  address: string
  region: string
  lat: number | null
  lng: number | null
  area: number
  monthlyRent: number
  deposit: number
  maintenanceFee: number
  photos: string[]
  contractDurations: number[]
  businessTypes: BusinessType[]
  parking: boolean
  powerKw: number
  hasGas: boolean
  hasDrain: boolean
  immediateMoveIn: boolean
  description: string
}

const ALL_DURATIONS = [1, 2, 3, 6]
const ALL_BUSINESS_TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OFFICE', 'STUDY', 'OTHER']
const REGIONS = ['성수동', '연남동', '망원동', '을지로', '상수동', '문래동', '해방촌', '창신동', '합정동']

export function ListingForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<ListingFormData>
  onSubmit: (data: ListingFormData) => void
}) {
  const [form, setForm] = useState<ListingFormData>({
    title: initial?.title ?? '',
    address: initial?.address ?? '',
    region: initial?.region ?? REGIONS[0],
    lat: initial?.lat ?? null,
    lng: initial?.lng ?? null,
    area: initial?.area ?? 0,
    monthlyRent: initial?.monthlyRent ?? 0,
    deposit: initial?.deposit ?? 0,
    maintenanceFee: initial?.maintenanceFee ?? 0,
    photos: initial?.photos ?? [],
    contractDurations: initial?.contractDurations ?? [],
    businessTypes: initial?.businessTypes ?? [],
    parking: initial?.parking ?? false,
    powerKw: initial?.powerKw ?? 0,
    hasGas: initial?.hasGas ?? false,
    hasDrain: initial?.hasDrain ?? false,
    immediateMoveIn: initial?.immediateMoveIn ?? false,
    description: initial?.description ?? '',
  })
  const [uploadError, setUploadError] = useState<string | null>(null)

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    const data = new FormData()
    data.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: data })
    if (!res.ok) {
      setUploadError('사진 업로드에 실패했습니다. 다시 시도해 주세요.')
      return
    }
    const { url } = await res.json()
    setForm((f) => ({ ...f, photos: [...f.photos, url] }))
  }

  function toggleDuration(d: number) {
    setForm((f) => ({
      ...f,
      contractDurations: f.contractDurations.includes(d)
        ? f.contractDurations.filter((x) => x !== d)
        : [...f.contractDurations, d],
    }))
  }

  function toggleBusinessType(t: BusinessType) {
    setForm((f) => ({
      ...f,
      businessTypes: f.businessTypes.includes(t)
        ? f.businessTypes.filter((x) => x !== t)
        : [...f.businessTypes, t],
    }))
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
    >
      <section className="vs-card space-y-4 p-5">
        <h2 className="vs-section-title">기본 정보</h2>

        <div>
          <label className="vs-label" htmlFor="lf-title">
            공간 이름
          </label>
          <input
            id="lf-title"
            className="vs-input"
            placeholder="예: 연무장길 코너 1층 · 통유리 카페 자리"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="vs-label" htmlFor="lf-address">
            주소
          </label>
          <input
            id="lf-address"
            className="vs-input"
            placeholder="서울 성동구 성수동2가 ..."
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="vs-label" htmlFor="lf-region">
            지역 (검색 필터에 사용됩니다)
          </label>
          <select
            id="lf-region"
            className="vs-select"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="vs-label" htmlFor="lf-lat">
              위도 (지도 표시용)
            </label>
            <input
              id="lf-lat"
              className="vs-input"
              type="number"
              step="0.0001"
              placeholder="예: 37.5445"
              value={form.lat ?? ''}
              onChange={(e) => setForm({ ...form, lat: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div>
            <label className="vs-label" htmlFor="lf-lng">
              경도 (지도 표시용)
            </label>
            <input
              id="lf-lng"
              className="vs-input"
              type="number"
              step="0.0001"
              placeholder="예: 127.0557"
              value={form.lng ?? ''}
              onChange={(e) => setForm({ ...form, lng: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
        </div>
        <p className="text-[12px] text-[var(--ink-muted)]">
          비워두면 지도 보기에서 이 공간은 표시되지 않고 목록에서만 보입니다.
        </p>

        <div>
          <label className="vs-label" htmlFor="lf-desc">
            소개
          </label>
          <textarea
            id="lf-desc"
            className="vs-textarea"
            rows={3}
            placeholder="공간의 특징을 간단히 적어주세요."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </section>

      <section className="vs-card space-y-4 p-5">
        <h2 className="vs-section-title">면적과 비용</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="vs-label" htmlFor="lf-area">
              면적(평)
            </label>
            <input
              id="lf-area"
              className="vs-input"
              type="number"
              min={0}
              value={form.area || ''}
              onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="vs-label" htmlFor="lf-power">
              전기 용량(kW)
            </label>
            <input
              id="lf-power"
              className="vs-input"
              type="number"
              min={0}
              value={form.powerKw || ''}
              onChange={(e) => setForm({ ...form, powerKw: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="vs-label" htmlFor="lf-rent">
              월 이용료(원)
            </label>
            <input
              id="lf-rent"
              className="vs-input"
              type="number"
              min={0}
              value={form.monthlyRent || ''}
              onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="vs-label" htmlFor="lf-deposit">
              보증금(원)
            </label>
            <input
              id="lf-deposit"
              className="vs-input"
              type="number"
              min={0}
              value={form.deposit || ''}
              onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
              required
            />
          </div>
          <div>
            <label className="vs-label" htmlFor="lf-maintenance">
              관리비(원/월)
            </label>
            <input
              id="lf-maintenance"
              className="vs-input"
              type="number"
              min={0}
              value={form.maintenanceFee || ''}
              onChange={(e) => setForm({ ...form, maintenanceFee: Number(e.target.value) })}
            />
          </div>
        </div>
      </section>

      <section className="vs-card space-y-4 p-5">
        <h2 className="vs-section-title">사진</h2>
        <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        {uploadError && <p className="text-[13px] text-[var(--danger)]">{uploadError}</p>}
        {form.photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="공실 사진" className="h-16 w-16 rounded-[10px] object-cover" />
            ))}
          </div>
        )}
      </section>

      <section className="vs-card space-y-4 p-5">
        <h2 className="vs-section-title">계약·업종·설비</h2>

        <fieldset>
          <legend className="vs-label">계약 가능 기간</legend>
          <div className="flex flex-wrap gap-1.5">
            {ALL_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={form.contractDurations.includes(d)}
                onClick={() => toggleDuration(d)}
                className={`vs-btn !px-3 !py-1.5 !text-[13px] ${
                  form.contractDurations.includes(d) ? 'vs-btn-primary' : 'vs-btn-secondary'
                }`}
              >
                {d}개월
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="vs-label">가능한 업종 (선택 시 표준 장비 패키지가 함께 제공됩니다)</legend>
          <div className="flex flex-wrap gap-1.5">
            {ALL_BUSINESS_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={form.businessTypes.includes(t)}
                onClick={() => toggleBusinessType(t)}
                className={`vs-btn !px-3 !py-1.5 !text-[13px] ${
                  form.businessTypes.includes(t) ? 'vs-btn-primary' : 'vs-btn-secondary'
                }`}
              >
                {businessTypeLabel(t)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="vs-label">설비·조건</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--brand)]"
                checked={form.parking}
                onChange={(e) => setForm({ ...form, parking: e.target.checked })}
              />
              주차 가능
            </label>
            <label className="flex items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--brand)]"
                checked={form.hasGas}
                onChange={(e) => setForm({ ...form, hasGas: e.target.checked })}
              />
              가스 있음
            </label>
            <label className="flex items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--brand)]"
                checked={form.hasDrain}
                onChange={(e) => setForm({ ...form, hasDrain: e.target.checked })}
              />
              배수 있음
            </label>
            <label className="flex items-center gap-2 text-[14px]">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[var(--brand)]"
                checked={form.immediateMoveIn}
                onChange={(e) => setForm({ ...form, immediateMoveIn: e.target.checked })}
              />
              즉시 입주 가능
            </label>
          </div>
        </fieldset>
      </section>

      <button type="submit" className="vs-btn vs-btn-primary w-full !py-3">
        저장
      </button>
    </form>
  )
}
