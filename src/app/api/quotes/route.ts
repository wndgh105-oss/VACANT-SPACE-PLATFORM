import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { computeQuote, findAddons } from '@/lib/quote'

const bodySchema = z.object({
  listingId: z.string().min(1),
  months: z.number().int().min(1).max(12),
  packageId: z.string().min(1).nullable().optional(),
  itemIds: z.array(z.string()).default([]),
  addonIds: z.array(z.string()).default([]),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid_body', fields: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }
  const { listingId, months, packageId, itemIds, addonIds } = parsed.data

  const listing = await prisma.listing.findUnique({ where: { id: listingId } })
  if (!listing) return NextResponse.json({ error: 'listing_not_found' }, { status: 404 })

  const pkg = packageId
    ? await prisma.equipmentPackage.findUnique({
        where: { id: packageId },
        include: { equipmentItems: { orderBy: { sortOrder: 'asc' } } },
      })
    : null

  // 필수 품목은 항상 포함하고, 선택 품목은 요청에 담긴 것만 포함한다.
  const chosenItems = (pkg?.equipmentItems ?? []).filter(
    (item) => !item.optional || itemIds.includes(item.id)
  )
  const equipmentMonthly = chosenItems.reduce((sum, i) => sum + i.monthlyFee, 0)
  const addons = findAddons(addonIds)

  const businessType = listing.recommendedTypes[0] ?? listing.businessTypes[0] ?? 'OTHER'
  const result = computeQuote({
    months,
    monthlyRent: listing.monthlyRent,
    maintenanceFee: listing.maintenanceFee,
    deposit: listing.deposit,
    area: listing.area,
    businessType,
    equipmentMonthly,
    addonIds,
  })

  const quote = await prisma.quote.create({
    data: {
      tenantId: session?.user.id ?? null,
      listingId,
      months: result.months,
      spaceTotal: result.spaceTotal,
      maintenanceTotal: result.maintenanceTotal,
      equipmentTotal: result.equipmentTotal,
      addonTotal: result.addonTotal,
      depositAmount: result.depositAmount,
      grandTotal: result.grandTotal,
      needCash: result.needCash,
      fullStartupCost: result.fullStartup.total,
      savedVsFull: result.savedVsFull,
      lines: {
        create: [
          {
            label: `공간 이용료 (${result.months}개월)`,
            monthlyFee: listing.monthlyRent,
            kind: 'SPACE',
          },
          ...(listing.maintenanceFee > 0
            ? [
                {
                  label: `관리비 (${result.months}개월)`,
                  monthlyFee: listing.maintenanceFee,
                  kind: 'MAINTENANCE' as const,
                },
              ]
            : []),
          ...chosenItems.map((i) => ({
            itemId: i.id,
            label: i.name,
            monthlyFee: i.monthlyFee,
            kind: 'ITEM' as const,
          })),
          ...addons.map((a) => ({
            label: a.label,
            monthlyFee: 0,
            onceFee: a.onceFee,
            kind: 'ADDON' as const,
          })),
        ],
      },
    },
    select: { id: true },
  })

  return NextResponse.json({ id: quote.id, ...result }, { status: 201 })
}
