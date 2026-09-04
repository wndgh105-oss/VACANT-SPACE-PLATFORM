import { BusinessType } from '@prisma/client'
import { fullStartupCost, FullStartupBreakdown } from './startupBaseline'

/** 일회성 부가 옵션. MVP에서는 고정 카탈로그이며 실제 발주는 일어나지 않는다(데모). */
export type Addon = {
  id: string
  label: string
  onceFee: number
  note: string
}

export const ADDONS: Addon[] = [
  {
    id: 'signage',
    label: '단기 부착형 간판·사인물',
    onceFee: 300_000,
    note: '철거 시 원상복구가 쉬운 탈부착 방식',
  },
  {
    id: 'permit',
    label: '영업신고·위생교육 대행 알선',
    onceFee: 100_000,
    note: '인허가 결과를 보장하지 않으며 대행사 연결만 제공',
  },
  {
    id: 'insurance',
    label: '배상책임보험 연계 (2개월분)',
    onceFee: 80_000,
    note: '실제 청약은 제휴 대리점에서 별도 진행',
  },
  {
    id: 'cleaning',
    label: '입·퇴점 청소 및 사진 검수',
    onceFee: 150_000,
    note: '원상복구 분쟁 예방용 전/후 사진 기록',
  },
]

export function findAddons(ids: string[]): Addon[] {
  return ADDONS.filter((a) => ids.includes(a.id))
}

export type QuoteInput = {
  months: number
  monthlyRent: number
  maintenanceFee: number
  deposit: number
  area: number
  businessType: BusinessType
  /** 선택된 장비 품목들의 월 합계 */
  equipmentMonthly: number
  /** 선택된 부가 옵션 id 목록 */
  addonIds: string[]
}

export type QuoteResult = {
  months: number
  spaceTotal: number
  maintenanceTotal: number
  equipmentTotal: number
  addonTotal: number
  depositAmount: number
  /** 보증금을 제외한 실제 지출 합계 */
  grandTotal: number
  /** 계약 시점에 필요한 현금 (보증금 포함) */
  needCash: number
  monthlyAvg: number
  fullStartup: FullStartupBreakdown
  savedVsFull: number
  /** 0~1 */
  savedRate: number
}

const clampMonths = (m: number) => Math.min(12, Math.max(1, Math.round(m || 1)))

/**
 * 견적 계산의 단일 진실 공급원.
 * 클라이언트는 이 함수의 결과를 표시만 하고, 금액을 직접 계산하지 않는다.
 */
export function computeQuote(input: QuoteInput): QuoteResult {
  const months = clampMonths(input.months)
  const spaceTotal = input.monthlyRent * months
  const maintenanceTotal = input.maintenanceFee * months
  const equipmentTotal = input.equipmentMonthly * months
  const addonTotal = findAddons(input.addonIds).reduce((sum, a) => sum + a.onceFee, 0)

  const grandTotal = spaceTotal + maintenanceTotal + equipmentTotal + addonTotal
  const needCash = grandTotal + input.deposit

  const fullStartup = fullStartupCost({
    area: input.area,
    monthlyRent: input.monthlyRent,
    businessType: input.businessType,
  })
  const savedVsFull = Math.max(0, fullStartup.total - needCash)
  const savedRate = fullStartup.total > 0 ? savedVsFull / fullStartup.total : 0

  return {
    months,
    spaceTotal,
    maintenanceTotal,
    equipmentTotal,
    addonTotal,
    depositAmount: input.deposit,
    grandTotal,
    needCash,
    monthlyAvg: Math.round(grandTotal / months),
    fullStartup,
    savedVsFull,
    savedRate,
  }
}

/** "1,250,000원" */
export function won(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`
}

/** "1,250만 원" — 큰 금액을 요약 표기할 때 */
export function manWon(value: number): string {
  const man = Math.round(value / 10_000)
  if (man >= 10_000) {
    const eok = Math.floor(man / 10_000)
    const rest = man % 10_000
    return rest === 0 ? `${eok}억 원` : `${eok}억 ${rest.toLocaleString('ko-KR')}만 원`
  }
  return `${man.toLocaleString('ko-KR')}만 원`
}
