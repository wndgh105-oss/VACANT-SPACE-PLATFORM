'use client'

import { useEffect, useState } from 'react'

export function Countdown({ openDate }: { openDate: string }) {
  const target = new Date(openDate).getTime()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, target - now)
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)

  if (diff === 0) {
    return <p className="text-[40px] font-bold leading-none">오픈했어요!</p>
  }

  return (
    <div aria-live="off">
      <p className="text-[52px] font-bold leading-none tracking-tight">D-{days}</p>
      <p className="mt-2 text-[14px] tabular-nums opacity-80">
        {String(hours).padStart(2, '0')}시간 {String(minutes).padStart(2, '0')}분{' '}
        {String(seconds).padStart(2, '0')}초 남음
      </p>
    </div>
  )
}

export function ShareBar({ storeName }: { storeName: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
      <button type="button" className="vs-btn vs-btn-primary" onClick={copy}>
        {copied ? '링크를 복사했어요' : '링크 복사해서 공유하기'}
      </button>
      <a
        className="vs-btn vs-btn-secondary"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
          `${storeName} 어디로 옮겼을까요? 힌트 보고 맞혀보세요`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        X에 공유하기
      </a>
      <p aria-live="polite" className="sr-only">
        {copied ? '링크가 복사되었습니다' : ''}
      </p>
    </div>
  )
}

/** 정확한 위치를 숨긴 채 반경만 보여주는 흐린 지도 */
export function BlurredMap({ radiusM, regionHint }: { radiusM: number; regionHint: string }) {
  return (
    <div className="vs-card overflow-hidden">
      <svg
        viewBox="0 0 600 340"
        className="block h-auto w-full bg-[var(--surface-alt)]"
        role="img"
        aria-label={`새 매장은 이전 위치에서 반경 ${radiusM}미터 안에 있습니다. ${regionHint}`}
      >
        <defs>
          <pattern id="t-grid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M34 0 L0 0 0 34" fill="none" stroke="var(--line)" strokeWidth="1" />
          </pattern>
          <filter id="t-blur">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <radialGradient id="t-fade">
            <stop offset="55%" stopColor="var(--brand)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect width="600" height="340" fill="url(#t-grid)" />
        {/* 도로 느낌의 선 */}
        <path d="M0 220 H600" stroke="var(--line)" strokeWidth="10" />
        <path d="M210 0 V340" stroke="var(--line)" strokeWidth="8" />
        <path d="M430 0 V340" stroke="var(--line)" strokeWidth="6" />

        <circle cx="300" cy="170" r="120" fill="url(#t-fade)" filter="url(#t-blur)" />
        <circle
          cx="300"
          cy="170"
          r="118"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="3"
          strokeDasharray="8 8"
        />
        <text
          x="300"
          y="176"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          fill="var(--brand-strong)"
        >
          이 안 어딘가
        </text>
        <text x="300" y="200" textAnchor="middle" fontSize="12" fill="var(--ink-muted)">
          반경 {radiusM >= 1000 ? `${radiusM / 1000}km` : `${radiusM}m`}
        </text>
      </svg>
    </div>
  )
}
