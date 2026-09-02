'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BusinessType, ListingStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'

type LandlordListing = {
  id: string
  address: string
  monthlyRent: number
  status: ListingStatus
  businessTypes: BusinessType[]
  _count: { applications: number }
}

export default function LandlordDashboardPage() {
  const [listings, setListings] = useState<LandlordListing[]>([])

  useEffect(() => {
    fetch('/api/landlord/listings')
      .then((res) => res.json())
      .then(setListings)
  }, [])

  return (
    <main className="mx-auto max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">내 공실 대시보드</h1>
        <Link href="/landlord/listings/new" className="rounded bg-black px-3 py-2 text-white">
          + 새 공실 등록
        </Link>
      </div>
      {listings.length === 0 ? (
        <p className="text-gray-500">첫 공실을 등록해보세요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/landlord/listings/${listing.id}`} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{listing.address}</p>
                <StatusBadge kind="listing" status={listing.status} />
              </div>
              <p className="text-sm text-gray-600">월 {listing.monthlyRent.toLocaleString()}원</p>
              <p className="mt-1 text-sm">신청 {listing._count.applications}건</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
