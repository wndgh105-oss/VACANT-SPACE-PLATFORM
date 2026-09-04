import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListingCard } from '@/components/ListingCard'

const listing = {
  id: 'l1',
  address: '서울시 마포구 연남동',
  monthlyRent: 800000,
  businessTypes: ['CAFE' as const],
  status: 'OPEN' as const,
  photos: [],
}

describe('ListingCard', () => {
  it('renders address, formatted rent, and business type label', () => {
    render(<ListingCard listing={listing} />)
    expect(screen.getByText('서울시 마포구 연남동')).toBeInTheDocument()
    expect(screen.getByText('월 800,000원')).toBeInTheDocument()
    expect(screen.getByText('카페·디저트')).toBeInTheDocument()
  })
})
