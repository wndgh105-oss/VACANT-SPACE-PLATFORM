'use client'

import { Suspense, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

const ROLES = [
  { value: 'TENANT', label: '창업자', desc: '공간을 빌려 짧게 창업해 보고 싶어요' },
  { value: 'LANDLORD', label: '건물주', desc: '비어 있는 공간을 단기로 빌려주고 싶어요' },
  { value: 'PARTNER', label: '장비 파트너', desc: '창업 장비를 렌탈로 공급하고 싶어요' },
] as const

export default function RoleOnboardingPage() {
  return (
    <Suspense fallback={null}>
      <RoleOnboardingForm />
    </Suspense>
  )
}

function RoleOnboardingForm() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<(typeof ROLES)[number]['value']>('TENANT')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      await update() // 세션의 role을 새로 반영
      const dest =
        searchParams.get('callbackUrl') ??
        { TENANT: '/dashboard', LANDLORD: '/landlord', PARTNER: '/partner' }[role]
      router.push(dest)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
      setBusy(false)
    }
  }

  return (
    <div className="vs-container max-w-lg py-12">
      <div className="vs-card p-6">
        <h1 className="text-[24px] font-bold tracking-tight">거의 다 왔어요</h1>
        <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
          {session?.user.name}님, 어떤 목적으로 빈자리를 쓰실 건가요? 나중에 바꿀 수는 없으니 신중하게
          골라주세요.
        </p>

        <fieldset className="mt-6">
          <legend className="sr-only">역할 선택</legend>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={role === r.value}
                onClick={() => setRole(r.value)}
                className={`w-full rounded-[12px] border p-3 text-left transition-colors ${
                  role === r.value
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

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-[var(--danger)]">
            {error}
          </p>
        )}

        <button type="button" className="vs-btn vs-btn-primary mt-5 w-full" onClick={submit} disabled={busy}>
          {busy ? '저장 중…' : '시작하기'}
        </button>
      </div>
    </div>
  )
}
