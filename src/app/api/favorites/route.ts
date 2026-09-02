import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { listingId } = (await request.json()) as { listingId: string }
  const tenantId = session.user.id

  const existing = await prisma.favorite.findUnique({
    where: { tenantId_listingId: { tenantId, listingId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }

  await prisma.favorite.create({ data: { tenantId, listingId } })
  return NextResponse.json({ favorited: true })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const favorites = await prisma.favorite.findMany({
    where: { tenantId: session.user.id },
    include: { listing: true },
  })

  return NextResponse.json(favorites)
}
