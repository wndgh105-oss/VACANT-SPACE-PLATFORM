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

  if (!email || !password || !name || (role !== 'TENANT' && role !== 'LANDLORD')) {
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
