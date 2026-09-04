import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({ where: { id: params.id } })
  if (!listing) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const equipmentPackages = await prisma.equipmentPackage.findMany({
    where: { businessType: { in: listing.businessTypes } },
  })

  return NextResponse.json({ ...listing, equipmentPackages })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: params.id } })
  if (!listing || listing.landlordId !== session.user.id) {
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

  // status·landlordId 등은 이 화이트리스트에 없으므로 클라이언트가 아무리 보내도 무시된다.
  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: {
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
    },
  })

  return NextResponse.json(updated)
}
