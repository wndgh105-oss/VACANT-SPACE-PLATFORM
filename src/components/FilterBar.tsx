import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'

export type Filters = {
  minPrice?: number
  maxPrice?: number
  businessType?: BusinessType
  duration?: number
}

const BUSINESS_TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OTHER']
const DURATIONS = [2, 4, 6]

export function FilterBar({ value, onChange }: { value: Filters; onChange: (next: Filters) => void }) {
  return (
    <div className="flex flex-wrap gap-4 border-b p-4">
      <div>
        <p className="mb-1 text-sm text-gray-500">가격대</p>
        <div className="flex gap-1">
          {[500000, 1000000, 2000000].map((p) => (
            <button
              key={p}
              type="button"
              className={`rounded border px-2 py-1 text-sm ${value.maxPrice === p ? 'bg-black text-white' : ''}`}
              onClick={() => onChange({ ...value, maxPrice: p })}
            >
              ~{p.toLocaleString()}원
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-sm text-gray-500">업종</p>
        <div className="flex gap-1">
          {BUSINESS_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded border px-2 py-1 text-sm ${value.businessType === t ? 'bg-black text-white' : ''}`}
              onClick={() => onChange({ ...value, businessType: t })}
            >
              {businessTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-sm text-gray-500">계약기간</p>
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`rounded border px-2 py-1 text-sm ${value.duration === d ? 'bg-black text-white' : ''}`}
              onClick={() => onChange({ ...value, duration: d })}
            >
              {d}개월
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
