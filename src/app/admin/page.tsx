'use client'

import { useEffect, useState } from 'react'
import { ApplicationStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'
import { applicationStatusLabel } from '@/lib/labels'

type ApplicationRow = {
  id: string
  applicantName: string
  phone: string
  desiredDuration: number
  desiredStartDate: string
  createdAt: string
  status: ApplicationStatus
  listing: { id: string; address: string }
}

const ALL_STATUSES: ApplicationStatus[] = ['PENDING', 'CONTACTING', 'CONFIRMED', 'REJECTED']

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')

  useEffect(() => {
    const query = statusFilter ? `?status=${statusFilter}` : ''
    fetch(`/api/applications${query}`)
      .then((res) => res.json())
      .then(setApplications)
  }, [statusFilter])

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    if (status === 'CONFIRMED') {
      const confirmed = window.confirm('이 공실이 자동으로 마감 처리됩니다. 계속할까요?')
      if (!confirmed) return
    }
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-xl font-bold">전체 신청 관리</h1>
      <div className="mb-4">
        <select
          className="rounded border p-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
        >
          <option value="">전체 상태</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {applicationStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {applications.length === 0 ? (
        <p className="text-gray-500">조건에 맞는 신청이 없어요.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">신청자</th>
              <th className="p-2">연락처</th>
              <th className="p-2">공실</th>
              <th className="p-2">희망기간</th>
              <th className="p-2">신청일</th>
              <th className="p-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b">
                <td className="p-2">{app.applicantName}</td>
                <td className="p-2">{app.phone}</td>
                <td className="p-2">{app.listing.address}</td>
                <td className="p-2">{app.desiredDuration}개월</td>
                <td className="p-2">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <select
                    className="rounded border p-1"
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {applicationStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                  <span className="ml-2">
                    <StatusBadge kind="application" status={app.status} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
