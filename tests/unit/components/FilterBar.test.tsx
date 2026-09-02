import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from '@/components/FilterBar'

describe('FilterBar', () => {
  it('calls onChange with the selected business type', async () => {
    const onChange = vi.fn()
    render(<FilterBar value={{}} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '카페' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ businessType: 'CAFE' }))
  })
})
