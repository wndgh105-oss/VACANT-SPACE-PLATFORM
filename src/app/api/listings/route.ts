import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const listing = await prisma.listing.create({
    data: { ...body, landlordId: session.user.id },
  })

  return NextResponse.json(listing, { status: 201 })
}
