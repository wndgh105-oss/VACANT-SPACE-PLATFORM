import { ApplicationStatus, ListingStatus } from '@prisma/client'
import { applicationStatusLabel, listingStatusLabel } from '@/lib/labels'

type Props =
  | { kind: 'application'; status: ApplicationStatus }
  | { kind: 'listing'; status: ListingStatus }

export function StatusBadge(props: Props) {
  const label = props.kind === 'application'
    ? applicationStatusLabel(props.status)
    : listingStatusLabel(props.status)

  const colorClass =
    props.status === 'CONFIRMED' || props.status === 'OPEN'
      ? 'bg-green-100 text-green-800'
      : props.status === 'REJECTED' || props.status === 'CLOSED'
        ? 'bg-gray-200 text-gray-600'
        : 'bg-yellow-100 text-yellow-800'

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
