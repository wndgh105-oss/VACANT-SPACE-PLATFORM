/**
 * 모든 페이지 상단에 상시 노출되는 데모 고지.
 * 실제 결제·법적 계약 체결로 오해되지 않도록 하는 필수 장치다.
 */
export function DemoBanner() {
  return (
    <div
      role="note"
      className="border-b border-[var(--line)] bg-[var(--surface-alt)] px-4 py-1.5 text-center text-[12px] leading-snug text-[var(--ink-muted)]"
    >
      <span className="font-semibold text-[var(--ink)]">MVP 데모</span>
      <span className="mx-2 opacity-50">·</span>
      실제 매물·결제·법적 계약이 아닙니다. 모든 금액은 가정된 예시입니다.
    </div>
  )
}
