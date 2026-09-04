import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password, name, role } = body as {
    email?: string
    password?: string
    name?: string
    role?: Role
  }

  // 운영자(ADMIN)는 공개 가입 대상이 아니다.
  const SELF_SIGNUP_ROLES: Role[] = ['TENANT', 'LANDLORD', 'PARTNER']
  if (!email || !password || !name || !role || !SELF_SIGNUP_ROLES.includes(role)) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role },
  })

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    { status: 201 }
  )
}
