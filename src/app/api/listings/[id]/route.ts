import { NextResponse } from 'next/server'
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
