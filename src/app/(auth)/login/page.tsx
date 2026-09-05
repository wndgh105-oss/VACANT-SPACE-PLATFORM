'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

const DEMO_ACCOUNTS = [
  { role: '창업자', email: 'tenant@demo.kr', desc: '공간 탐색·견적·이전 티저' },
  { role: '건물주', email: 'landlord@demo.kr', desc: '공실 등록·요청 관리' },
  { role: '장비 파트너', email: 'partner@demo.kr', desc: '패키지·주문 확인' },
  { role: '운영자', email: 'admin@demo.kr', desc: '실사 승인·전체 관리' },
]
const DEMO_PASSWORD = 'demo1234'

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
  const [busy, setBusy] = useState(false)

  async function login(nextEmail: string, nextPassword: string) {
    setError(null)
    setBusy(true)
    try {
      const result = await signIn('credentials', {
        email: nextEmail,
        password: nextPassword,
        redirect: false,
      })
      if (result?.error) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
        return
      }
      if (!result?.ok) {
        setError('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.')
        return
      }
      router.push(searchParams.get('callbackUrl') ?? '/')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await login(email, password)
  }

  return (
    <div className="vs-container grid max-w-4xl gap-6 py-12 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="vs-card h-fit p-6">
        <h1 className="text-[24px] font-bold tracking-tight">로그인</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
          빈자리에 오신 것을 환영합니다.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="vs-label" htmlFor="login-email">
              이메일
            </label>
            <input
              id="login-email"
              className="vs-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="vs-label" htmlFor="login-password">
              비밀번호
            </label>
            <input
              id="login-password"
              className="vs-input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-[var(--danger)]">
            {error}
          </p>
        )}

        <button type="submit" className="vs-btn vs-btn-primary mt-5 w-full" disabled={busy}>
          {busy ? '로그인 중…' : '로그인'}
        </button>

        <div className="my-4 flex items-center gap-3">
          <span className="h-px flex-1 bg-[var(--line)]" />
          <span className="text-[12px] text-[var(--ink-muted)]">또는</span>
          <span className="h-px flex-1 bg-[var(--line)]" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            signIn('kakao', { callbackUrl: searchParams.get('callbackUrl') ?? '/' })
          }
          className="vs-btn w-full !border-none !bg-[#FEE500] !text-[#181600] hover:!bg-[#F5DC00]"
        >
          카카오로 시작하기
        </button>

        <p className="mt-4 text-center text-[13px] text-[var(--ink-muted)]">
          계정이 없으신가요?{' '}
          <Link href="/register" className="font-semibold text-[var(--brand)] underline">
            회원가입
          </Link>
        </p>
      </form>

      <aside className="vs-card h-fit p-6">
        <h2 className="text-[17px] font-bold">데모 계정으로 바로 보기</h2>
        <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
          역할별 화면을 확인할 수 있는 데모 계정입니다. 비밀번호는 모두{' '}
          <code className="rounded bg-[var(--surface-alt)] px-1.5 py-0.5">{DEMO_PASSWORD}</code>
          입니다.
        </p>
        <ul className="mt-4 space-y-2">
          {DEMO_ACCOUNTS.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                disabled={busy}
                onClick={() => login(a.email, DEMO_PASSWORD)}
                className="w-full rounded-[12px] border border-[var(--line)] p-3 text-left transition-colors hover:bg-[var(--surface-alt)]"
              >
                <span className="flex items-center gap-2">
                  <span className="vs-badge vs-badge-brand">{a.role}</span>
                  <span className="text-[13px] font-semibold">{a.email}</span>
                </span>
                <span className="mt-1 block text-[12px] text-[var(--ink-muted)]">{a.desc}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
