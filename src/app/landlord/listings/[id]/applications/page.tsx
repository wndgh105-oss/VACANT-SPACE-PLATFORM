'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ApplicationStatus } from '@prisma/client'
import { applicationStatusLabel } from '@/lib/labels'

type Application = {
  id: string
  applicantName: string
  phone: string
  desiredDuration: number
  desiredStartDate: string
  message: string | null
  status: ApplicationStatus
  createdAt: string
}

const NEXT_ACTIONS: Partial<Record<ApplicationStatus, Array<{ to: ApplicationStatus; label: string; primary?: boolean }>>> =
  {
    PENDING: [
      { to: 'CONTACTING', label: '상담 시작', primary: true },
      { to: 'REJECTED', label: '반려' },
    ],
    CONTACTING: [
      { to: 'CONFIRMED', label: '계약 확정', primary: true },
      { to: 'REJECTED', label: '반려' },
    ],
    CONFIRMED: [{ to: 'CONTACTING', label: '확정 취소' }],
    REJECTED: [{ to: 'PENDING', label: '다시 검토' }],
  }

export default function ListingApplicationsPage({ params }: { params: { id: string } }) {
  const [applications, setApplications] = useState<Application[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch(`/api/applications?listingId=${params.id}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setApplications)
      .catch(() => setApplications([]))
  }, [params.id])

  useEffect(load, [load])

  async function changeStatus(id: string, status: ApplicationStatus) {
    setError(null)
    setNotice(null)
    setBusyId(id)
    try {
      const res = await fetch(`/api/landlord/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('상태를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.')
      setApplications((prev) => prev?.map((a) => (a.id === id ? { ...a, status } : a)) ?? null)
      setNotice(
        status === 'CONFIRMED'
          ? '계약을 확정했습니다. 이 공실은 마감 처리되고 이용 계약이 생성됐어요. (데모 처리이며 법적 계약이 아닙니다)'
          : `상태를 "${applicationStatusLabel(status)}"(으)로 바꿨습니다.`
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="vs-container py-8">
      <Link href="/landlord" className="text-[13px] text-[var(--ink-muted)] hover:text-[var(--ink)]">
        ← 내 공실로
      </Link>
      <h1 className="mt-3 text-[28px] font-bold tracking-tight">이 공실에 들어온 요청</h1>
      <p className="mb-6 mt-1 text-[14px] text-[var(--ink-muted)]">
        상담을 거쳐 확정하면 이용 계약이 생성되고 공실은 자동으로 마감됩니다.
      </p>

      {error && (
        <p role="alert" className="mb-4 rounded-[10px] bg-[var(--danger-soft)] p-3 text-[13px] text-[var(--danger)]">
          {error}
        </p>
      )}
      {notice && (
        <p aria-live="polite" className="mb-4 rounded-[10px] bg-[var(--ok-soft)] p-3 text-[13px] text-[var(--ok)]">
          {notice}
        </p>
      )}

      {applications === null ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="vs-skeleton h-24 w-full" />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <p className="vs-card p-10 text-center text-[14px] text-[var(--ink-muted)]">
          아직 들어온 요청이 없어요.
        </p>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li key={app.id} className="vs-card p-5">
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[17px] font-bold">
                    {app.applicantName}{' '}
                    <span className="text-[13px] font-normal text-[var(--ink-muted)]">{app.phone}</span>
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
                    {app.desiredDuration}개월 희망 · 시작{' '}
                    {new Date(app.desiredStartDate).toLocaleDateString('ko-KR')} · 요청{' '}
                    {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <span
                  className={`vs-badge ${
                    app.status === 'CONFIRMED'
                      ? 'vs-badge-ok'
                      : app.status === 'REJECTED'
                        ? 'vs-badge-danger'
                        : 'vs-badge-brand'
                  }`}
                >
                  {applicationStatusLabel(app.status)}
                </span>
              </div>

              {app.message && (
                <p className="mt-3 rounded-[10px] bg-[var(--surface-alt)] p-3 text-[14px] leading-relaxed">
                  {app.message}
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {(NEXT_ACTIONS[app.status] ?? []).map((action) => (
                  <button
                    key={action.to}
                    type="button"
                    disabled={busyId === app.id}
                    onClick={() => changeStatus(app.id, action.to)}
                    className={`vs-btn !px-4 !py-2 !text-[13px] ${
                      action.primary ? 'vs-btn-primary' : 'vs-btn-secondary'
                    }`}
                  >
                    {busyId === app.id ? '처리 중…' : action.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
