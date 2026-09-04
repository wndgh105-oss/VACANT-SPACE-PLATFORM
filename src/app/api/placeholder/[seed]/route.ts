import { NextRequest } from 'next/server'

/**
 * 상업적 사용 문제가 없는 추상 플레이스홀더 이미지를 즉석 생성한다.
 * 실제 매물 사진이 아니며, seed 문자열로부터 결정적으로 같은 그림이 나온다.
 */
function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

const PALETTES = [
  ['#F3E2D2', '#D9A57B', '#C4562B', '#8C4A2F'],
  ['#EDE6DA', '#B9A48A', '#7F6A55', '#3F3730'],
  ['#F5E7DE', '#E0B39A', '#B5714E', '#6E4630'],
  ['#E9E7E0', '#C2BFB2', '#8E8C7F', '#4A4842'],
  ['#F6EBDD', '#DCC29A', '#B08A57', '#6B5433'],
]

export async function GET(_req: NextRequest, { params }: { params: { seed: string } }) {
  const seed = params.seed ?? 'space'
  const h = hash(seed)
  const palette = PALETTES[h % PALETTES.length]
  const W = 800
  const H = 560

  const shapes: string[] = []
  // 바닥/벽 느낌의 큰 면
  shapes.push(`<rect x="0" y="0" width="${W}" height="${H}" fill="${palette[0]}"/>`)
  shapes.push(
    `<rect x="0" y="${H * 0.62}" width="${W}" height="${H * 0.38}" fill="${palette[1]}" opacity="0.7"/>`
  )

  // 창문 격자
  const winX = 60 + (h % 5) * 20
  const winW = 300
  const winH = 200
  shapes.push(
    `<rect x="${winX}" y="70" width="${winW}" height="${winH}" fill="#FFFFFF" opacity="0.55" rx="6"/>`
  )
  for (let i = 1; i < 3; i++) {
    shapes.push(
      `<line x1="${winX + (winW / 3) * i}" y1="70" x2="${winX + (winW / 3) * i}" y2="${70 + winH}" stroke="${palette[3]}" stroke-width="4" opacity="0.5"/>`
    )
  }
  shapes.push(
    `<line x1="${winX}" y1="${70 + winH / 2}" x2="${winX + winW}" y2="${70 + winH / 2}" stroke="${palette[3]}" stroke-width="4" opacity="0.5"/>`
  )

  // 가구 실루엣 (원/사각 조합)
  const items = 3 + (h % 3)
  for (let i = 0; i < items; i++) {
    const seedI = hash(seed + i)
    const cx = 120 + ((seedI % 5) * (W - 240)) / 5 + i * 40
    const cy = H * 0.62 + 20 + (seedI % 60)
    const r = 26 + (seedI % 30)
    if (seedI % 2 === 0) {
      shapes.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${palette[2]}" opacity="0.75"/>`)
    } else {
      shapes.push(
        `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 1.5}" rx="8" fill="${palette[2]}" opacity="0.65"/>`
      )
    }
  }

  // 조명 3개
  for (let i = 0; i < 3; i++) {
    const lx = 520 + i * 80
    shapes.push(`<line x1="${lx}" y1="0" x2="${lx}" y2="90" stroke="${palette[3]}" stroke-width="3" opacity="0.5"/>`)
    shapes.push(`<circle cx="${lx}" cy="100" r="14" fill="${palette[3]}" opacity="0.55"/>`)
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="공간 이미지 플레이스홀더">
  ${shapes.join('\n  ')}
  <rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="${palette[3]}" stroke-width="2" opacity="0.25"/>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
