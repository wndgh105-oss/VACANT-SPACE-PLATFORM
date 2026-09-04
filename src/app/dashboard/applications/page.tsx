import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { applicationStatusLabel } from '@/lib/labels'
import { won } from '@/lib/quote'

export const dynamic = 'force-dynamic'

const STEPS = ['PENDING', 'CONTACTING', 'CONFIRMED'] as const

export default async function MyApplicationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login?callbackUrl=/dashboard/applications')

  const applications = await prisma.application.findMany({
    where: { tenantId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      listing: { select: { id: true, title: true, address: true, region: true } },
      quote: { select: { needCash: true, months: true } },
    },
  })

  return (
    <div className="vs-container py-8">
      <h1 className="text-[28px] font-bold tracking-tight">요청 현황</h1>
      <p className="mb-6 mt-1 text-[14px] text-[var(--ink-muted)]">
        요청 → 상담 → 확정 순으로 진행됩니다. 확정 전까지 어떤 비용도 발생하지 않습니다.
      </p>

      {applications.length === 0 ? (
        <div className="vs-card p-10 text-center">
          <p className="text-[17px] font-bold">보낸 요청이 아직 없어요</p>
          <Link href="/spaces" className="vs-btn vs-btn-primary mt-5">
            공간 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {applications.map((a) => {
            const stepIndex = STEPS.indexOf(a.status as (typeof STEPS)[number])
            const rejected = a.status === 'REJECTED'
            return (
              <li key={a.id} className="vs-card p-5">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/spaces/${a.listing.id}`}
                      className="text-[17px] font-bold hover:underline"
                    >
                      {a.listing.title ?? a.listing.address}
                    </Link>
                    <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
                      {a.desiredDuration}개월 · 희망 시작{' '}
                      {a.desiredStartDate.toLocaleDateString('ko-KR')} · 요청일{' '}
                      {a.createdAt.toLocaleDateString('ko-KR')}
                    </p>
                    {a.quote && (
                      <p className="mt-1 text-[13px] font-semibold text-[var(--brand)]">
                        견적 {won(a.quote.needCash)} ({a.quote.months}개월 기준)
                      </p>
                    )}
                  </div>
                  <span
                    className={`vs-badge ${
                      rejected
                        ? 'vs-badge-danger'
                        : a.status === 'CONFIRMED'
                          ? 'vs-badge-ok'
                          : 'vs-badge-brand'
                    }`}
                  >
                    {applicationStatusLabel(a.status)}
                  </span>
                </div>

                {!rejected && (
                  <ol className="mt-5 flex items-center gap-1" aria-label="진행 단계">
                    {STEPS.map((s, i) => (
                      <li key={s} className="flex flex-1 items-center gap-1">
                        <div className="flex-1">
                          <div
                            className={`h-1.5 rounded-full ${
                              i <= stepIndex ? 'bg-[var(--brand)]' : 'bg-[var(--surface-alt)]'
                            }`}
                          />
                          <p
                            className={`mt-1.5 text-[11px] ${
                              i <= stepIndex ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-muted)]'
                            }`}
                          >
                            {applicationStatusLabel(s)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {a.message && (
                  <p className="mt-4 rounded-[10px] bg-[var(--surface-alt)] p-3 text-[13px] text-[var(--ink-muted)]">
                    {a.message}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
