import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecommendWidget } from '@/components/RecommendWidget'

describe('RecommendWidget', () => {
  it('walks through 3 steps and calls onComplete with combined answers', async () => {
    const onComplete = vi.fn()
    render(<RecommendWidget onComplete={onComplete} onSkip={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: '~500,000원' }))
    await userEvent.click(screen.getByRole('button', { name: '카페·디저트' }))
    await userEvent.click(screen.getByRole('button', { name: '즉시' }))

    expect(onComplete).toHaveBeenCalledWith({ maxPrice: 500000, businessType: 'CAFE' })
  })

  it('calls onSkip when skip button is clicked', async () => {
    const onSkip = vi.fn()
    render(<RecommendWidget onComplete={vi.fn()} onSkip={onSkip} />)
    await userEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
    expect(onSkip).toHaveBeenCalled()
  })
})
