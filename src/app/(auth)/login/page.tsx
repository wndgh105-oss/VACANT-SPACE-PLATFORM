'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      return
    }
    if (!result?.ok) {
      setError('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }
    router.push(searchParams.get('callbackUrl') ?? '/')
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-sm space-y-4 p-4">
      <h1 className="text-xl font-bold">로그인</h1>
      <input
        className="w-full rounded border p-2"
        placeholder="이메일"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded bg-black p-2 text-white" type="submit">
        로그인
      </button>
    </form>
  )
}
