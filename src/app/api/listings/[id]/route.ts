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
  const { address, area, monthlyRent, deposit, photos, contractDurations, businessTypes, status } = body
  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: { address, area, monthlyRent, deposit, photos, contractDurations, businessTypes, status },
  })

  return NextResponse.json(updated)
}
