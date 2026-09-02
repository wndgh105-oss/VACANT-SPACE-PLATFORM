import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'
import { BusinessType } from '@prisma/client'

export async function GET() {
  const packages = await prisma.equipmentPackage.findMany()
  return NextResponse.json(packages)
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await request.json()
  const { businessType, name, items, monthlyFee } = body as {
    businessType: BusinessType
    name: string
    items: string[]
    monthlyFee: number
  }

  const existing = await prisma.equipmentPackage.findUnique({ where: { businessType } })
  if (existing) {
    return NextResponse.json({ error: 'package already exists for this business type' }, { status: 409 })
  }

  const created = await prisma.equipmentPackage.create({
    data: { businessType, name, items, monthlyFee },
  })

  return NextResponse.json(created, { status: 201 })
}
