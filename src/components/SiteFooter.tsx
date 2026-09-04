import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[var(--line)] bg-[var(--surface-alt)]">
      <div className="vs-container py-10">
        <div className="flex flex-wrap gap-8">
          <div className="min-w-[220px] flex-1">
            <p className="flex items-center gap-2 font-bold">
              <span aria-hidden className="inline-block h-4 w-4 rounded-[5px] bg-[var(--brand)]" />
              빈자리
            </p>
            <p className="mt-2 max-w-md text-[13px] leading-relaxed text-[var(--ink-muted)]">
              단기 임대형 공실 완화 · 모듈형 창업 렌탈 플랫폼. 공실은 기회가 되고, 창업은 가벼워집니다.
            </p>
          </div>
          <nav aria-label="푸터 메뉴" className="flex gap-10 text-[13px]">
            <div className="flex flex-col gap-2">
              <p className="font-semibold">서비스</p>
              <Link href="/spaces" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">공간 찾기</Link>
              <Link href="/calculator" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">예산 계산기</Link>
              <Link href="/register" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">공실 등록</Link>
            </div>
            <div className="flex flex-col gap-2">
              <p className="font-semibold">안내</p>
              <Link href="/guide/legal" className="text-[var(--ink-muted)] hover:text-[var(--ink)]">법률·인허가</Link>
            </div>
          </nav>
        </div>

        <p className="mt-8 rounded-[12px] border border-[var(--line)] bg-[var(--surface)] p-4 text-[12px] leading-relaxed text-[var(--ink-muted)]">
          본 사이트는 창업 아이디어 검증을 위한 <strong className="text-[var(--ink)]">MVP 데모</strong>입니다. 표시된 공간·상권
          정보·금액은 모두 가정된 예시이며 실제 매물이 아닙니다. 플랫폼은 중개·법률·세무 자문을 제공하지 않으며,
          단기 임대 계약 구조와 중개 적법성은 변호사·공인중개사 검토 전 단계입니다. 실제 결제·전자계약 기능은
          구현되어 있지 않습니다.
        </p>
      </div>
    </footer>
  )
}
