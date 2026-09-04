import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Role } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SELF_SELECTABLE_ROLES: Role[] = ['TENANT', 'LANDLORD', 'PARTNER']

/** 소셜 로그인으로 역할 없이(null) 만들어진 계정이, 로그인 직후 역할을 확정할 때 쓴다. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // 이미 역할이 있는 계정이 이 API로 역할을 바꿔치기하지 못하도록 막는다.
  if (session.user.role) {
    return NextResponse.json({ error: 'role_already_set' }, { status: 409 })
  }

  const { role } = (await request.json().catch(() => ({}))) as { role?: string }
  if (!role || !SELF_SELECTABLE_ROLES.includes(role as Role)) {
    return NextResponse.json({ error: 'invalid_role' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: session.user.id }, data: { role: role as Role } })
  return NextResponse.json({ ok: true })
}
