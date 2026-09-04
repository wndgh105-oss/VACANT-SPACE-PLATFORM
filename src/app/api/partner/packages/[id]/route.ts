import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const patchSchema = z.object({
  active: z.boolean().optional(),
  description: z.string().max(300).optional(),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (session.user.role !== 'PARTNER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const pkg = await prisma.equipmentPackage.findUnique({ where: { id: params.id } })
  if (!pkg) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  if (session.user.role === 'PARTNER' && pkg.partnerId !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const updated = await prisma.equipmentPackage.update({
    where: { id: params.id },
    data: parsed.data,
  })
  return NextResponse.json(updated)
}
