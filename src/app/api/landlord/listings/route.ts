import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const listings = await prisma.listing.findMany({
    where: { landlordId: session.user.id },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(listings)
}
