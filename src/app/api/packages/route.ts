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

  // 견적 화면(QuoteBuilder)과 견적 계산 API(/api/quotes)는 `items` 문자열 배열이 아니라
  // EquipmentItem 관계 테이블을 읽는다. 여기서 EquipmentItem을 함께 만들지 않으면
  // 이 화면으로 등록한 패키지가 견적에서 품목 0개·금액 0원으로 조용히 나타난다.
  const itemFees = splitFeeAcrossItems(monthlyFee, items.length)

  const created = await prisma.$transaction(async (tx) => {
    const pkg = await tx.equipmentPackage.create({
      data: { businessType, name, items, monthlyFee },
    })
    if (items.length > 0) {
      await tx.equipmentItem.createMany({
        data: items.map((label, i) => ({
          packageId: pkg.id,
          name: label,
          monthlyFee: itemFees[i],
          optional: false,
          sortOrder: i,
        })),
      })
    }
    return pkg
  })

  return NextResponse.json(created, { status: 201 })
}

/** 항목별 개별 가격 입력이 없는 레거시 폼을 위해, 총 월 렌탈료를 품목 수만큼 정수로 균등 배분한다(나머지는 마지막 품목에). */
function splitFeeAcrossItems(totalFee: number, count: number): number[] {
  if (count === 0) return []
  const base = Math.floor(totalFee / count)
  const remainder = totalFee - base * count
  return Array.from({ length: count }, (_, i) => (i === count - 1 ? base + remainder : base))
}
