import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { listingId, applicantName, phone, desiredDuration, desiredStartDate, message } = body as {
    listingId: string
    applicantName: string
    phone: string
    desiredDuration: number
    desiredStartDate: string
    message?: string
  }

  const existing = await prisma.application.findFirst({
    where: { listingId, tenantId: session.user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'already applied' }, { status: 409 })
  }

  const application = await prisma.application.create({
    data: {
      listingId,
      tenantId: session.user.id,
      applicantName,
      phone,
      desiredDuration,
      desiredStartDate: new Date(desiredStartDate),
      message,
    },
  })

  return NextResponse.json(application, { status: 201 })
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')

  let where: Prisma.ApplicationWhereInput = {}
  if (session.user.role === 'TENANT') {
    where = { tenantId: session.user.id }
  } else if (session.user.role === 'LANDLORD') {
    where = { listing: { landlordId: session.user.id } }
  }
  if (statusFilter) {
    where = { ...where, status: statusFilter as never }
  }

  const listingId = searchParams.get('listingId')
  if (listingId) {
    where = { ...where, listingId }
  }

  const applications = await prisma.application.findMany({
    where,
    include: { listing: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(applications)
}
