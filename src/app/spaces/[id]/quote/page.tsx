import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { QuoteBuilder } from '@/components/QuoteBuilder'

export const dynamic = 'force-dynamic'

export default async function QuotePage({ params }: { params: { id: string } }) {
  const [listing, packages] = await Promise.all([
    prisma.listing.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        title: true,
        address: true,
        area: true,
        monthlyRent: true,
        maintenanceFee: true,
        deposit: true,
        contractDurations: true,
        businessTypes: true,
        recommendedTypes: true,
        status: true,
      },
    }),
    prisma.equipmentPackage.findMany({
      where: { active: true },
      orderBy: { businessType: 'asc' },
      select: {
        id: true,
        businessType: true,
        name: true,
        description: true,
        equipmentItems: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, name: true, monthlyFee: true, optional: true },
        },
      },
    }),
  ])

  if (!listing || listing.status === 'PENDING_REVIEW') notFound()

  return (
    <div className="vs-container py-6">
      <Link
        href={`/spaces/${listing.id}`}
        className="text-[13px] text-[var(--ink-muted)] hover:text-[var(--ink)]"
      >
        ← 공간 상세로
      </Link>
      <h1 className="mt-3 text-[26px] font-bold tracking-tight">견적 만들기</h1>
      <p className="mb-6 mt-1 text-[14px] text-[var(--ink-muted)]">
        기간과 장비를 고르면 총 얼마가 드는지 바로 계산됩니다.
      </p>

      <QuoteBuilder
        listing={listing}
        packages={packages.map((p) => ({
          id: p.id,
          businessType: p.businessType,
          name: p.name,
          description: p.description,
          items: p.equipmentItems,
        }))}
      />
    </div>
  )
}
