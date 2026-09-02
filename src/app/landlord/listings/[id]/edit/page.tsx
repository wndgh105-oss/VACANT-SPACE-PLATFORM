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

  if (!initial) return <p className="p-4">불러오는 중...</p>

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-xl font-bold">공실 수정</h1>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      <ListingForm initial={initial} onSubmit={handleSubmit} />
    </main>
  )
}
