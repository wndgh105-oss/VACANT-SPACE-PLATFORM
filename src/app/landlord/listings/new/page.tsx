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
    <main className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-xl font-bold">공실 등록</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <ListingForm onSubmit={handleSubmit} />
    </main>
  )
}
