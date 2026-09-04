import Link from 'next/link'

export const metadata = {
  title: '법률·인허가 안내 · 빈자리',
  description: '단기 임대형 창업 시 확인해야 할 법률·인허가 항목 안내 (법률 자문이 아님)',
}

const CHECKLISTS: Array<{ title: string; items: string[] }> = [
  {
    title: '공통 — 계약 전',
    items: [
      '건축물대장상 용도가 희망 업종을 허용하는지 확인 (근린생활시설 여부 등)',
      '임대인이 실제 소유자인지 등기부등본으로 확인',
      '기존 임차인의 유휴공간이라면 임대인의 서면 전대 동의서가 있는지 확인',
      '원상복구 범위를 계약서에 구체적으로 명시하고 입주 전 사진 기록',
      '계약 종료일, 중도 해지 조건, 보증금 정산 기준을 서면으로 확정',
    ],
  },
  {
    title: '카페·소형 식당',
    items: [
      '영업신고 (관할 시·군·구 위생부서)',
      '식품위생교육 이수',
      '보건증(건강진단결과서) 발급',
      '급수·배수·환기 시설 기준 충족 여부',
      '가스 사용 시 안전점검 및 시설 기준',
      '다중이용업소 해당 시 소방시설 및 안전시설완비증명',
    ],
  },
  {
    title: '팝업스토어·소매',
    items: [
      '사업자등록 (통신판매를 겸하면 통신판매업 신고)',
      '단기 사인물의 옥외광고물 관련 신고 필요 여부',
      '전기 용량이 조명·집기 사용량을 감당하는지 확인',
      '식품을 함께 판매한다면 식품 관련 인허가 별도 확인',
    ],
  },
  {
    title: '소형 사무실·스터디룸',
    items: [
      '사업자등록 및 임대차 관련 서류',
      '소방 피난 통로 확보 여부',
      '건물 관리규약상 해당 용도 사용이 허용되는지',
      '야간 이용 시 소음 민원 가능성',
    ],
  },
]

const LEGAL_ISSUES = [
  {
    tag: '공인중개사법',
    body: '대가를 받고 임대차를 알선하는 행위는 중개행위에 해당할 수 있습니다. 빈자리의 수수료 구조가 적법한지는 변호사·공인중개사 검토가 완료되지 않았습니다.',
  },
  {
    tag: '상가건물임대차보호법',
    body: '임차인의 계약갱신요구권과 권리금 회수기회 보호가 단기 계약에 어떻게 적용되는지, 계약 형태(임대차 / 시설이용계약 / 일시사용 임대차)에 따라 달라질 수 있습니다. 확정된 결론이 아닙니다.',
  },
  {
    tag: '식품위생법',
    body: '이용 기간이 짧다고 해서 영업신고·위생교육·시설기준이 면제되지 않습니다. 인허가 취득 책임은 이용자에게 있습니다.',
  },
  {
    tag: '전자금융거래법',
    body: '플랫폼이 보증금·이용료를 대신 보관하면 규제 대상이 될 수 있어, 현재 MVP는 어떠한 자금도 보관하지 않습니다.',
  },
  {
    tag: '개인정보보호법',
    body: '신분증·사업자등록증 등 민감한 서류는 MVP에서 수집하지 않습니다.',
  },
]

export default function LegalGuidePage() {
  return (
    <div className="vs-container py-8">
      <h1 className="text-[28px] font-bold tracking-tight">법률·인허가 안내</h1>
      <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-muted)]">
        짧게 빌린다고 해서 법적 의무가 줄어들지는 않습니다. 계약 전에 무엇을 확인해야 하는지 정리했습니다.
      </p>

      <div className="mt-6 rounded-[14px] border-2 border-[var(--warn)] bg-[var(--warn-soft)] p-5">
        <p className="text-[15px] font-bold text-[var(--warn)]">중요 고지</p>
        <p className="mt-2 text-[14px] leading-relaxed">
          이 페이지는 <strong>법률 자문이 아니라 일반 정보 안내</strong>입니다. 빈자리는 변호사·공인중개사·세무사·
          손해보험 전문가가 아니며, 개별 사안에 대한 적법성을 판단하거나 보장하지 않습니다. 실제 계약과
          인허가는 반드시 관할 관청 및 전문가와 확인하시기 바랍니다. 또한 본 서비스는{' '}
          <strong>MVP 데모</strong>로, 실제 중개·계약·결제 기능이 구현되어 있지 않습니다.
        </p>
      </div>

      <section className="mt-10" aria-labelledby="checklist-heading">
        <h2 id="checklist-heading" className="text-[22px] font-bold tracking-tight">
          업종별 확인 체크리스트
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {CHECKLISTS.map((c) => (
            <div key={c.title} className="vs-card p-5">
              <h3 className="text-[16px] font-bold">{c.title}</h3>
              <ul className="mt-3 space-y-2">
                {c.items.map((i) => (
                  <li key={i} className="flex gap-2 text-[14px] leading-relaxed">
                    <span aria-hidden className="text-[var(--brand)]">
                      □
                    </span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="issues-heading">
        <h2 id="issues-heading" className="text-[22px] font-bold tracking-tight">
          아직 확정되지 않은 법적 쟁점
        </h2>
        <p className="mb-4 mt-1 text-[14px] text-[var(--ink-muted)]">
          숨기지 않고 밝힙니다. 아래 항목은 모두 전문가 검토 전 단계입니다.
        </p>
        <ul className="space-y-3">
          {LEGAL_ISSUES.map((x) => (
            <li key={x.tag} className="vs-card p-5">
              <span className="vs-badge vs-badge-warn">{x.tag}</span>
              <p className="mt-2 text-[14px] leading-relaxed">{x.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-10 text-center">
        <Link href="/spaces" className="vs-btn vs-btn-primary">
          공간 둘러보기
        </Link>
      </div>
    </div>
  )
}
