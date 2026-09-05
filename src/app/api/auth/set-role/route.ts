import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Role } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const SELF_SELECTABLE_ROLES: Role[] = ['TENANT', 'LANDLORD', 'PARTNER']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 소셜 로그인으로 역할 없이(null) 만들어진 계정이, 로그인 직후 역할을 확정할 때 쓴다.
 * 카카오 이메일 동의가 아직 심사 중이라 이메일이 없는 계정은 같은 화면에서 이메일도 함께 받는다.
 * 이미 채워진 값(role/email)은 이 API로 바꿔치기하지 못하도록, 비어 있는 값만 갱신한다.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { role?: string; email?: string }
  const data: { role?: Role; email?: string } = {}

  if (!session.user.role) {
    if (!body.role || !SELF_SELECTABLE_ROLES.includes(body.role as Role)) {
      return NextResponse.json({ error: 'invalid_role' }, { status: 400 })
    }
    data.role = body.role as Role
  }

  if (!session.user.email) {
    const email = body.email?.trim().toLowerCase()
    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing && existing.id !== session.user.id) {
      return NextResponse.json({ error: 'email_taken' }, { status: 409 })
    }
    data.email = email
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'nothing_to_update' }, { status: 409 })
  }

  await prisma.user.update({ where: { id: session.user.id }, data })
  return NextResponse.json({ ok: true })
}
