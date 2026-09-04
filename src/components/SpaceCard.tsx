import Link from 'next/link'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'
import { manWon, won } from '@/lib/quote'

export type SpaceCardData = {
  id: string
  title: string | null
  address: string
  region: string | null
  area: number
  monthlyRent: number
  deposit: number
  maintenanceFee: number
  businessTypes: BusinessType[]
  contractDurations: number[]
  immediateMoveIn: boolean
  parking: boolean
  hasGas: boolean
  hasDrain: boolean
  photos: string[]
}

/** 카드에 표시할 "2개월 기준 총 예상 비용" (보증금 제외) */
export function twoMonthEstimate(l: Pick<SpaceCardData, 'monthlyRent' | 'maintenanceFee'>): number {
  return (l.monthlyRent + l.maintenanceFee) * 2
}

export function SpaceCard({
  listing,
  index = 0,
  highlighted = false,
}: {
  listing: SpaceCardData
  index?: number
  highlighted?: boolean
}) {
  const shortest = listing.contractDurations.length
    ? Math.min(...listing.contractDurations)
    : null

  return (
    <Link
      href={`/spaces/${listing.id}`}
      className="vs-card vs-rise group block overflow-hidden transition-transform hover:-translate-y-[2px]"
      style={{
        animationDelay: `${Math.min(index, 8) * 40}ms`,
        borderColor: highlighted ? 'var(--brand)' : undefined,
      }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--surface-alt)]">
        {listing.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.photos[0]}
            alt={`${listing.title ?? listing.address} 공간 이미지 (예시)`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[13px] text-[var(--ink-muted)]">
            사진 준비 중인 공간
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1">
          {listing.immediateMoveIn && <span className="vs-badge vs-badge-brand">즉시 입주</span>}
          {shortest !== null && <span className="vs-badge">최소 {shortest}개월</span>}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start gap-2">
          <h3 className="flex-1 text-[15px] font-bold leading-snug">
            {listing.title ?? listing.address}
          </h3>
        </div>
        <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
          {listing.region ? `${listing.region} · ` : ''}
          {listing.area}평
        </p>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-[19px] font-bold text-[var(--brand)]">
            월 {manWon(listing.monthlyRent)}
          </span>
          <span className="text-[12px] text-[var(--ink-muted)]">
            보증금 {manWon(listing.deposit)}
          </span>
        </div>
        <p className="mt-1 text-[12px] text-[var(--ink-muted)]">
          2개월 기준 약 {won(twoMonthEstimate(listing))} (관리비 포함, 보증금 별도)
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {listing.businessTypes.slice(0, 3).map((t) => (
            <span key={t} className="vs-badge">
              {businessTypeLabel(t)}
            </span>
          ))}
          {listing.hasGas && <span className="vs-badge">가스</span>}
          {listing.hasDrain && <span className="vs-badge">배수</span>}
          {listing.parking && <span className="vs-badge">주차</span>}
        </div>
      </div>
    </Link>
  )
}

export function SpaceCardSkeleton() {
  return (
    <div className="vs-card overflow-hidden" aria-hidden>
      <div className="vs-skeleton aspect-[4/3] w-full !rounded-none" />
      <div className="space-y-2 p-4">
        <div className="vs-skeleton h-4 w-3/4" />
        <div className="vs-skeleton h-3 w-1/3" />
        <div className="vs-skeleton h-5 w-1/2" />
      </div>
    </div>
  )
}
