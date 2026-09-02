'use client'

import { useState } from 'react'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'

export type ListingFormData = {
  address: string
  area: number
  monthlyRent: number
  deposit: number
  photos: string[]
  contractDurations: number[]
  businessTypes: BusinessType[]
}

const ALL_DURATIONS = [2, 4, 6]
const ALL_BUSINESS_TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OTHER']

export function ListingForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<ListingFormData>
  onSubmit: (data: ListingFormData) => void
}) {
  const [form, setForm] = useState<ListingFormData>({
    address: initial?.address ?? '',
    area: initial?.area ?? 0,
    monthlyRent: initial?.monthlyRent ?? 0,
    deposit: initial?.deposit ?? 0,
    photos: initial?.photos ?? [],
    contractDurations: initial?.contractDurations ?? [],
    businessTypes: initial?.businessTypes ?? [],
  })

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const data = new FormData()
    data.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: data })
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
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
    >
      <input
        className="w-full rounded border p-2"
        placeholder="주소"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        type="number"
        placeholder="면적(㎡)"
        value={form.area || ''}
        onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
      />
      <input
        className="w-full rounded border p-2"
        type="number"
        placeholder="월 임대료"
        value={form.monthlyRent || ''}
        onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
      />
      <input
        className="w-full rounded border p-2"
        type="number"
        placeholder="보증금"
        value={form.deposit || ''}
        onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
      />

      <div>
        <p className="mb-1 text-sm text-gray-500">사진</p>
        <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        <div className="mt-2 flex gap-2">
          {form.photos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="공실 사진" className="h-16 w-16 rounded object-cover" />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm text-gray-500">계약 가능 기간</p>
        {ALL_DURATIONS.map((d) => (
          <label key={d} className="mr-3">
            <input type="checkbox" checked={form.contractDurations.includes(d)} onChange={() => toggleDuration(d)} />{' '}
            {d}개월
          </label>
        ))}
      </div>

      <div>
        <p className="mb-1 text-sm text-gray-500">가능한 업종 (선택 시 표준 장비 패키지가 함께 제공됩니다)</p>
        {ALL_BUSINESS_TYPES.map((t) => (
          <label key={t} className="mr-3">
            <input type="checkbox" checked={form.businessTypes.includes(t)} onChange={() => toggleBusinessType(t)} />{' '}
            {businessTypeLabel(t)}
          </label>
        ))}
      </div>

      <button className="w-full rounded bg-black p-2 text-white" type="submit">
        저장
      </button>
    </form>
  )
}
