import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { ApplicationStatus } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeListingStatusUpdate } from '@/lib/applicationStatusTransition'

/**
 * 건물주(또는 운영자)가 자기 공실에 들어온 요청의 상태를 바꾼다.
 *
 * 운영자 전용 `/api/applications/[id]` 와 분리한 이유:
 * 이 경로는 CONFIRMED 전환 시 계약(Tenancy)까지 같은 트랜잭션에서 생성한다.
 */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { status } = (await request.json()) as { status: ApplicationStatus }
  const allowed: ApplicationStatus[] = ['PENDING', 'CONTACTING', 'CONFIRMED', 'REJECTED']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
  }

  const current = await prisma.application.findUnique({
    where: { id: params.id },
    include: { listing: true, quote: true },
  })
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const isOwner = current.listing.landlordId === session.user.id
  if (!isOwner && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const listingStatusUpdate = computeListingStatusUpdate(current.status, status)

  const startDate = current.desiredStartDate
  const endDate = new Date(startDate)
  endDate.setMonth(endDate.getMonth() + current.desiredDuration)

  const monthlyTotal =
    current.listing.monthlyRent +
    current.listing.maintenanceFee +
    (current.quote ? Math.round(current.quote.equipmentTotal / Math.max(current.quote.months, 1)) : 0)

  const needsTenancy = current.status !== 'CONFIRMED' && status === 'CONFIRMED'
  const alreadyHasTenancy = needsTenancy
    ? (await prisma.tenancy.count({ where: { applicationId: current.id } })) > 0
    : false

  const operations = [
    prisma.application.update({ where: { id: params.id }, data: { status } }),
    ...(listingStatusUpdate
      ? [prisma.listing.update({ where: { id: current.listingId }, data: { status: listingStatusUpdate } })]
      : []),
    ...(needsTenancy && !alreadyHasTenancy
      ? [
          prisma.tenancy.create({
            data: {
              listingId: current.listingId,
              tenantId: current.tenantId,
              applicationId: current.id,
              startDate,
              endDate,
              monthlyTotal,
              status: 'ACTIVE',
            },
          }),
        ]
      : []),
  ]

  const [updated] = await prisma.$transaction(operations)
  return NextResponse.json(updated)
}
