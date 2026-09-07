import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { prisma } from '@/lib/prisma'
import { computeListingStatusUpdate } from '@/lib/applicationStatusTransition'
import { ApplicationStatus } from '@prisma/client'
import { notify } from '@/lib/notify'
import { applicationStatusLabel } from '@/lib/labels'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { status } = (await request.json()) as { status: ApplicationStatus }

  const current = await prisma.application.findUnique({ where: { id: params.id }, include: { listing: true } })
  if (!current) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const listingStatusUpdate = computeListingStatusUpdate(current.status, status)
  const operations = [
    prisma.application.update({ where: { id: params.id }, data: { status } }),
    ...(listingStatusUpdate
      ? [prisma.listing.update({ where: { id: current.listingId }, data: { status: listingStatusUpdate } })]
      : []),
  ]
  const [updated] = await prisma.$transaction(operations)

  if (current.status !== status) {
    await notify(
      current.tenantId,
      '신청 상태가 바뀌었어요',
      `"${current.listing.title ?? current.listing.address}" 상담 요청이 "${applicationStatusLabel(status)}" 상태로 바뀌었습니다.`,
      '/dashboard/applications'
    )
  }

  return NextResponse.json(updated)
}
