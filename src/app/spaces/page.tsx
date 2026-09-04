import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { buildListingWhere, parseListingFilters, relaxationSuggestions } from '@/lib/listingFilters'
import { SpacesView } from '@/components/SpacesView'
import { SpaceCardSkeleton } from '@/components/SpaceCard'
import { listingCardSelect } from '@/lib/listingSelect'

export const dynamic = 'force-dynamic'

function toSearchParams(input: Record<string, string | string[] | undefined>): URLSearchParams {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(input)) {
    if (typeof v === 'string') sp.set(k, v)
    else if (Array.isArray(v) && v[0]) sp.set(k, v[0])
  }
  return sp
}

export default async function SpacesPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const filters = parseListingFilters(toSearchParams(searchParams))
  const listings = await prisma.listing.findMany({
    where: buildListingWhere(filters),
    orderBy: { createdAt: 'desc' },
    select: listingCardSelect,
  })

  return (
    <Suspense
      fallback={
        <div className="vs-container grid gap-4 py-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SpaceCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <SpacesView listings={listings} suggestions={relaxationSuggestions(filters)} />
    </Suspense>
  )
}
