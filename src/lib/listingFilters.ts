import { Prisma, BusinessType } from '@prisma/client'

export type ListingFilters = {
  minPrice?: number
  maxPrice?: number
  businessType?: BusinessType
  duration?: number
}

export function parseListingFilters(searchParams: URLSearchParams): ListingFilters {
  const filters: ListingFilters = {}
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const businessType = searchParams.get('businessType')
  const duration = searchParams.get('duration')

  if (minPrice) filters.minPrice = Number(minPrice)
  if (maxPrice) filters.maxPrice = Number(maxPrice)
  if (businessType) filters.businessType = businessType as BusinessType
  if (duration) filters.duration = Number(duration)

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
  if (filters.businessType) {
    where.businessTypes = { has: filters.businessType }
  }
  if (filters.duration !== undefined) {
    where.contractDurations = { has: filters.duration }
  }

  return where
}
