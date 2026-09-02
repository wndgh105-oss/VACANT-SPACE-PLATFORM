import { describe, it, expect } from 'vitest'
import { computeListingStatusUpdate } from '@/lib/applicationStatusTransition'

describe('computeListingStatusUpdate', () => {
  it('returns CLOSED when transitioning into CONFIRMED', () => {
    expect(computeListingStatusUpdate('PENDING', 'CONFIRMED')).toBe('CLOSED')
  })

  it('returns OPEN when transitioning out of CONFIRMED', () => {
    expect(computeListingStatusUpdate('CONFIRMED', 'REJECTED')).toBe('OPEN')
    expect(computeListingStatusUpdate('CONFIRMED', 'PENDING')).toBe('OPEN')
  })

  it('returns null when the transition does not involve CONFIRMED', () => {
    expect(computeListingStatusUpdate('PENDING', 'CONTACTING')).toBeNull()
    expect(computeListingStatusUpdate('CONTACTING', 'REJECTED')).toBeNull()
  })

  it('returns null when status stays CONFIRMED', () => {
    expect(computeListingStatusUpdate('CONFIRMED', 'CONFIRMED')).toBeNull()
  })
})
