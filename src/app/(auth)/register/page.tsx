'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const ROLES = [
  { value: 'TENANT', label: '창업자', desc: '공간을 빌려 짧게 창업해 보고 싶어요' },
  { value: 'LANDLORD', label: '건물주', desc: '비어 있는 공간을 단기로 빌려주고 싶어요' },
  { value: 'PARTNER', label: '장비 파트너', desc: '창업 장비를 렌탈로 공급하고 싶어요' },
] as const

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'TENANT' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (form.password.length < 8) {
      setError('비밀번호는 8자 이상으로 설정해 주세요.')
      return
    }

    setBusy(true)
    try {
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
        setError('입력 값을 확인해 주세요.')
        return
      }
      router.push('/login')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="vs-container max-w-lg py-12">
      <form onSubmit={handleSubmit} className="vs-card p-6">
        <h1 className="text-[24px] font-bold tracking-tight">회원가입</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
          어떤 목적으로 오셨는지 알려주시면 화면을 맞춰 드립니다.
        </p>

        <fieldset className="mt-6">
          <legend className="vs-label">역할 선택</legend>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={form.role === r.value}
                onClick={() => setForm({ ...form, role: r.value })}
                className={`w-full rounded-[12px] border p-3 text-left transition-colors ${
                  form.role === r.value
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--line)] hover:bg-[var(--surface-alt)]'
                }`}
              >
                <span className="text-[15px] font-bold">{r.label}</span>
                <span className="mt-0.5 block text-[12px] text-[var(--ink-muted)]">{r.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 space-y-4">
          <div>
            <label className="vs-label" htmlFor="reg-name">
              이름
            </label>
            <input
              id="reg-name"
              className="vs-input"
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="vs-label" htmlFor="reg-email">
              이메일
            </label>
            <input
              id="reg-email"
              className="vs-input"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="vs-label" htmlFor="reg-password">
              비밀번호
            </label>
            <input
              id="reg-password"
              className="vs-input"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <p className="mt-1 text-[12px] text-[var(--ink-muted)]">8자 이상</p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-[var(--danger)]">
            {error}
          </p>
        )}

        <button type="submit" className="vs-btn vs-btn-primary mt-5 w-full" disabled={busy}>
          {busy ? '가입 중…' : '가입하기'}
        </button>

        <p className="mt-4 text-center text-[13px] text-[var(--ink-muted)]">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-semibold text-[var(--brand)] underline">
            로그인
          </Link>
        </p>

        <p className="mt-4 text-[11px] leading-relaxed text-[var(--ink-muted)]">
          본 서비스는 MVP 데모입니다. 실명 인증·신분증 확인은 구현되어 있지 않으며, 입력한 정보는 데모
          데이터베이스에만 저장됩니다.
        </p>
      </form>
    </div>
  )
}
