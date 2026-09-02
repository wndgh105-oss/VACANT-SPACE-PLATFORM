'use client'

import { useEffect, useState } from 'react'
import { ApplicationStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'

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

export default function ListingApplicationsPage({ params }: { params: { id: string } }) {
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    fetch(`/api/applications?listingId=${params.id}`)
      .then((res) => res.json())
      .then(setApplications)
  }, [params.id])

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-bold">신청 리스트</h1>
      {applications.length === 0 ? (
        <p className="text-gray-500">아직 들어온 신청이 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li key={app.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{app.applicantName} ({app.phone})</p>
                <StatusBadge kind="application" status={app.status} />
              </div>
              <p className="text-sm text-gray-600">
                희망 계약기간 {app.desiredDuration}개월 · 희망 시작일 {new Date(app.desiredStartDate).toLocaleDateString()}
              </p>
              {app.message && <p className="mt-1 text-sm">{app.message}</p>}
              <p className="mt-1 text-xs text-gray-400">{new Date(app.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
