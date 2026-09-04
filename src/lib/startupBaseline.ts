import { BusinessType } from '@prisma/client'

/**
 * 정식 창업(장기 임대 + 인테리어·장비 구매) 기준 비용 가정표.
 *
 * 이 값들은 실제 견적을 받아 산출한 것이 아니라 사업기획서
 * (docs/business/01_사업기획서.md 2-1절)의 **가정값**입니다.
 * 화면에는 항상 "가정 기준" 라벨과 함께 표시해야 합니다.
 */
export type StartupBaseline = {
  /** 평당 인테리어 비용 */
  interiorPerPyeong: number
  /** 장비 구매 비용 */
  equipment: number
  /** 보증금 = 월세 × 배수 */
  depositMultiple: number
  /** 권리금 */
  premium: number
  /** 초기 운영자금 = 월세 × 개월 */
  runwayMonths: number
}

export const STARTUP_BASELINE: Record<BusinessType, StartupBaseline> = {
  CAFE: {
    interiorPerPyeong: 1_500_000,
    equipment: 15_000_000,
    depositMultiple: 20,
    premium: 20_000_000,
    runwayMonths: 3,
  },
  RETAIL: {
    interiorPerPyeong: 900_000,
    equipment: 5_000_000,
    depositMultiple: 15,
    premium: 15_000_000,
    runwayMonths: 2,
  },
  OFFICE: {
    interiorPerPyeong: 700_000,
    equipment: 4_000_000,
    depositMultiple: 10,
    premium: 0,
    runwayMonths: 3,
  },
  STUDY: {
    interiorPerPyeong: 800_000,
    equipment: 6_000_000,
    depositMultiple: 10,
    premium: 0,
    runwayMonths: 3,
  },
  OTHER: {
    interiorPerPyeong: 800_000,
    equipment: 5_000_000,
    depositMultiple: 12,
    premium: 5_000_000,
    runwayMonths: 3,
  },
}

export type FullStartupBreakdown = {
  deposit: number
  premium: number
  interior: number
  equipment: number
  runway: number
  total: number
}

/**
 * 같은 공간을 정식(장기) 계약으로 창업했을 때의 초기 투입 비용을 가정 기준으로 산출한다.
 * 면적 단위는 평(坪)으로 취급한다.
 */
export function fullStartupCost(params: {
  area: number
  monthlyRent: number
  businessType: BusinessType
}): FullStartupBreakdown {
  const base = STARTUP_BASELINE[params.businessType] ?? STARTUP_BASELINE.OTHER
  const deposit = params.monthlyRent * base.depositMultiple
  const interior = Math.round(params.area * base.interiorPerPyeong)
  const runway = params.monthlyRent * base.runwayMonths
  const total = deposit + base.premium + interior + base.equipment + runway
  return {
    deposit,
    premium: base.premium,
    interior,
    equipment: base.equipment,
    runway,
    total,
  }
}
