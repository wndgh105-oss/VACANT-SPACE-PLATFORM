'use client'

import { useMemo } from 'react'
import { manWon } from '@/lib/quote'

export type MapPoint = {
  id: string
  title: string | null
  address: string
  region: string | null
  lat: number | null
  lng: number | null
  monthlyRent: number
}

/**
 * 외부 지도 API 키 없이 동작하는 자체 좌표 지도.
 * 위경도를 단순 선형 투영해 SVG 평면에 배치한다.
 * 실제 지도가 아니므로 도로·건물은 표현하지 않고, 상대적 위치 관계만 보여준다.
 * 목록 뷰가 항상 동등하게 제공되므로 접근성상 지도는 보조 수단이다.
 */
export function SpaceMap({
  points,
  selectedId,
  onSelect,
}: {
  points: MapPoint[]
  selectedId?: string | null
  onSelect?: (id: string) => void
}) {
  const usable = useMemo(
    () => points.filter((p): p is MapPoint & { lat: number; lng: number } => p.lat != null && p.lng != null),
    [points]
  )

  const W = 720
  const H = 460
  const PAD = 60

  const projected = useMemo(() => {
    if (usable.length === 0) return []
    const lats = usable.map((p) => p.lat)
    const lngs = usable.map((p) => p.lng)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)
    const spanLat = Math.max(maxLat - minLat, 0.004)
    const spanLng = Math.max(maxLng - minLng, 0.004)

    return usable.map((p) => ({
      ...p,
      x: PAD + ((p.lng - minLng) / spanLng) * (W - PAD * 2),
      // 위도는 위쪽이 커지므로 y축을 뒤집는다
      y: PAD + (1 - (p.lat - minLat) / spanLat) * (H - PAD * 2),
    }))
  }, [usable])

  const regionSummary = useMemo(() => {
    const set = new Set(usable.map((p) => p.region).filter(Boolean) as string[])
    return Array.from(set)
  }, [usable])

  if (projected.length === 0) {
    return (
      <div className="vs-card flex h-[300px] items-center justify-center p-6 text-center text-[14px] text-[var(--ink-muted)]">
        좌표가 등록된 공간이 없어 지도를 그릴 수 없어요. 목록 보기로 확인해 주세요.
      </div>
    )
  }

  return (
    <div className="vs-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-2">
        <p className="text-[13px] font-semibold">지도 보기</p>
        <p className="text-[11px] text-[var(--ink-muted)]">
          외부 지도 API 미사용 · 좌표 상대 위치만 표시하는 예시 지도
        </p>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full bg-[var(--surface-alt)]"
        role="img"
        aria-label={`${regionSummary.join(', ')} 지역의 공간 ${projected.length}곳 위치 지도. 자세한 정보는 목록 보기에서 확인할 수 있습니다.`}
      >
        <defs>
          <pattern id="vs-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="var(--line)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#vs-grid)" />

        {/* 지역 라벨 (같은 region의 중심에 표시) */}
        {regionSummary.map((region) => {
          const group = projected.filter((p) => p.region === region)
          const cx = group.reduce((s, p) => s + p.x, 0) / group.length
          const cy = group.reduce((s, p) => s + p.y, 0) / group.length
          return (
            <text
              key={region}
              x={cx}
              y={cy - 34}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="var(--ink-muted)"
              opacity="0.75"
            >
              {region}
            </text>
          )
        })}

        {projected.map((p) => {
          const active = p.id === selectedId
          return (
            <g
              key={p.id}
              transform={`translate(${p.x}, ${p.y})`}
              className="cursor-pointer"
              onClick={() => onSelect?.(p.id)}
              role="button"
              tabIndex={0}
              aria-label={`${p.title ?? p.address}, 월 ${manWon(p.monthlyRent)}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect?.(p.id)
                }
              }}
            >
              <circle
                r={active ? 13 : 9}
                fill={active ? 'var(--brand)' : 'var(--surface)'}
                stroke={active ? 'var(--brand-strong)' : 'var(--brand)'}
                strokeWidth="3"
              />
              <rect
                x={-38}
                y={active ? -44 : -40}
                width="76"
                height="22"
                rx="11"
                fill="var(--ink)"
                opacity={active ? 0.95 : 0.75}
              />
              <text
                x="0"
                y={active ? -29 : -25}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill="#fff"
              >
                {manWon(p.monthlyRent)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
