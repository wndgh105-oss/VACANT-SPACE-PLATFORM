'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ApplicationStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'
import { summarizeRecentApplications } from '@/lib/applicationSummary'

type Application = { id: string; applicantName: string; status: ApplicationStatus; createdAt: string }
type ListingDetail = { id: string; address: string; monthlyRent: number; status: 'OPEN' | 'CLOSED' }

export default function LandlordListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    fetch(`/api/listings/${params.id}`).then((res) => res.json()).then(setListing)
    fetch(`/api/applications?listingId=${params.id}`).then((res) => res.json()).then(setApplications)
  }, [params.id])

  if (!listing) return <p className="p-4">불러오는 중...</p>

  const recent = summarizeRecentApplications(applications, 3)

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{listing.address}</h1>
        <StatusBadge kind="listing" status={listing.status} />
      </div>
      <p className="mb-4">월 {listing.monthlyRent.toLocaleString()}원</p>
      <Link href={`/landlord/listings/${listing.id}/edit`} className="rounded border px-3 py-2">
        수정하기
      </Link>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">최근 신청</h2>
          <Link href={`/landlord/listings/${listing.id}/applications`} className="text-sm underline">
            전체 신청 보기
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">아직 들어온 신청이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((app) => (
              <li key={app.id} className="flex items-center justify-between rounded border p-2">
                <span>{app.applicantName}</span>
                <StatusBadge kind="application" status={app.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
