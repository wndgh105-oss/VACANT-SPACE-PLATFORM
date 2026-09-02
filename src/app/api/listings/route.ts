import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseListingFilters, buildListingWhere } from '@/lib/listingFilters'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters = parseListingFilters(searchParams)
  const where = buildListingWhere(filters)

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      address: true,
      monthlyRent: true,
      businessTypes: true,
      status: true,
      photos: true,
    },
  })

  return NextResponse.json(listings)
}
