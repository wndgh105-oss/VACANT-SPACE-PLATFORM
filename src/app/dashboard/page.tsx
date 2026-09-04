import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { won, manWon } from '@/lib/quote'
import { tenancyStatusLabel, applicationStatusLabel } from '@/lib/labels'
import { SpaceCard } from '@/components/SpaceCard'
import { listingCardSelect } from '@/lib/listingSelect'

export const dynamic = 'force-dynamic'

function daysLeft(end: Date): number {
  const ms = end.getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/dashboard')
  if (session.user.role !== 'TENANT') {
    const home = session.user.role === 'LANDLORD' ? '/landlord' : session.user.role === 'PARTNER' ? '/partner' : '/admin'
    redirect(home)
  }

  const tenancies = await prisma.tenancy.findMany({
    where: { tenantId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { id: true, title: true, address: true, region: true, area: true, monthlyRent: true } },
      teaser: { select: { slug: true, published: true } },
    },
  })

  const applications = await prisma.application.findMany({
    where: { tenantId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { listing: { select: { title: true, address: true } } },
  })

  const active = tenancies.find((t) => t.status === 'ACTIVE') ?? null

  // 이전 추천: 현재 운영 중인 공간보다 넓고, 같은 지역이 아닌 공개 공간
  const suggestions = active
    ? await prisma.listing.findMany({
        where: {
          status: 'OPEN',
          id: { not: active.listingId },
          area: { gte: active.listing.area },
        },
        orderBy: { monthlyRent: 'asc' },
        take: 3,
        select: listingCardSelect,
      })
    : []

  return (
    <div className="vs-container py-8">
      <h1 className="text-[28px] font-bold tracking-tight">내 창업 현황</h1>
      <p className="mb-6 mt-1 text-[14px] text-[var(--ink-muted)]">
        {session.user.name}님, 지금 운영 중인 공간과 다음 선택지를 정리했어요.
      </p>

      {active ? (
        <section className="vs-card overflow-hidden" aria-labelledby="active-heading">
          <div className="grid gap-0 md:grid-cols-[1.3fr_1fr]">
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="vs-badge vs-badge-ok">{tenancyStatusLabel(active.status)}</span>
                <span className="vs-badge">{active.storeName ?? '운영 중인 매장'}</span>
              </div>
              <h2 id="active-heading" className="mt-2 text-[22px] font-bold leading-snug">
                {active.listing.title ?? active.listing.address}
              </h2>
              <p className="mt-1 text-[13px] text-[var(--ink-muted)]">{active.listing.address}</p>

              <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <dt className="text-[12px] text-[var(--ink-muted)]">계약 시작</dt>
                  <dd className="text-[15px] font-semibold">
                    {active.startDate.toLocaleDateString('ko-KR')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[var(--ink-muted)]">계약 종료</dt>
                  <dd className="text-[15px] font-semibold">
                    {active.endDate.toLocaleDateString('ko-KR')}
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[var(--ink-muted)]">월 비용</dt>
                  <dd className="text-[15px] font-semibold">{won(active.monthlyTotal)}</dd>
                </div>
                <div>
                  <dt className="text-[12px] text-[var(--ink-muted)]">면적</dt>
                  <dd className="text-[15px] font-semibold">{active.listing.area}평</dd>
                </div>
              </dl>
            </div>

            <div className="bg-[var(--brand-soft)] p-6">
              <p className="text-[13px] font-semibold text-[var(--brand-strong)]">계약 종료까지</p>
              <p className="text-[44px] font-bold leading-none text-[var(--brand-strong)]">
                D-{Math.max(0, daysLeft(active.endDate))}
              </p>
              <p className="mt-2 text-[13px] text-[var(--brand-strong)]/80">
                종료 2주 전부터 연장·이전 상담을 시작하는 것을 권합니다.
              </p>

              <div className="mt-5 flex flex-col gap-2">
                <button type="button" className="vs-btn vs-btn-primary w-full" disabled>
                  계약 연장 요청 (준비 중)
                </button>
                {active.teaser ? (
                  <Link href={`/t/${active.teaser.slug}`} className="vs-btn vs-btn-secondary w-full">
                    내 이전 소식 페이지 보기
                  </Link>
                ) : (
                  <Link
                    href={`/dashboard/relocate/${active.id}`}
                    className="vs-btn vs-btn-secondary w-full"
                  >
                    다른 곳으로 이전하기
                  </Link>
                )}
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-[var(--brand-strong)]/70">
                연장·정식 창업 전환은 운영자 상담으로 진행되며, 이 화면에서 계약이 체결되지 않습니다.
              </p>
            </div>
          </div>
        </section>
      ) : (
        <section className="vs-card p-10 text-center">
          <p className="text-[18px] font-bold">아직 진행 중인 공간이 없어요</p>
          <p className="mt-2 text-[14px] text-[var(--ink-muted)]">
            예산과 업종을 정하면 가능한 공간을 바로 보여드릴게요.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/spaces" className="vs-btn vs-btn-primary">
              공간 둘러보기
            </Link>
            <Link href="/calculator" className="vs-btn vs-btn-secondary">
              예산 계산해 보기
            </Link>
          </div>
        </section>
      )}

      {/* 최근 요청 */}
      <section className="mt-8" aria-labelledby="apps-heading">
        <div className="flex items-end justify-between">
          <h2 id="apps-heading" className="text-[20px] font-bold tracking-tight">
            최근 요청
          </h2>
          <Link href="/dashboard/applications" className="text-[13px] font-semibold text-[var(--brand)]">
            전체 보기 →
          </Link>
        </div>
        {applications.length === 0 ? (
          <p className="vs-card mt-3 p-6 text-center text-[14px] text-[var(--ink-muted)]">
            보낸 요청이 아직 없어요.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {applications.map((a) => (
              <li key={a.id} className="vs-card flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">
                    {a.listing.title ?? a.listing.address}
                  </p>
                  <p className="text-[12px] text-[var(--ink-muted)]">
                    {a.desiredDuration}개월 · 희망 시작 {a.desiredStartDate.toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span className="vs-badge vs-badge-brand">{applicationStatusLabel(a.status)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 이전 추천 */}
      {suggestions.length > 0 && (
        <section className="mt-8" aria-labelledby="relocate-heading">
          <h2 id="relocate-heading" className="text-[20px] font-bold tracking-tight">
            다음 자리 추천
          </h2>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
            지금보다 넓으면서 이용료 부담이 크지 않은 공간입니다. (월 최저{' '}
            {manWon(suggestions[0].monthlyRent)}부터)
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((l, i) => (
              <SpaceCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
