import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminApplicationsPage from '@/app/admin/page'

const application = {
  id: 'a1',
  applicantName: '홍길동',
  phone: '010-0000-0000',
  desiredDuration: 6,
  desiredStartDate: '2026-10-01T00:00:00.000Z',
  createdAt: '2026-09-01T00:00:00.000Z',
  status: 'PENDING',
  listing: { id: 'l1', address: '서울시 강남구' },
}

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: () => Promise.resolve(body) } as Response
}

describe('AdminApplicationsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('leaves the displayed status unchanged and alerts when the PATCH request fails', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return Promise.resolve(jsonResponse([application]))
      }
      // PATCH call fails
      return Promise.resolve(jsonResponse({ error: 'forbidden' }, false))
    })
    vi.stubGlobal('fetch', fetchMock)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<AdminApplicationsPage />)

    const select = await screen.findByDisplayValue('요청 접수')
    await userEvent.selectOptions(select, '상담 중')

    await waitFor(() => expect(alertSpy).toHaveBeenCalled())
    // Status select should still reflect the original (unpersisted) status.
    expect(screen.getByDisplayValue('요청 접수')).toBeInTheDocument()
  })

  it('updates the displayed status when the PATCH request succeeds', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return Promise.resolve(jsonResponse([application]))
      }
      return Promise.resolve(jsonResponse({ ...application, status: 'CONTACTING' }, true))
    })
    vi.stubGlobal('fetch', fetchMock)
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    render(<AdminApplicationsPage />)

    const select = await screen.findByDisplayValue('요청 접수')
    await userEvent.selectOptions(select, '상담 중')

    await waitFor(() => expect(screen.getByDisplayValue('상담 중')).toBeInTheDocument())
    expect(alertSpy).not.toHaveBeenCalled()
  })
})
