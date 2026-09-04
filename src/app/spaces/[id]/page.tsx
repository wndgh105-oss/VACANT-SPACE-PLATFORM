import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { businessTypeLabel } from '@/lib/labels'
import { manWon, won } from '@/lib/quote'
import { fullStartupCost } from '@/lib/startupBaseline'

export const dynamic = 'force-dynamic'

export default async function SpaceDetailPage({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { landlord: { select: { name: true, verified: true } } },
  })

  if (!listing || listing.status === 'PENDING_REVIEW') notFound()

  const primaryType = listing.recommendedTypes[0] ?? listing.businessTypes[0] ?? 'OTHER'
  const baseline = fullStartupCost({
    area: listing.area,
    monthlyRent: listing.monthlyRent,
    businessType: primaryType,
  })
  const twoMonth = (listing.monthlyRent + listing.maintenanceFee) * 2

  const specs: Array<{ label: string; value: string }> = [
    { label: '면적', value: `${listing.area}평` },
    { label: '월 이용료', value: won(listing.monthlyRent) },
    { label: '보증금', value: won(listing.deposit) },
    { label: '관리비', value: listing.maintenanceFee ? `${won(listing.maintenanceFee)}/월` : '없음' },
    {
      label: '계약 가능 기간',
      value: listing.contractDurations.length
        ? listing.contractDurations.map((d) => `${d}개월`).join(' · ')
        : '협의',
    },
    { label: '전기 용량', value: listing.powerKw ? `${listing.powerKw}kW` : '확인 필요' },
    { label: '가스', value: listing.hasGas ? '있음' : '없음' },
    { label: '배수', value: listing.hasDrain ? '있음' : '없음' },
    { label: '주차', value: listing.parking ? '가능' : '불가' },
    { label: '입주', value: listing.immediateMoveIn ? '즉시 입주 가능' : '협의 필요' },
  ]

  return (
    <div className="vs-container py-6">
      <Link href="/spaces" className="text-[13px] text-[var(--ink-muted)] hover:text-[var(--ink)]">
        ← 공간 목록으로
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="min-w-0 space-y-6">
          {/* 사진 */}
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="vs-card overflow-hidden sm:col-span-2 sm:row-span-2">
              {listing.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listing.photos[0]}
                  alt={`${listing.title ?? listing.address} 대표 이미지 (예시)`}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-[var(--surface-alt)] text-[13px] text-[var(--ink-muted)]">
                  사진 준비 중인 공간
                </div>
              )}
            </div>
            {listing.photos.slice(1, 3).map((p, i) => (
              <div key={p} className="vs-card overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p}
                  alt={`${listing.title ?? listing.address} 추가 이미지 ${i + 1} (예시)`}
                  className="aspect-[4/3] w-full object-cover"
                />
              </div>
            ))}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {listing.immediateMoveIn && <span className="vs-badge vs-badge-brand">즉시 입주</span>}
              {listing.landlord.verified && <span className="vs-badge vs-badge-ok">건물주 인증 완료</span>}
              <span className="vs-badge">현장 실사 완료</span>
            </div>
            <h1 className="mt-2 text-[26px] font-bold leading-snug tracking-tight">
              {listing.title ?? listing.address}
            </h1>
            <p className="mt-1 text-[14px] text-[var(--ink-muted)]">{listing.address}</p>
            {listing.description && (
              <p className="mt-3 text-[15px] leading-relaxed">{listing.description}</p>
            )}
          </div>

          {/* 조건 */}
          <section aria-labelledby="spec-heading" className="vs-card p-5">
            <h2 id="spec-heading" className="vs-section-title">
              공간 조건
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              {specs.map((s) => (
                <div key={s.label}>
                  <dt className="text-[12px] text-[var(--ink-muted)]">{s.label}</dt>
                  <dd className="text-[15px] font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* 상권 요약 */}
          {listing.areaSummary && (
            <section aria-labelledby="area-heading" className="vs-card p-5">
              <div className="flex items-center gap-2">
                <h2 id="area-heading" className="vs-section-title">
                  주변 상권 요약
                </h2>
                <span className="vs-badge vs-badge-warn">예시 데이터</span>
              </div>
              <p className="mt-3 text-[15px] leading-relaxed">{listing.areaSummary}</p>
              <p className="mt-3 text-[12px] text-[var(--ink-muted)]">
                공공 상권 데이터와 연동되지 않은 가상의 요약입니다. 실제 창업 판단에 사용하지 마세요.
              </p>
            </section>
          )}

          {/* 추천 업종 */}
          <section aria-labelledby="rec-heading" className="vs-card p-5">
            <h2 id="rec-heading" className="vs-section-title">
              이 공간에 어울리는 업종
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(listing.recommendedTypes.length ? listing.recommendedTypes : listing.businessTypes).map(
                (t) => (
                  <span key={t} className="vs-badge vs-badge-brand !text-[13px] !px-3 !py-1.5">
                    {businessTypeLabel(t)}
                  </span>
                )
              )}
            </div>
            <p className="mt-3 text-[13px] text-[var(--ink-muted)]">
              허용 업종: {listing.businessTypes.map(businessTypeLabel).join(', ')}
            </p>
          </section>
        </div>

        {/* 비용 요약 (sticky) */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="vs-card p-5">
            <p className="text-[13px] text-[var(--ink-muted)]">2개월 이용 기준 예상</p>
            <p className="mt-1 text-[30px] font-bold leading-tight text-[var(--brand)]">
              {won(twoMonth)}
            </p>
            <p className="text-[13px] text-[var(--ink-muted)]">
              월 {won(listing.monthlyRent + listing.maintenanceFee)} · 보증금{' '}
              {won(listing.deposit)} 별도 (종료 시 반환)
            </p>

            <div className="mt-4 rounded-[12px] bg-[var(--surface-alt)] p-4">
              <div className="flex items-center gap-2">
                <p className="text-[13px] font-semibold">같은 자리를 정식 창업했다면</p>
                <span className="vs-badge vs-badge-warn">가정 기준</span>
              </div>
              <p className="mt-1 text-[20px] font-bold">{manWon(baseline.total)}</p>
              <ul className="mt-2 space-y-1 text-[12px] text-[var(--ink-muted)]">
                <li>보증금 {manWon(baseline.deposit)} · 권리금 {manWon(baseline.premium)}</li>
                <li>인테리어 {manWon(baseline.interior)} · 장비 {manWon(baseline.equipment)}</li>
                <li>초기 운영자금 {manWon(baseline.runway)}</li>
              </ul>
            </div>

            <Link
              href={`/spaces/${listing.id}/quote`}
              className="vs-btn vs-btn-primary mt-5 w-full"
            >
              이 공간으로 견적 만들기
            </Link>
            <p className="mt-3 text-center text-[12px] text-[var(--ink-muted)]">
              장비 패키지를 더해 총비용을 계산합니다
            </p>
          </div>

          <div className="vs-card mt-4 p-5">
            <h2 className="text-[15px] font-bold">계약 전 확인할 것</h2>
            <ul className="mt-3 space-y-2 text-[13px] text-[var(--ink-muted)]">
              <li>· 건축물 용도가 희망 업종을 허용하는지</li>
              <li>· 영업신고·위생교육 등 인허가 요건</li>
              <li>· 소방·안전 기준 해당 여부</li>
              <li>· 원상복구 범위와 보증금 정산 기준</li>
            </ul>
            <Link href="/guide/legal" className="vs-btn vs-btn-secondary mt-4 w-full">
              법률·인허가 안내 보기
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
