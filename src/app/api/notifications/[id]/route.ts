import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** 알림 하나를 읽음 처리한다. 본인 알림만 가능하다. */
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const notification = await prisma.notification.findUnique({ where: { id: params.id } })
  if (!notification || notification.userId !== session.user.id) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const updated = await prisma.notification.update({ where: { id: params.id }, data: { read: true } })
  return NextResponse.json(updated)
}
