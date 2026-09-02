'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ApplyPage({ params }: { params: { id: string } }) {
  const { status } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ applicantName: '', phone: '', desiredDuration: 2, desiredStartDate: '', message: '' })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (status === 'loading') return <p className="p-4">불러오는 중...</p>

  if (status === 'unauthenticated') {
    router.push(`/login?callbackUrl=/tenant/listings/${params.id}/apply`)
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: params.id, ...form }),
    })
    if (res.status === 409) {
      setError('이미 이 공실에 신청하셨습니다.')
      return
    }
    if (!res.ok) {
      setError('신청 처리 중 문제가 발생했습니다.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md p-4 text-center">
        <p className="mb-4">운영팀이 확인 후 24~48시간 내 연락드립니다.</p>
        <a href="/tenant/my/applications" className="underline">
          신청 현황 보러가기
        </a>
      </main>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-3 p-4">
      <h1 className="text-xl font-bold">신청/상담 요청</h1>
      <input
        className="w-full rounded border p-2"
        placeholder="이름"
        value={form.applicantName}
        onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="연락처"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <select
        className="w-full rounded border p-2"
        value={form.desiredDuration}
        onChange={(e) => setForm({ ...form, desiredDuration: Number(e.target.value) })}
      >
        <option value={2}>2개월</option>
        <option value={4}>4개월</option>
        <option value={6}>6개월</option>
      </select>
      <input
        className="w-full rounded border p-2"
        type="date"
        value={form.desiredStartDate}
        onChange={(e) => setForm({ ...form, desiredStartDate: e.target.value })}
      />
      <textarea
        className="w-full rounded border p-2"
        placeholder="요청 메시지 (선택)"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded bg-black p-2 text-white" type="submit">
        신청하기
      </button>
    </form>
  )
}
