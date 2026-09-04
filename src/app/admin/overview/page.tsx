import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { won } from '@/lib/quote'
import { ReviewQueue } from '@/components/ReviewQueue'

export const dynamic = 'force-dynamic'

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/admin/overview')
  if (session.user.role !== 'ADMIN') redirect('/')

  const [
    userCount,
    listingCount,
    openCount,
    pendingReview,
    applicationCount,
    confirmedCount,
    tenancyCount,
    teaserCount,
    quotes,
    pending,
    teasers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: 'OPEN' } }),
    prisma.listing.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.application.count(),
    prisma.application.count({ where: { status: 'CONFIRMED' } }),
    prisma.tenancy.count(),
    prisma.relocationTeaser.count(),
    prisma.quote.findMany({ select: { grandTotal: true } }),
    prisma.listing.findMany({
      where: { status: 'PENDING_REVIEW' },
      include: { landlord: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.relocationTeaser.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, slug: true, storeName: true, published: true, views: true },
    }),
  ])

  const quoteTotal = quotes.reduce((s, q) => s + q.grandTotal, 0)
  const conversion = applicationCount > 0 ? Math.round((confirmedCount / applicationCount) * 100) : 0

  return (
    <div className="vs-container py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">운영 대시보드</h1>
          <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
            공급·수요·전환 지표를 한 화면에서 확인합니다.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin" className="vs-btn vs-btn-secondary !text-[13px]">
            신청 관리
          </Link>
          <Link href="/admin/packages" className="vs-btn vs-btn-secondary !text-[13px]">
            장비 패키지
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="전체 사용자" value={`${userCount}명`} sub="창업자·건물주·파트너·운영자" />
        <Stat label="등록 공실" value={`${listingCount}곳`} sub={`공개 중 ${openCount}곳`} />
        <Stat label="실사 대기" value={`${pendingReview}곳`} sub="승인 전 미노출" accent={pendingReview > 0} />
        <Stat label="누적 견적" value={`${quotes.length}건`} sub={`합계 ${won(quoteTotal)}`} />
        <Stat label="상담 요청" value={`${applicationCount}건`} sub={`확정 ${confirmedCount}건`} />
        <Stat label="요청→확정 전환율" value={`${conversion}%`} sub="NSM 선행 지표" accent />
        <Stat label="진행 계약" value={`${tenancyCount}건`} sub="이용 중·종료 포함" />
        <Stat label="이전 티저" value={`${teaserCount}건`} sub="바이럴 채널" />
      </div>

      <section className="mt-8" aria-labelledby="review-heading">
        <h2 id="review-heading" className="text-[20px] font-bold tracking-tight">
          현장 실사 대기열
        </h2>
        <p className="mb-3 mt-1 text-[13px] text-[var(--ink-muted)]">
          실사를 마친 공실만 노출됩니다. 승인하면 즉시 검색 결과에 나타납니다.
        </p>
        <ReviewQueue
          rows={pending.map((l) => ({
            id: l.id,
            title: l.title,
            address: l.address,
            region: l.region,
            area: l.area,
            monthlyRent: l.monthlyRent,
            landlordName: l.landlord.name,
          }))}
        />
      </section>

      <section className="mt-8" aria-labelledby="teaser-heading">
        <h2 id="teaser-heading" className="text-[20px] font-bold tracking-tight">
          이전 소식 콘텐츠
        </h2>
        {teasers.length === 0 ? (
          <p className="vs-card mt-3 p-8 text-center text-[14px] text-[var(--ink-muted)]">
            생성된 티저가 없습니다.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {teasers.map((t) => (
              <li key={t.id} className="vs-card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold">{t.storeName}</p>
                  <p className="text-[12px] text-[var(--ink-muted)]">
                    /t/{t.slug} · 조회 {t.views.toLocaleString('ko-KR')}회
                  </p>
                </div>
                <span className={`vs-badge ${t.published ? 'vs-badge-ok' : ''}`}>
                  {t.published ? '공개' : '비공개'}
                </span>
                <Link href={`/t/${t.slug}`} className="vs-btn vs-btn-secondary !px-3 !py-1.5 !text-[13px]">
                  보기
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
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
