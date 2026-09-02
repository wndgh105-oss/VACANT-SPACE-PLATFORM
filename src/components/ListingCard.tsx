import Link from 'next/link'
import { BusinessType, ListingStatus } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'
import { StatusBadge } from '@/components/StatusBadge'

export type ListingCardData = {
  id: string
  address: string
  monthlyRent: number
  businessTypes: BusinessType[]
  status: ListingStatus
  photos: string[]
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link href={`/tenant/listings/${listing.id}`} className="block rounded border p-3 hover:shadow">
      <div className="mb-2 h-32 w-full rounded bg-gray-100">
        {listing.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photos[0]} alt={listing.address} className="h-full w-full rounded object-cover" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="font-medium">{listing.address}</p>
        <StatusBadge kind="listing" status={listing.status} />
      </div>
      <p className="text-sm text-gray-600">월 {listing.monthlyRent.toLocaleString()}원</p>
      <div className="mt-1 flex gap-1">
        {listing.businessTypes.map((t) => (
          <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
            {businessTypeLabel(t)}
          </span>
        ))}
      </div>
    </Link>
  )
}
