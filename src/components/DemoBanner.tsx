/**
 * 모든 페이지 상단에 상시 노출되는 데모 고지.
 * 실제 결제·법적 계약 체결로 오해되지 않도록 하는 필수 장치다.
 */
export function DemoBanner() {
  return (
    <div
      role="note"
      className="bg-[var(--ink)] px-4 py-2 text-center text-[13px] leading-snug text-[#E7ECF5]"
    >
      <span className="font-semibold text-white">MVP 데모</span>
      <span className="mx-2 opacity-50">|</span>
      실제 매물·실제 결제·법적 계약 체결이 아닙니다. 모든 금액과 상권 정보는 가정된 예시 데이터입니다.
    </div>
  )
}
