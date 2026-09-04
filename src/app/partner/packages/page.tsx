import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PartnerPackageList } from '@/components/PartnerPackageList'

export const dynamic = 'force-dynamic'

export default async function PartnerPackagesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/partner/packages')
  if (session.user.role !== 'PARTNER' && session.user.role !== 'ADMIN') redirect('/')

  const packages = await prisma.equipmentPackage.findMany({
    where: session.user.role === 'PARTNER' ? { partnerId: session.user.id } : {},
    orderBy: { businessType: 'asc' },
    include: { equipmentItems: { orderBy: { sortOrder: 'asc' } } },
  })

  return (
    <div className="vs-container py-8">
      <h1 className="text-[28px] font-bold tracking-tight">패키지 관리</h1>
      <p className="mb-6 mt-1 text-[14px] text-[var(--ink-muted)]">
        노출을 끄면 창업자의 견적 화면에서 사라집니다. 품목 가격 편집은 MVP 범위에서 제외되어 운영자가
        대신 처리합니다.
      </p>
      <PartnerPackageList
        packages={packages.map((p) => ({
          id: p.id,
          name: p.name,
          businessType: p.businessType,
          description: p.description,
          active: p.active,
          items: p.equipmentItems,
        }))}
      />
    </div>
  )
}
