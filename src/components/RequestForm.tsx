'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { won } from '@/lib/quote'

const CHECKLIST = [
  '건축물 용도가 희망 업종을 허용하는지 확인하겠습니다.',
  '영업신고·위생교육 등 인허가 요건은 제가 직접 확인해야 함을 이해했습니다.',
  '원상복구 범위와 보증금 정산 기준을 계약 전 서면으로 합의하겠습니다.',
  '이 요청은 상담 신청이며, 결제나 법적 계약 체결이 아님을 이해했습니다.',
]

export function RequestForm({
  listingId,
  quoteId,
  defaultMonths,
  defaultName,
  defaultPhone,
  summary,
  loggedIn,
}: {
  listingId: string
  quoteId: string | null
  defaultMonths: number
  defaultName: string
  defaultPhone: string
  summary: { needCash: number; months: number; title: string } | null
  loggedIn: boolean
}) {
  const router = useRouter()
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(defaultPhone)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  })
  const [message, setMessage] = useState('')
  const [checked, setChecked] = useState<boolean[]>(CHECKLIST.map(() => false))
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const allChecked = checked.every(Boolean)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) return setError('이름을 입력해 주세요.')
    if (!/^[0-9-]{9,20}$/.test(phone.trim())) return setError('연락처를 숫자와 하이픈으로 입력해 주세요.')
    if (!allChecked) return setError('계약 전 확인 사항에 모두 동의해야 요청을 보낼 수 있어요.')

    setSubmitting(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          quoteId,
          applicantName: name.trim(),
          phone: phone.trim(),
          desiredDuration: defaultMonths,
          desiredStartDate: startDate,
          message: message.trim() || undefined,
        }),
      })
      if (res.status === 401) {
        router.push(`/login?callbackUrl=/spaces/${listingId}/quote`)
        return
      }
      if (res.status === 409) {
        setError('이미 이 공간에 요청을 보내셨어요. 요청 현황에서 확인해 주세요.')
        setSubmitting(false)
        return
      }
      if (!res.ok) throw new Error('요청을 보내지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="vs-card vs-rise mx-auto max-w-lg p-8 text-center">
        <div
          aria-hidden
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ok)] text-[26px] text-white"
        >
          ✓
        </div>
        <h2 className="mt-4 text-[22px] font-bold">요청이 접수되었어요</h2>
        <p className="mt-2 text-[14px] text-[var(--ink-muted)]">
          운영자가 조건과 업종 적합성을 확인한 뒤 연락드립니다.
          <br />
          아직 결제나 계약이 진행된 것은 아닙니다.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link href="/dashboard/applications" className="vs-btn vs-btn-primary">
            요청 현황 보기
          </Link>
          <Link href="/spaces" className="vs-btn vs-btn-secondary">
            다른 공간 더 보기
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-5">
        <section className="vs-card p-5">
          <h2 className="vs-section-title">연락처</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="vs-label" htmlFor="req-name">
                이름
              </label>
              <input
                id="req-name"
                className="vs-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label className="vs-label" htmlFor="req-phone">
                연락처
              </label>
              <input
                id="req-phone"
                className="vs-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-0000-0000"
                inputMode="tel"
                autoComplete="tel"
                required
              />
            </div>
            <div>
              <label className="vs-label" htmlFor="req-start">
                희망 시작일
              </label>
              <input
                id="req-start"
                type="date"
                className="vs-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="vs-label" htmlFor="req-months">
                이용 기간
              </label>
              <input
                id="req-months"
                className="vs-input"
                value={`${defaultMonths}개월`}
                readOnly
                aria-readonly="true"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="vs-label" htmlFor="req-message">
              하고 싶은 말 (선택)
            </label>
            <textarea
              id="req-message"
              className="vs-textarea"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="예: 급배수 상태를 현장에서 먼저 확인하고 싶습니다."
            />
          </div>
        </section>

        <section className="vs-card p-5">
          <h2 className="vs-section-title">계약 전 확인 사항</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
            분쟁을 줄이기 위해 아래 항목을 먼저 확인합니다.
          </p>
          <ul className="mt-4 space-y-1">
            {CHECKLIST.map((text, i) => (
              <li key={text}>
                <label className="flex cursor-pointer items-start gap-3 rounded-[10px] px-2 py-2 hover:bg-[var(--surface-alt)]">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-[var(--brand)]"
                    checked={checked[i]}
                    onChange={() =>
                      setChecked((prev) => prev.map((v, idx) => (idx === i ? !v : v)))
                    }
                  />
                  <span className="text-[14px] leading-relaxed">{text}</span>
                </label>
              </li>
            ))}
          </ul>
          <Link
            href="/guide/legal"
            className="mt-3 inline-block text-[13px] font-semibold text-[var(--brand)] underline"
          >
            법률·인허가 안내 자세히 보기
          </Link>
        </section>
      </div>

      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <div className="vs-card p-5">
          <p className="text-[13px] font-bold">요청 요약</p>
          {summary ? (
            <>
              <p className="mt-2 text-[15px] font-semibold leading-snug">{summary.title}</p>
              <p className="mt-1 text-[13px] text-[var(--ink-muted)]">{summary.months}개월 이용</p>
              <p className="mt-3 text-[24px] font-bold text-[var(--brand)]">
                {won(summary.needCash)}
              </p>
              <p className="text-[12px] text-[var(--ink-muted)]">계약 시점 필요 현금 (보증금 포함)</p>
            </>
          ) : (
            <p className="mt-2 text-[13px] text-[var(--ink-muted)]">
              견적 정보 없이 상담만 요청합니다.
            </p>
          )}

          {!loggedIn && (
            <p className="mt-4 rounded-[10px] bg-[var(--warn-soft)] p-3 text-[12px] text-[var(--warn)]">
              요청을 보내려면 로그인이 필요해요. 버튼을 누르면 로그인 화면으로 이동합니다.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 text-[13px] text-[var(--danger)]">
              {error}
            </p>
          )}

          <button type="submit" className="vs-btn vs-btn-primary mt-4 w-full" disabled={submitting}>
            {submitting ? '보내는 중…' : '요청 보내기'}
          </button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-[var(--ink-muted)]">
            결제 수단을 입력하지 않으며, 이 단계에서 법적 계약이 체결되지 않습니다.
          </p>
        </div>
      </aside>
    </form>
  )
}
