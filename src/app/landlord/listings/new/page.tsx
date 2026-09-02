'use client'

import { useRouter } from 'next/navigation'
import { ListingForm, ListingFormData } from '@/components/ListingForm'

export default function NewListingPage() {
  const router = useRouter()

  async function handleSubmit(data: ListingFormData) {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const listing = await res.json()
    router.push(`/landlord/listings/${listing.id}`)
  }

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-xl font-bold">공실 등록</h1>
      <ListingForm onSubmit={handleSubmit} />
    </main>
  )
}
