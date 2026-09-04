'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListingForm, ListingFormData } from '@/components/ListingForm'

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [initial, setInitial] = useState<ListingFormData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((res) => res.json())
      .then(setInitial)
  }, [params.id])

  async function handleSubmit(data: ListingFormData) {
    setError(null)
    const res = await fetch(`/api/listings/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      setError('공실 수정에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    router.push(`/landlord/listings/${params.id}`)
  }

  return (
    <div className="vs-container max-w-2xl py-8">
      <h1 className="text-[26px] font-bold tracking-tight">공실 수정</h1>
      {error && (
        <p role="alert" className="mb-4 mt-4 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      )}
      {!initial ? (
        <div className="mt-6 space-y-3">
          <div className="vs-skeleton h-40 w-full" />
          <div className="vs-skeleton h-40 w-full" />
        </div>
      ) : (
        <div className="mt-6">
          <ListingForm initial={initial} onSubmit={handleSubmit} />
        </div>
      )}
    </div>
  )
}
