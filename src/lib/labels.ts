import { BusinessType, ApplicationStatus, ListingStatus } from '@prisma/client'

export function businessTypeLabel(type: BusinessType): string {
  const map: Record<BusinessType, string> = {
    CAFE: '카페',
    RETAIL: '소매·팝업',
    OTHER: '기타',
  }
  return map[type]
}

export function applicationStatusLabel(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    PENDING: '대기중',
    CONTACTING: '연락중',
    CONFIRMED: '확정',
    REJECTED: '반려',
  }
  return map[status]
}

export function listingStatusLabel(status: ListingStatus): string {
  const map: Record<ListingStatus, string> = {
    OPEN: '공개중',
    CLOSED: '마감',
  }
  return map[status]
}
