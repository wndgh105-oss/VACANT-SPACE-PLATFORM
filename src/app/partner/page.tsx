import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { won } from '@/lib/quote'
import { businessTypeLabel } from '@/lib/labels'

export const dynamic = 'force-dynamic'

export default async function PartnerHomePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/partner')
  if (session.user.role !== 'PARTNER' && session.user.role !== 'ADMIN') redirect('/')

  const packages = await prisma.equipmentPackage.findMany({
    where: session.user.role === 'PARTNER' ? { partnerId: session.user.id } : {},
    include: { equipmentItems: true },
    orderBy: { businessType: 'asc' },
  })

  const itemIds = packages.flatMap((p) => p.equipmentItems.map((i) => i.id))

  // 견적에 포함된 장비 라인 = 파트너의 잠재 수요
  const quotedLines = itemIds.length
    ? await prisma.quoteItem.findMany({
        where: { itemId: { in: itemIds } },
        include: { quote: { select: { months: true, createdAt: true } } },
      })
    : []

  const confirmedApplications = await prisma.application.count({ where: { status: 'CONFIRMED' } })

  const quotedRevenue = quotedLines.reduce(
    (sum, l) => sum + l.monthlyFee * (l.quote?.months ?? 1),
    0
  )
  const activeCount = packages.filter((p) => p.active).length

  return (
    <div className="vs-container py-8">
      <h1 className="text-[28px] font-bold tracking-tight">장비 파트너 대시보드</h1>
      <p className="mb-6 mt-1 text-[14px] text-[var(--ink-muted)]">
        {session.user.name}님, 창업자가 견적을 만드는 화면에서 패키지가 노출됩니다.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="운영 중인 패키지" value={`${activeCount}종`} sub={`전체 ${packages.length}종`} />
        <Stat label="견적에 포함된 횟수" value={`${quotedLines.length}회`} sub="창업자가 담은 품목 기준" />
        <Stat label="견적 기준 잠재 매출" value={won(quotedRevenue)} sub="확정 매출이 아님" accent />
        <Stat label="확정된 계약" value={`${confirmedApplications}건`} sub="배송·설치 대상" />
      </div>

      <section className="mt-8" aria-labelledby="pkg-heading">
        <div className="flex items-end justify-between">
          <h2 id="pkg-heading" className="text-[20px] font-bold tracking-tight">
            내 패키지
          </h2>
          <Link href="/partner/packages" className="text-[13px] font-semibold text-[var(--brand)]">
            관리하기 →
          </Link>
        </div>

        {packages.length === 0 ? (
          <p className="vs-card mt-3 p-8 text-center text-[14px] text-[var(--ink-muted)]">
            등록된 패키지가 없습니다. 운영자에게 문의해 주세요.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {packages.map((p) => (
              <div key={p.id} className="vs-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[16px] font-bold">{p.name}</p>
                  <span className={`vs-badge ${p.active ? 'vs-badge-ok' : ''}`}>
                    {p.active ? '노출 중' : '중지'}
                  </span>
                </div>
                <p className="mt-1 text-[12px] text-[var(--ink-muted)]">
                  {businessTypeLabel(p.businessType)} · 품목 {p.equipmentItems.length}개
                </p>
                <p className="mt-2 text-[16px] font-bold text-[var(--brand)]">
                  월 {won(p.equipmentItems.reduce((s, i) => s + i.monthlyFee, 0))}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-8 rounded-[12px] border border-[var(--line)] bg-[var(--surface-alt)] p-4 text-[12px] leading-relaxed text-[var(--ink-muted)]">
        본 화면의 수치는 데모 데이터 기준이며 실제 정산이 아닙니다. 파트너 셀프 온보딩과 자동 정산은
        MVP 범위에서 제외되어 있습니다.
      </p>
    </div>
  )
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: string
  sub: string
  accent?: boolean
}) {
  return (
    <div className={`vs-card p-4 ${accent ? 'border-[var(--brand)]' : ''}`}>
      <p className="text-[12px] text-[var(--ink-muted)]">{label}</p>
      <p className={`mt-1 text-[22px] font-bold ${accent ? 'text-[var(--brand)]' : ''}`}>{value}</p>
      <p className="text-[11px] text-[var(--ink-muted)]">{sub}</p>
    </div>
  )
}
