'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'TENANT' })
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.status === 409) {
      setError('이미 등록된 이메일입니다.')
      return
    }
    if (!res.ok) {
      setError('입력 값을 확인해주세요.')
      return
    }
    router.push('/login')
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-sm space-y-4 p-4">
      <h1 className="text-xl font-bold">회원가입</h1>
      <div className="flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded border p-2 ${form.role === 'TENANT' ? 'bg-black text-white' : ''}`}
          onClick={() => setForm({ ...form, role: 'TENANT' })}
        >
          창업자로 가입
        </button>
        <button
          type="button"
          className={`flex-1 rounded border p-2 ${form.role === 'LANDLORD' ? 'bg-black text-white' : ''}`}
          onClick={() => setForm({ ...form, role: 'LANDLORD' })}
        >
          건물주로 가입
        </button>
      </div>
      <input
        className="w-full rounded border p-2"
        placeholder="이름"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="이메일"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="비밀번호"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded bg-black p-2 text-white" type="submit">
        가입하기
      </button>
    </form>
  )
}
