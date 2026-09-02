'use client'

import { useState } from 'react'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'
import { Filters } from '@/components/FilterBar'

const BUDGETS = [{ label: '~500,000원', maxPrice: 500000 }, { label: '~1,000,000원', maxPrice: 1000000 }]
const BUSINESS_TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OTHER']
const TIMINGS = ['즉시', '1개월 내', '미정']

export function RecommendWidget({
  onComplete,
  onSkip,
}: {
  onComplete: (filters: Filters) => void
  onSkip: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [answers, setAnswers] = useState<Filters>({})

  return (
    <div className="rounded border p-4">
      <div className="mb-2 flex justify-between">
        <p className="font-medium">추천 위젯 ({step}/3)</p>
        <button type="button" className="text-sm text-gray-500" onClick={onSkip}>
          건너뛰기
        </button>
      </div>

      {step === 1 && (
        <div className="flex gap-2">
          {BUDGETS.map((b) => (
            <button
              key={b.label}
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => {
                setAnswers({ ...answers, maxPrice: b.maxPrice })
                setStep(2)
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex gap-2">
          {BUSINESS_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => {
                setAnswers({ ...answers, businessType: t })
                setStep(3)
              }}
            >
              {businessTypeLabel(t)}
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="flex gap-2">
          {TIMINGS.map((label) => (
            <button
              key={label}
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => onComplete(answers)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
