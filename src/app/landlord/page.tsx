import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { listingStatusLabel, applicationStatusLabel } from '@/lib/labels'
import { won, manWon } from '@/lib/quote'

export const dynamic = 'force-dynamic'

export default async function LandlordDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/landlord')
  if (session.user.role !== 'LANDLORD' && session.user.role !== 'ADMIN') {
    redirect('/')
  }

  const listings = await prisma.listing.findMany({
    where: { landlordId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { applications: true } },
      tenancies: { where: { status: 'ACTIVE' }, select: { id: true, endDate: true, monthlyTotal: true } },
    },
  })

  const applications = await prisma.application.findMany({
    where: { listing: { landlordId: session.user.id } },
    orderBy: { createdAt: 'desc' },
    take: 8,
    include: { listing: { select: { id: true, title: true, address: true } } },
  })

  const openCount = listings.filter((l) => l.status === 'OPEN').length
  const closedCount = listings.filter((l) => l.status === 'CLOSED').length
  const pendingReview = listings.filter((l) => l.status === 'PENDING_REVIEW').length
  const activeRevenue = listings.reduce(
    (sum, l) => sum + l.tenancies.reduce((s, t) => s + t.monthlyTotal, 0),
    0
  )
  const potentialRevenue = listings
    .filter((l) => l.status === 'OPEN')
    .reduce((sum, l) => sum + l.monthlyRent, 0)
  const pendingApplications = applications.filter((a) => a.status === 'PENDING').length

  return (
    <div className="vs-container py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight">내 공실</h1>
          <p className="mt-1 text-[14px] text-[var(--ink-muted)]">
            {session.user.name}님, 비어 있는 기간을 수익으로 바꿔보세요.
          </p>
        </div>
        <Link href="/landlord/listings/new" className="vs-btn vs-btn-primary">
          + 공실 등록하기
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="공개 중인 공실" value={`${openCount}곳`} sub={pendingReview ? `실사 대기 ${pendingReview}곳` : '전부 실사 완료'} />
        <Stat label="계약된 공실" value={`${closedCount}곳`} sub="이용 중이거나 마감" />
        <Stat label="이번 달 발생 수익" value={won(activeRevenue)} sub="운영 중 계약 기준" accent />
        <Stat
          label="비어 있어 놓치는 수익"
          value={`월 ${manWon(potentialRevenue)}`}
          sub="공개 중 공실의 월 이용료 합계"
        />
      </div>

      {/* 요청 인박스 */}
      <section className="mt-8" aria-labelledby="inbox-heading">
        <div className="flex items-end justify-between">
          <h2 id="inbox-heading" className="text-[20px] font-bold tracking-tight">
            들어온 요청
          </h2>
          {pendingApplications > 0 && (
            <span className="vs-badge vs-badge-brand">확인 필요 {pendingApplications}건</span>
          )}
        </div>

        {applications.length === 0 ? (
          <p className="vs-card mt-3 p-8 text-center text-[14px] text-[var(--ink-muted)]">
            아직 들어온 요청이 없어요. 공실을 등록하면 조건에 맞는 창업자에게 노출됩니다.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {applications.map((a) => (
              <li key={a.id} className="vs-card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    {a.applicantName} · {a.desiredDuration}개월 희망
                  </p>
                  <p className="truncate text-[12px] text-[var(--ink-muted)]">
                    {a.listing.title ?? a.listing.address} · 시작{' '}
                    {a.desiredStartDate.toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span
                  className={`vs-badge ${
                    a.status === 'CONFIRMED'
                      ? 'vs-badge-ok'
                      : a.status === 'REJECTED'
                        ? 'vs-badge-danger'
                        : 'vs-badge-brand'
                  }`}
                >
                  {applicationStatusLabel(a.status)}
                </span>
                <Link
                  href={`/landlord/listings/${a.listing.id}/applications`}
                  className="vs-btn vs-btn-secondary !px-3 !py-1.5 !text-[13px]"
                >
                  관리
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 공실 목록 */}
      <section className="mt-8" aria-labelledby="listings-heading">
        <h2 id="listings-heading" className="text-[20px] font-bold tracking-tight">
          등록한 공실
        </h2>
        {listings.length === 0 ? (
          <div className="vs-card mt-3 p-10 text-center">
            <p className="text-[17px] font-bold">첫 공실을 등록해 보세요</p>
            <p className="mt-2 text-[14px] text-[var(--ink-muted)]">
              등록은 무료이고, 계약이 성사될 때만 수수료가 발생합니다.
            </p>
            <Link href="/landlord/listings/new" className="vs-btn vs-btn-primary mt-5">
              공실 등록하기
            </Link>
          </div>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              const active = l.tenancies[0]
              return (
                <Link key={l.id} href={`/landlord/listings/${l.id}`} className="vs-card p-4 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 text-[15px] font-bold leading-snug">
                      {l.title ?? l.address}
                    </p>
                    <span
                      className={`vs-badge ${
                        l.status === 'OPEN'
                          ? 'vs-badge-ok'
                          : l.status === 'PENDING_REVIEW'
                            ? 'vs-badge-warn'
                            : ''
                      }`}
                    >
                      {listingStatusLabel(l.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] text-[var(--ink-muted)]">
                    {l.region ?? ''} {l.area}평
                  </p>
                  <p className="mt-2 text-[16px] font-bold text-[var(--brand)]">
                    월 {won(l.monthlyRent)}
                  </p>
                  <p className="mt-2 text-[12px] text-[var(--ink-muted)]">
                    요청 {l._count.applications}건
                    {active && ` · 이용 종료 ${active.endDate.toLocaleDateString('ko-KR')}`}
                  </p>
                </Link>
              )
            })}
          </div>
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
