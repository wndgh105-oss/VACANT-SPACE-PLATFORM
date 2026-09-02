import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/StatusBadge'

describe('StatusBadge', () => {
  it('renders the Korean label for an application status', () => {
    render(<StatusBadge kind="application" status="CONFIRMED" />)
    expect(screen.getByText('확정')).toBeInTheDocument()
  })

  it('renders the Korean label for a listing status', () => {
    render(<StatusBadge kind="listing" status="CLOSED" />)
    expect(screen.getByText('마감')).toBeInTheDocument()
  })
})
