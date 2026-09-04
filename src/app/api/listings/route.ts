import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseListingFilters, buildListingWhere } from '@/lib/listingFilters'
import { listingCardSelect } from '@/lib/listingSelect'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters = parseListingFilters(searchParams)
  const where = buildListingWhere(filters)

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: listingCardSelect,
  })

  return NextResponse.json(listings)
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    title,
    address,
    region,
    lat,
    lng,
    area,
    monthlyRent,
    deposit,
    maintenanceFee,
    photos,
    contractDurations,
    businessTypes,
    recommendedTypes,
    parking,
    powerKw,
    hasGas,
    hasDrain,
    immediateMoveIn,
    areaSummary,
    description,
  } = body

  const listing = await prisma.listing.create({
    data: {
      title: title ?? null,
      address,
      region: region ?? null,
      lat: typeof lat === 'number' ? lat : null,
      lng: typeof lng === 'number' ? lng : null,
      area,
      monthlyRent,
      deposit,
      maintenanceFee: maintenanceFee ?? 0,
      photos,
      contractDurations,
      businessTypes,
      recommendedTypes: recommendedTypes ?? [],
      parking: Boolean(parking),
      powerKw: powerKw ?? 0,
      hasGas: Boolean(hasGas),
      hasDrain: Boolean(hasDrain),
      immediateMoveIn: Boolean(immediateMoveIn),
      areaSummary: areaSummary ?? null,
      description: description ?? null,
      landlordId: session.user.id,
      // 등록만으로 바로 노출되지 않도록, 클라이언트가 무엇을 보내든 항상 실사 대기 상태로 시작한다.
      status: 'PENDING_REVIEW',
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
