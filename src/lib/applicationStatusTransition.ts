import { ApplicationStatus, ListingStatus } from '@prisma/client'

export function computeListingStatusUpdate(
  previousStatus: ApplicationStatus,
  nextStatus: ApplicationStatus
): ListingStatus | null {
  if (previousStatus !== 'CONFIRMED' && nextStatus === 'CONFIRMED') {
    return 'CLOSED'
  }
  if (previousStatus === 'CONFIRMED' && nextStatus !== 'CONFIRMED') {
    return 'OPEN'
  }
  return null
}
