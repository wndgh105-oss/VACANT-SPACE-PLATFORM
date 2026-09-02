import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { prisma } from '@/lib/prisma'
import { computeListingStatusUpdate } from '@/lib/applicationStatusTransition'
import { ApplicationStatus } from '@prisma/client'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { status } = (await request.json()) as { status: ApplicationStatus }

  const current = await prisma.application.findUnique({ where: { id: params.id } })
  if (!current) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { status },
  })

  const listingStatusUpdate = computeListingStatusUpdate(current.status, status)
  if (listingStatusUpdate) {
    await prisma.listing.update({
      where: { id: current.listingId },
      data: { status: listingStatusUpdate },
    })
  }

  return NextResponse.json(updated)
}
