'use client'

import { useEffect, useRef, useState } from 'react'
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

declare global {
  interface Window {
    kakao: any
  }
}

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

let kakaoLoadPromise: Promise<void> | null = null

/** 카카오맵 JS SDK를 한 번만 로드한다 (여러 지도 인스턴스가 있어도 스크립트는 하나). */
function loadKakaoSdk(): Promise<void> {
  if (kakaoLoadPromise) return kakaoLoadPromise
  kakaoLoadPromise = new Promise((resolve, reject) => {
    if (!KAKAO_KEY) {
      reject(new Error('NEXT_PUBLIC_KAKAO_MAP_KEY 환경변수가 설정되지 않았습니다.'))
      return
    }
    if (window.kakao?.maps) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false`
    script.async = true
    script.onload = () => window.kakao.maps.load(() => resolve())
    script.onerror = () => reject(new Error('카카오맵 SDK 로드에 실패했습니다.'))
    document.head.appendChild(script)
  })
  return kakaoLoadPromise
}

/**
 * 카카오맵 JS SDK 기반 지도.
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
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const overlaysRef = useRef<Map<string, any>>(new Map())
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const usable = points.filter(
    (p): p is MapPoint & { lat: number; lng: number } => p.lat != null && p.lng != null
  )

  // 지도 생성 (points 목록이 바뀌어도 재사용, 최초 1회)
  useEffect(() => {
    let cancelled = false
    if (usable.length === 0) return

    loadKakaoSdk()
      .then(() => {
        if (cancelled || !containerRef.current) return
        const kakao = window.kakao
        const bounds = new kakao.maps.LatLngBounds()
        usable.forEach((p) => bounds.extend(new kakao.maps.LatLng(p.lat, p.lng)))

        const map = new kakao.maps.Map(containerRef.current, {
          center: new kakao.maps.LatLng(usable[0].lat, usable[0].lng),
          level: 6,
        })
        map.setBounds(bounds, 40)
        mapRef.current = map
        setStatus('ready')
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usable.length])

  // 마커(커스텀 오버레이) 렌더링 및 선택 상태 반영
  useEffect(() => {
    if (status !== 'ready' || !mapRef.current) return
    const kakao = window.kakao
    const map = mapRef.current

    overlaysRef.current.forEach((ov) => ov.setMap(null))
    overlaysRef.current.clear()

    usable.forEach((p) => {
      const active = p.id === selectedId
      const el = document.createElement('button')
      el.type = 'button'
      el.setAttribute('aria-label', `${p.title ?? p.address}, 월 ${manWon(p.monthlyRent)}`)
      el.style.cssText = [
        'transform: translateY(-100%)',
        'border-radius: 999px',
        'padding: 6px 12px',
        'font-size: 12px',
        'font-weight: 700',
        'font-family: inherit',
        'white-space: nowrap',
        'cursor: pointer',
        'border: 2px solid ' + (active ? 'var(--brand-strong, #173F99)' : 'var(--brand, #2456C6)'),
        'background: ' + (active ? 'var(--brand, #2456C6)' : '#ffffff'),
        'color: ' + (active ? '#ffffff' : 'var(--brand, #2456C6)'),
        'box-shadow: 0 2px 6px rgba(22,35,63,0.25)',
      ].join(';')
      el.textContent = manWon(p.monthlyRent)
      el.onclick = () => onSelect?.(p.id)

      const overlay = new kakao.maps.CustomOverlay({
        position: new kakao.maps.LatLng(p.lat, p.lng),
        content: el,
        yAnchor: 1,
        zIndex: active ? 20 : 10,
      })
      overlay.setMap(map)
      overlaysRef.current.set(p.id, overlay)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, usable, selectedId])

  if (usable.length === 0) {
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
        <p className="text-[11px] text-[var(--ink-muted)]">카카오맵 · 가격 핀을 눌러 공간 정보를 확인하세요</p>
      </div>

      {status === 'error' ? (
        <div className="flex h-[400px] items-center justify-center bg-[var(--surface-alt)] p-6 text-center text-[14px] text-[var(--ink-muted)]">
          지도를 불러오지 못했어요. 목록 보기로 확인해 주세요.
        </div>
      ) : (
        <div
          ref={containerRef}
          role="img"
          aria-label={`공간 ${usable.length}곳의 위치를 보여주는 지도. 자세한 정보는 목록 보기에서 확인할 수 있습니다.`}
          className="h-[400px] w-full bg-[var(--surface-alt)]"
        />
      )}
    </div>
  )
}
