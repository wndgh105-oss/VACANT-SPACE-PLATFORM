'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RADIUS_OPTIONS = [
  { value: 300, label: '300m 이내', desc: '거의 옆 골목' },
  { value: 500, label: '500m 이내', desc: '걸어서 7분' },
  { value: 1000, label: '1km 이내', desc: '같은 동네' },
]

const EMOJIS = ['📍', '☕', '🪟', '🌿', '🚶', '🔑', '🎈', '🍞']

export function TeaserEditor({
  tenancyId,
  defaultStoreName,
  fromAddress,
}: {
  tenancyId: string
  defaultStoreName: string
  fromAddress: string
}) {
  const router = useRouter()
  const [storeName, setStoreName] = useState(defaultStoreName)
  const [toRegionHint, setToRegionHint] = useState('같은 동네 안에서 조금 더 넓은 자리로')
  const [hintRadiusM, setHintRadiusM] = useState(500)
  const [openDate, setOpenDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d.toISOString().slice(0, 10)
  })
  const [message, setMessage] = useState(
    '그동안 찾아와 주셔서 고마웠어요. 조금 더 넓은 자리에서 다시 만나요.'
  )
  const [hints, setHints] = useState([
    { emoji: '📍', text: '아직 이 동네를 벗어나지 않았어요.' },
    { emoji: '☕', text: '전에 있던 자리에서 커피 한 잔 식기 전에 도착할 수 있어요.' },
    { emoji: '🪟', text: '이번엔 창가 자리가 훨씬 늘었습니다.' },
  ])
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function updateHint(i: number, patch: Partial<{ emoji: string; text: string }>) {
    setHints((prev) => prev.map((h, idx) => (idx === i ? { ...h, ...patch } : h)))
  }

  async function submit() {
    setError(null)
    if (!storeName.trim()) return setError('매장 이름을 입력해 주세요.')
    if (hints.some((h) => !h.text.trim())) return setError('힌트 내용을 모두 채워 주세요.')

    setSubmitting(true)
    try {
      const res = await fetch('/api/teasers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenancyId,
          storeName: storeName.trim(),
          toRegionHint: toRegionHint.trim(),
          hintRadiusM,
          openDate,
          message: message.trim() || undefined,
          hints: hints.map((h) => ({ emoji: h.emoji, text: h.text.trim() })),
          publish: true,
        }),
      })
      const data = await res.json()
      if (res.status === 409 && data.slug) {
        router.push(`/t/${data.slug}`)
        return
      }
      if (!res.ok) throw new Error('티저 페이지를 만들지 못했습니다.')
      router.push(`/t/${data.slug}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류가 발생했습니다.')
      setSubmitting(false)
    }
  }

  const dday = Math.max(
    0,
    Math.ceil((new Date(openDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-5">
        <section className="vs-card p-5">
          <h2 className="vs-section-title">기본 정보</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="vs-label" htmlFor="t-name">
                매장 이름
              </label>
              <input
                id="t-name"
                className="vs-input"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                maxLength={40}
              />
            </div>
            <div>
              <label className="vs-label" htmlFor="t-open">
                새 매장 오픈일
              </label>
              <input
                id="t-open"
                type="date"
                className="vs-input"
                value={openDate}
                onChange={(e) => setOpenDate(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="vs-label" htmlFor="t-region">
              위치 힌트 한 줄
            </label>
            <input
              id="t-region"
              className="vs-input"
              value={toRegionHint}
              onChange={(e) => setToRegionHint(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="mt-4">
            <label className="vs-label" htmlFor="t-msg">
              단골에게 남기는 말
            </label>
            <textarea
              id="t-msg"
              className="vs-textarea"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
            />
          </div>
        </section>

        <section className="vs-card p-5">
          <h2 className="vs-section-title">지도 힌트 범위</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
            정확한 주소는 공개하지 않고, 이 범위만 흐리게 보여줍니다.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={hintRadiusM === r.value}
                onClick={() => setHintRadiusM(r.value)}
                className={`vs-btn flex-col !items-start !py-2.5 ${
                  hintRadiusM === r.value ? 'vs-btn-primary' : 'vs-btn-secondary'
                }`}
              >
                <span className="text-[14px] font-bold">{r.label}</span>
                <span className="text-[11px] opacity-80">{r.desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="vs-card p-5">
          <h2 className="vs-section-title">힌트 카드</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-muted)]">
            단골이 새 매장을 추측할 수 있게 3장까지 만들 수 있어요.
          </p>
          <ul className="mt-4 space-y-3">
            {hints.map((h, i) => (
              <li key={i} className="rounded-[12px] border border-[var(--line)] p-3">
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`hint-emoji-${i}`}>
                    힌트 {i + 1} 이모지
                  </label>
                  <select
                    id={`hint-emoji-${i}`}
                    className="vs-select !w-auto !py-2"
                    value={h.emoji}
                    onChange={(e) => updateHint(i, { emoji: e.target.value })}
                  >
                    {EMOJIS.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                  <label className="sr-only" htmlFor={`hint-text-${i}`}>
                    힌트 {i + 1} 내용
                  </label>
                  <input
                    id={`hint-text-${i}`}
                    className="vs-input"
                    value={h.text}
                    onChange={(e) => updateHint(i, { text: e.target.value })}
                    maxLength={120}
                  />
                  {hints.length > 1 && (
                    <button
                      type="button"
                      className="vs-btn vs-btn-ghost !px-3"
                      aria-label={`힌트 ${i + 1} 삭제`}
                      onClick={() => setHints((prev) => prev.filter((_, idx) => idx !== i))}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {hints.length < 5 && (
            <button
              type="button"
              className="vs-btn vs-btn-secondary mt-3"
              onClick={() => setHints((prev) => [...prev, { emoji: '📍', text: '' }])}
            >
              힌트 추가
            </button>
          )}
        </section>
      </div>

      {/* 미리보기 */}
      <aside className="lg:sticky lg:top-20 lg:h-fit">
        <p className="mb-2 text-[13px] font-semibold text-[var(--ink-muted)]">미리보기</p>
        <div className="vs-card overflow-hidden">
          <div className="bg-[var(--ink)] px-5 py-6 text-center text-white">
            <p className="text-[12px] uppercase tracking-widest opacity-70">Moving</p>
            <p className="mt-1 text-[24px] font-bold">{storeName || '매장 이름'}</p>
            <p className="mt-1 text-[13px] opacity-80">우리가 어디로 옮겼게요?</p>
            <p className="mt-4 text-[40px] font-bold leading-none">D-{dday}</p>
            <p className="mt-1 text-[12px] opacity-70">
              {new Date(openDate).toLocaleDateString('ko-KR')} 오픈
            </p>
          </div>
          <ul className="space-y-2 p-4">
            {hints.map((h, i) => (
              <li key={i} className="flex gap-3 rounded-[12px] bg-[var(--surface-alt)] p-3">
                <span aria-hidden className="text-[18px]">
                  {h.emoji}
                </span>
                <span className="text-[13px] leading-relaxed">{h.text || '힌트 내용'}</span>
              </li>
            ))}
          </ul>
          <p className="px-4 pb-4 text-[12px] text-[var(--ink-muted)]">
            이전 전 주소: {fromAddress}
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-[13px] text-[var(--danger)]">
            {error}
          </p>
        )}
        <button
          type="button"
          className="vs-btn vs-btn-primary mt-4 w-full"
          onClick={submit}
          disabled={submitting}
        >
          {submitting ? '만드는 중…' : '티저 페이지 공개하기'}
        </button>
        <p className="mt-3 text-[11px] leading-relaxed text-[var(--ink-muted)]">
          공개하면 누구나 링크로 볼 수 있는 페이지가 만들어집니다. 정확한 새 주소는 공개되지 않습니다.
        </p>
      </aside>
    </div>
  )
}
