'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListingForm, ListingFormData } from '@/components/ListingForm'

export default function NewListingPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(data: ListingFormData) {
    setError(null)
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      setError('공실 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    const listing = await res.json()
    router.push(`/landlord/listings/${listing.id}`)
  }

  return (
    <div className="vs-container max-w-2xl py-8">
      <h1 className="text-[26px] font-bold tracking-tight">공실 등록</h1>
      <p className="mb-6 mt-2 text-[14px] leading-relaxed text-[var(--ink-muted)]">
        등록 후 바로 노출되지 않고, <strong className="text-[var(--ink)]">운영자 현장 실사 승인 후</strong>{' '}
        검색 결과에 나타납니다. 실사 진행 상황은 이 대시보드에서 확인할 수 있습니다.
      </p>
      {error && (
        <p role="alert" className="mb-4 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      )}
      <ListingForm onSubmit={handleSubmit} />
    </div>
  )
}
