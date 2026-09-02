import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
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
