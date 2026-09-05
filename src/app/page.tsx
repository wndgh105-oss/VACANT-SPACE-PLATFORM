import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { SpaceCard } from '@/components/SpaceCard'
import { listingCardSelect } from '@/lib/listingSelect'
import { LandingSearch } from '@/components/LandingSearch'
import { manWon } from '@/lib/quote'

export const dynamic = 'force-dynamic'

const STEPS = [
  {
    n: '01',
    title: '조건으로 공실을 찾습니다',
    body: '지역·기간·예산·업종 가능 여부로 좁힙니다. 검색 결과에서부터 2개월 총비용이 보입니다.',
  },
  {
    n: '02',
    title: '장비를 패키지로 더합니다',
    body: '카페·팝업·사무실·스터디 스타터 패키지. 구매가 아니라 월 렌탈이라 반납하면 끝입니다.',
  },
  {
    n: '03',
    title: '총 얼마인지 한 화면에서 봅니다',
    body: '공간 + 장비 + 기간을 합친 견적서. 정식 창업 대비 얼마나 덜 드는지 함께 보여줍니다.',
  },
  {
    n: '04',
    title: '두 달 열어보고 결정합니다',
    body: '잘되면 연장하거나 더 좋은 자리로 이전하고, 아니면 낮은 손실로 정리합니다.',
  },
]

const PACKAGES = [
  { name: '카페 스타터', desc: '머신·그라인더·냉장고·POS·좌석', from: 650_000 },
  { name: '팝업스토어 스타터', desc: '진열대·행거·트랙조명·POS', from: 430_000 },
  { name: '소형 사무실 스타터', desc: '책상 4·복합기·회선·수납', from: 235_000 },
  { name: '스터디룸 스타터', desc: '회의 테이블·프로젝터·도어락', from: 225_000 },
]

