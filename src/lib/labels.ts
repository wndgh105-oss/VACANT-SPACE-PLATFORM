import {
  BusinessType,
  ApplicationStatus,
  ListingStatus,
  Role,
  TenancyStatus,
} from '@prisma/client'

export function businessTypeLabel(type: BusinessType): string {
  const map: Record<BusinessType, string> = {
    CAFE: '카페·디저트',
    RETAIL: '팝업·소매',
    OFFICE: '소형 사무실',
    STUDY: '스터디·모임',
    OTHER: '기타',
  }
  return map[type]
}

/** 장비 패키지 표시명 */
export function packageLabel(type: BusinessType): string {
  const map: Record<BusinessType, string> = {
    CAFE: '카페 스타터',
    RETAIL: '팝업스토어 스타터',
    OFFICE: '소형 사무실 스타터',
    STUDY: '스터디룸 스타터',
    OTHER: '기본 스타터',
  }
  return map[type]
}

export function applicationStatusLabel(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    PENDING: '요청 접수',
    CONTACTING: '상담 중',
    CONFIRMED: '계약 확정',
    REJECTED: '반려',
  }
  return map[status]
}

export function listingStatusLabel(status: ListingStatus): string {
  const map: Record<ListingStatus, string> = {
    PENDING_REVIEW: '실사 대기',
    OPEN: '공개중',
    CLOSED: '마감',
  }
  return map[status]
}

export function roleLabel(role: Role): string {
  const map: Record<Role, string> = {
    TENANT: '창업자',
    LANDLORD: '건물주',
    PARTNER: '장비 파트너',
    ADMIN: '운영자',
  }
  return map[role]
}

export function tenancyStatusLabel(status: TenancyStatus): string {
  const map: Record<TenancyStatus, string> = {
    ACTIVE: '운영 중',
    ENDED: '종료',
    EXTENDED: '연장됨',
    RELOCATED: '이전함',
  }
  return map[status]
}
