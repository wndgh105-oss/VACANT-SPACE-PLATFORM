import { Prisma, BusinessType } from '@prisma/client'

export type ListingFilters = {
  minPrice?: number
  maxPrice?: number
  businessType?: BusinessType
  duration?: number
  region?: string
  maxDeposit?: number
  minArea?: number
  parking?: boolean
  gas?: boolean
  drain?: boolean
  immediate?: boolean
  minPowerKw?: number
}

const numeric = (raw: string | null): number | undefined => {
  if (raw === null || raw.trim() === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

const flag = (raw: string | null): boolean | undefined =>
  raw === '1' || raw === 'true' ? true : undefined

export function parseListingFilters(searchParams: URLSearchParams): ListingFilters {
  const filters: ListingFilters = {}

  const minPrice = numeric(searchParams.get('minPrice'))
  const maxPrice = numeric(searchParams.get('maxPrice'))
  const duration = numeric(searchParams.get('duration'))
  const maxDeposit = numeric(searchParams.get('maxDeposit'))
  const minArea = numeric(searchParams.get('minArea'))
  const minPowerKw = numeric(searchParams.get('minPowerKw'))
  const businessType = searchParams.get('businessType')
  const region = searchParams.get('region')

  if (minPrice !== undefined) filters.minPrice = minPrice
  if (maxPrice !== undefined) filters.maxPrice = maxPrice
  if (duration !== undefined) filters.duration = duration
  if (maxDeposit !== undefined) filters.maxDeposit = maxDeposit
  if (minArea !== undefined) filters.minArea = minArea
  if (minPowerKw !== undefined) filters.minPowerKw = minPowerKw
  if (businessType) filters.businessType = businessType as BusinessType
  if (region) filters.region = region

  const parking = flag(searchParams.get('parking'))
  const gas = flag(searchParams.get('gas'))
  const drain = flag(searchParams.get('drain'))
  const immediate = flag(searchParams.get('immediate'))
  if (parking) filters.parking = parking
  if (gas) filters.gas = gas
  if (drain) filters.drain = drain
  if (immediate) filters.immediate = immediate

  return filters
}

export function buildListingWhere(filters: ListingFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: 'OPEN' }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.monthlyRent = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
    }
  }
  if (filters.maxDeposit !== undefined) {
    where.deposit = { lte: filters.maxDeposit }
  }
  if (filters.minArea !== undefined) {
    where.area = { gte: filters.minArea }
  }
  if (filters.minPowerKw !== undefined) {
    where.powerKw = { gte: filters.minPowerKw }
  }
  if (filters.businessType) {
    where.businessTypes = { has: filters.businessType }
  }
  if (filters.duration !== undefined) {
    where.contractDurations = { has: filters.duration }
  }
  if (filters.region) {
    where.region = filters.region
  }
  if (filters.parking) where.parking = true
  if (filters.gas) where.hasGas = true
  if (filters.drain) where.hasDrain = true
  if (filters.immediate) where.immediateMoveIn = true

  return where
}

/** 조건을 완화했을 때 결과가 늘어나는지 안내하기 위한 제안 목록 */
export function relaxationSuggestions(filters: ListingFilters): string[] {
  const out: string[] = []
  if (filters.maxPrice !== undefined) {
    out.push(`월 예산을 ${((filters.maxPrice + 200_000) / 10_000).toLocaleString('ko-KR')}만 원까지 올려보기`)
  }
  if (filters.region) out.push('지역 조건 해제하기')
  if (filters.immediate) out.push('즉시 입주 조건 해제하기')
  if (filters.parking) out.push('주차 조건 해제하기')
  if (filters.duration !== undefined) out.push('계약 기간 조건 해제하기')
  return out
}