export default async function LandingPage() {
  const listings = await prisma.listing.findMany({
    where: { status: 'OPEN' },
    orderBy: { createdAt: 'desc' },
    take: 3,
    select: listingCardSelect,
  })

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-[var(--line)] bg-gradient-to-b from-[var(--brand-soft)] to-[var(--bg)]">
        <div className="vs-container py-14 md:py-20">
          <div className="max-w-2xl">
            <span className="vs-badge vs-badge-brand">단기 임대형 공실 완화 · 모듈형 창업 렌탈</span>
            <h1 className="vs-rise mt-4 text-[26px] font-bold leading-[1.25] tracking-tight md:text-[36px]">
              일단, 두 달만 해볼까요?
              <br />
              <span className="text-[var(--brand)]">안 맞으면 사이즈 바꾸면 되니까요!</span>
            </h1>
            <p className="vs-rise mt-4 text-[14px] leading-relaxed text-[var(--ink-muted)] md:text-[15px]">
              보증금도 권리금도 없이 가볍게 시작하는 창업.
            </p>
          </div>

          <div className="vs-rise mt-8 max-w-3xl">
            <LandingSearch />
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-[var(--ink-muted)]">
            <span>· 무권리 매물만 취급</span>
            <span>· 보증금 최소화</span>
            <span>· 총비용 선공개</span>
          </div>
        </div>
      </section>

      {/* 비용 비교 */}
      <section className="vs-container py-14" aria-labelledby="cost-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="cost-heading" className="text-[26px] font-bold tracking-tight">
              창업이 어려운 건 아이디어가 아니라 초기비용입니다
            </h2>
            <p className="mt-2 text-[15px] text-[var(--ink-muted)]">
              서울 15평 카페 기준, 정식 창업과 빈자리 2개월 시험 운영의 차이입니다.
            </p>
          </div>
          <span className="vs-badge vs-badge-warn">가정 기준 · 예시 수치</span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="vs-card p-6">
            <p className="text-[13px] font-semibold text-[var(--ink-muted)]">정식 창업</p>
            <p className="mt-1 text-[34px] font-bold leading-tight">{manWon(107_500_000)}</p>
            <ul className="mt-4 space-y-2 text-[14px] text-[var(--ink-muted)]">
              <li className="flex justify-between"><span>보증금</span><span>3,000만 원</span></li>
              <li className="flex justify-between"><span>권리금</span><span>2,000만 원</span></li>
              <li className="flex justify-between"><span>인테리어</span><span>2,250만 원</span></li>
              <li className="flex justify-between"><span>장비 구매</span><span>1,500만 원</span></li>
              <li className="flex justify-between"><span>간판·집기</span><span>500만 원</span></li>
              <li className="flex justify-between"><span>초기 운영자금</span><span>1,500만 원</span></li>
            </ul>
            <p className="mt-4 rounded-[10px] bg-[var(--danger-soft)] p-3 text-[13px] font-semibold text-[var(--danger)]">
              실패 시 회수 불가 약 6,000만 원 이상
            </p>
          </div>

          <div className="vs-card border-[var(--brand)] p-6">
            <p className="text-[13px] font-semibold text-[var(--brand)]">빈자리 · 2개월 시험 운영</p>
            <p className="mt-1 text-[34px] font-bold leading-tight text-[var(--brand)]">
              {manWon(6_280_000)}
            </p>
            <ul className="mt-4 space-y-2 text-[14px] text-[var(--ink-muted)]">
              <li className="flex justify-between"><span>공간 이용료 2개월</span><span>300만 원</span></li>
              <li className="flex justify-between"><span>보증금 (반환)</span><span>150만 원</span></li>
              <li className="flex justify-between"><span>카페 장비 렌탈</span><span>130만 원</span></li>
              <li className="flex justify-between"><span>간판·사인물</span><span>30만 원</span></li>
              <li className="flex justify-between"><span>인허가 대행 알선</span><span>10만 원</span></li>
              <li className="flex justify-between"><span>배상책임보험</span><span>8만 원</span></li>
            </ul>
            <p className="mt-4 rounded-[10px] bg-[var(--ok-soft)] p-3 text-[13px] font-semibold text-[var(--ok)]">
              실패 시 손실 약 478만 원 · 위험 약 92% 감소
            </p>
          </div>
        </div>
      </section>

      {/* 작동 방식 */}
      <section className="border-y border-[var(--line)] bg-[var(--surface-alt)]" aria-labelledby="how-heading">
        <div className="vs-container py-14">
          <h2 id="how-heading" className="text-[26px] font-bold tracking-tight">
            어떻게 하나요
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                className="vs-card vs-rise p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <p className="text-[13px] font-bold text-[var(--brand)]">{s.n}</p>
                <p className="mt-1 text-[16px] font-bold">{s.title}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-muted)]">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 장비 패키지 */}
      <section className="vs-container py-14" aria-labelledby="pkg-heading">
        <h2 id="pkg-heading" className="text-[26px] font-bold tracking-tight">
          업종별 모듈형 장비 패키지
        </h2>
        <p className="mt-2 text-[15px] text-[var(--ink-muted)]">
          필요 없는 품목은 빼고, 필요한 것만 월 단위로 빌립니다.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKAGES.map((p, i) => (
            <div key={p.name} className="vs-card vs-rise p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="text-[16px] font-bold">{p.name}</p>
              <p className="mt-1 text-[13px] text-[var(--ink-muted)]">{p.desc}</p>
              <p className="mt-3 text-[18px] font-bold text-[var(--brand)]">
                월 {p.from.toLocaleString('ko-KR')}원~
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 추천 공간 */}
      {listings.length > 0 && (
        <section className="vs-container pb-14" aria-labelledby="rec-heading">
          <div className="flex items-end justify-between gap-3">
            <h2 id="rec-heading" className="text-[26px] font-bold tracking-tight">
              지금 비어 있는 공간
            </h2>
            <Link href="/spaces" className="text-[14px] font-semibold text-[var(--brand)]">
              전체 보기 →
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l, i) => (
              <SpaceCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* 신뢰 */}
      <section className="border-t border-[var(--line)] bg-[var(--surface-alt)]" aria-labelledby="trust-heading">
        <div className="vs-container py-14">
          <h2 id="trust-heading" className="text-[26px] font-bold tracking-tight">
            짧게 빌린다고 대충 하지 않습니다
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { t: '현장 실사 100%', d: '등록된 모든 공간을 운영자가 직접 확인한 뒤 노출합니다.' },
              { t: '원상복구 사전 합의', d: '입주 전후 사진을 남기고 복구 범위를 계약 전에 서면으로 정합니다.' },
              { t: '인허가 체크리스트', d: '업종별로 필요한 신고·교육·시설 요건을 미리 안내합니다.' },
              { t: '본인 인증 표시', d: '건물주와 창업자의 인증 상태를 화면에 명시합니다.' },
            ].map((x) => (
              <div key={x.t} className="vs-card p-5">
                <p className="text-[15px] font-bold">{x.t}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-muted)]">{x.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 text-[13px] leading-relaxed text-[var(--ink-muted)]">
            <strong className="text-[var(--ink)]">법적 고지</strong> — 단기 임대 계약의 형태, 중개 수수료 수취 구조,
            상가건물임대차보호법 적용 여부는 <strong className="text-[var(--ink)]">변호사·공인중개사 검토 전 단계</strong>입니다.
            빈자리는 인허가·세무·보험에 대한 자문을 제공하지 않으며, 관련 판단은 이용자와 전문가의 책임입니다.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="vs-container py-16 text-center">
        <h2 className="text-[28px] font-bold tracking-tight md:text-[34px]">
          공실은 기회가 되고, 창업은 가벼워집니다
        </h2>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/spaces" className="vs-btn vs-btn-primary !px-7 !py-3.5 !text-[16px]">
            공간 둘러보기
          </Link>
          <Link href="/calculator" className="vs-btn vs-btn-secondary !px-7 !py-3.5 !text-[16px]">
            내 예산으로 뭘 할 수 있는지 보기
          </Link>
        </div>
      </section>
    </div>
  )
}
