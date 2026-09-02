'use client'

import { useEffect, useState } from 'react'
import { ApplicationStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'

type ApplicationRow = {
  id: string
  status: ApplicationStatus
  createdAt: string
  listing: { id: string; address: string; photos: string[] }
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([])

  useEffect(() => {
    fetch('/api/applications')
      .then((res) => res.json())
      .then(setApplications)
  }, [])

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-bold">신청 현황</h1>
      {applications.length === 0 ? (
        <p className="text-gray-500">아직 신청한 공실이 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {applications.map((app) => (
            <li key={app.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <p className="font-medium">{app.listing.address}</p>
                <p className="text-sm text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
              <StatusBadge kind="application" status={app.status} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
