import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/prisma'
import { Countdown, ShareBar, BlurredMap } from '@/components/TeaserClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const teaser = await prisma.relocationTeaser.findUnique({
    where: { slug: params.slug },
    select: { storeName: true, published: true },
  })
  if (!teaser?.published) return { title: '이전 소식 · 빈자리' }
  return {
    title: `${teaser.storeName}, 우리가 어디로 옮겼게요? · 빈자리`,
    description: `${teaser.storeName}이(가) 자리를 옮깁니다. 힌트를 보고 새 매장을 찾아보세요.`,
  }
}

export default async function TeaserPage({ params }: { params: { slug: string } }) {
  const teaser = await prisma.relocationTeaser.findUnique({
    where: { slug: params.slug },
    include: { hints: { orderBy: { sortOrder: 'asc' } } },
  })

  if (!teaser || !teaser.published) {
    return (
      <div className="vs-container py-24 text-center">
        <h1 className="text-[24px] font-bold">아직 공개되지 않은 소식이에요</h1>
        <p className="mt-2 text-[14px] text-[var(--ink-muted)]">
          링크가 잘못되었거나, 매장이 아직 공개를 준비 중일 수 있어요.
        </p>
        <Link href="/" className="vs-btn vs-btn-primary mt-6">
          빈자리 홈으로
        </Link>
      </div>
    )
  }

  // 조회수는 표시용 지표이므로 실패해도 페이지 렌더링을 막지 않는다.
  await prisma.relocationTeaser
    .update({ where: { id: teaser.id }, data: { views: { increment: 1 } } })
    .catch(() => undefined)

  return (
    <div>
      <section className="bg-[var(--ink)] text-white">
        <div className="vs-container py-16 text-center">
          <p className="text-[12px] uppercase tracking-[0.3em] opacity-60">Moving</p>
          <h1 className="vs-rise mt-3 text-[34px] font-bold tracking-tight md:text-[44px]">
            {teaser.storeName},
            <br />
            우리가 어디로 옮겼게요?
          </h1>
          {teaser.message && (
            <p className="vs-rise mx-auto mt-4 max-w-lg text-[15px] leading-relaxed opacity-85">
              {teaser.message}
            </p>
          )}
          <div className="vs-rise mt-8">
            <Countdown openDate={teaser.openDate.toISOString()} />
            <p className="mt-2 text-[13px] opacity-70">
              {teaser.openDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}{' '}
              새 자리에서 다시 엽니다
            </p>
          </div>
        </div>
      </section>

      <div className="vs-container -mt-8 pb-16">
        <div className="mx-auto max-w-2xl space-y-6">
          <section aria-labelledby="hints-heading" className="vs-card p-6">
            <h2 id="hints-heading" className="vs-section-title text-center">
              힌트
            </h2>
            <ul className="mt-5 space-y-3">
              {teaser.hints.map((h, i) => (
                <li
                  key={h.id}
                  className="vs-rise flex items-start gap-4 rounded-[14px] bg-[var(--surface-alt)] p-4"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span aria-hidden className="text-[24px] leading-none">
                    {h.emoji}
                  </span>
                  <p className="text-[15px] leading-relaxed">{h.text}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="map-heading">
            <h2 id="map-heading" className="mb-3 text-center vs-section-title">
              대략 이 근처예요
            </h2>
            <BlurredMap radiusM={teaser.hintRadiusM} regionHint={teaser.toRegionHint} />
            <p className="mt-3 text-center text-[14px] font-semibold">{teaser.toRegionHint}</p>
            <p className="mt-1 text-center text-[12px] text-[var(--ink-muted)]">
              이전 전 자리: {teaser.fromAddress}
            </p>
          </section>

          <section className="vs-card p-6 text-center">
            <h2 className="vs-section-title">먼저 찾아오신 분께</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[var(--ink-muted)]">
              오픈 첫날, 이 페이지를 보여주시면 준비한 작은 선물을 드려요.
              <br />
              친구에게도 힌트를 공유해 보세요.
            </p>
            <div className="mt-5">
              <ShareBar storeName={teaser.storeName} />
            </div>
            <p className="mt-4 text-[12px] text-[var(--ink-muted)]">
              지금까지 {teaser.views.toLocaleString('ko-KR')}명이 이 힌트를 봤어요
            </p>
          </section>

          <section className="rounded-[16px] border border-[var(--line)] bg-[var(--brand-soft)] p-6 text-center">
            <p className="text-[13px] font-semibold text-[var(--brand-strong)]">
              이 매장은 빈자리로 열었습니다
            </p>
            <p className="mt-2 text-[15px] leading-relaxed">
              비어 있는 상가를 두 달만 빌려 장사해 보고,
              <br />
              잘되면 더 좋은 자리로 옮깁니다.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
              <Link href="/spaces" className="vs-btn vs-btn-primary">
                나도 두 달만 열어보기
              </Link>
              <Link href="/calculator" className="vs-btn vs-btn-secondary">
                내 예산으로 계산해 보기
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
