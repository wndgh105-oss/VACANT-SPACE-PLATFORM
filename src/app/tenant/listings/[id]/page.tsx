'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BusinessType, ListingStatus } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'
import { StatusBadge } from '@/components/StatusBadge'

type ListingDetail = {
  id: string
  address: string
  area: number
  monthlyRent: number
  deposit: number
  photos: string[]
  contractDurations: number[]
  businessTypes: BusinessType[]
  status: ListingStatus
  equipmentPackages: { id: string; name: string; items: string[]; monthlyFee: number }[]
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<ListingDetail | null>(null)

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((res) => res.json())
      .then(setListing)
  }, [params.id])

  if (!listing) return <p className="p-4">불러오는 중...</p>

  return (
    <main className="mx-auto max-w-3xl p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{listing.address}</h1>
        <StatusBadge kind="listing" status={listing.status} />
      </div>
      <p>면적 {listing.area}㎡ · 월 {listing.monthlyRent.toLocaleString()}원 · 보증금 {listing.deposit.toLocaleString()}원</p>
      <p className="mt-1 text-sm text-gray-600">
        계약 가능 기간: {listing.contractDurations.map((d) => `${d}개월`).join(', ')}
      </p>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">업종별 장비 패키지</h2>
        {listing.equipmentPackages.length === 0 ? (
          <p className="text-sm text-gray-500">이 업종은 장비 패키지 준비 중, 공실만 임대 가능합니다.</p>
        ) : (
          listing.equipmentPackages.map((pkg) => (
            <div key={pkg.id} className="mb-2 rounded border p-3">
              <p className="font-medium">{pkg.name}</p>
              <p className="text-sm text-gray-600">{pkg.items.join(', ')}</p>
              <p className="text-sm">월 {pkg.monthlyFee.toLocaleString()}원</p>
            </div>
          ))
        )}
      </section>

      <div className="mt-2 flex flex-wrap gap-1">
        {listing.businessTypes.map((t) => (
          <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
            {businessTypeLabel(t)}
          </span>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
        {listing.status === 'CLOSED' ? (
          <button className="w-full rounded bg-gray-300 p-3 text-gray-600" disabled>
            마감된 공실입니다
          </button>
        ) : (
          <Link
            href={`/tenant/listings/${listing.id}/apply`}
            className="block w-full rounded bg-black p-3 text-center text-white"
          >
            신청하기
          </Link>
        )}
      </div>
    </main>
  )
}
