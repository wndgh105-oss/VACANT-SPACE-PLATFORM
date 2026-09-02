'use client'

import { useEffect, useState } from 'react'
import { FilterBar, Filters } from '@/components/FilterBar'
import { RecommendWidget } from '@/components/RecommendWidget'
import { ListingCard, ListingCardData } from '@/components/ListingCard'

function buildQuery(filters: Filters) {
  const params = new URLSearchParams()
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.businessType) params.set('businessType', filters.businessType)
  if (filters.duration) params.set('duration', String(filters.duration))
  return params.toString()
}

export default function TenantHomePage() {
  const [filters, setFilters] = useState<Filters>({})
  const [showWidget, setShowWidget] = useState(true)
  const [listings, setListings] = useState<ListingCardData[]>([])

  useEffect(() => {
    fetch(`/api/listings?${buildQuery(filters)}`)
      .then((res) => res.json())
      .then(setListings)
  }, [filters])

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-bold">가볍게 시작하는 창업, 공실을 찾아보세요</h1>
      {showWidget && (
        <div className="mb-4">
          <RecommendWidget
            onComplete={(answers) => {
              setFilters(answers)
              setShowWidget(false)
            }}
            onSkip={() => setShowWidget(false)}
          />
        </div>
      )}
      <FilterBar value={filters} onChange={setFilters} />
      {listings.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">조건에 맞는 공실이 없어요. 필터를 완화해보세요.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  )
}
