import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

/**
 * Playwright가 남긴 webm 녹화를 demo.mp4 로 변환한다.
 *
 * 별도 ffmpeg 설치 없이 Playwright에 번들된 ffmpeg 바이너리를 사용한다.
 * 시스템에 ffmpeg가 있으면 그쪽을 우선 사용한다.
 *
 * 사용법: npm run demo:build
 */

const OUT = path.join(process.cwd(), 'docs', 'demo')
const RAW = path.join(OUT, 'raw')
const TARGET = path.join(OUT, 'demo.mp4')

function findFfmpeg() {
  const fromEnv = process.env.FFMPEG_PATH
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv

  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' })
  if (probe.status === 0) return 'ffmpeg'

  // Playwright 번들 (Windows / macOS / Linux)
  const roots = [
    path.join(process.env.LOCALAPPDATA ?? '', 'ms-playwright'),
    path.join(process.env.HOME ?? '', '.cache', 'ms-playwright'),
    path.join(process.env.HOME ?? '', 'Library', 'Caches', 'ms-playwright'),
  ].filter(Boolean)

  for (const root of roots) {
    if (!fs.existsSync(root)) continue
    for (const dir of fs.readdirSync(root)) {
      if (!dir.startsWith('ffmpeg')) continue
      const inner = path.join(root, dir)
      for (const f of fs.readdirSync(inner)) {
        if (f.startsWith('ffmpeg')) return path.join(inner, f)
      }
    }
  }
  return null
}

const ffmpeg = findFfmpeg()
if (!ffmpeg) {
  console.error(
    'ffmpeg를 찾지 못했습니다. 시스템에 ffmpeg를 설치하거나 FFMPEG_PATH 환경변수로 경로를 지정하세요.\n' +
      '변환 없이도 원본 녹화(docs/demo/raw/*.webm)는 재생 가능합니다.'
  )
  process.exit(1)
}

const sources = fs.existsSync(RAW) ? fs.readdirSync(RAW).filter((f) => f.endsWith('.webm')) : []
if (sources.length === 0) {
  console.error('녹화 파일이 없습니다. 먼저 `npm run demo:record` 를 실행하세요.')
  process.exit(1)
}

// 가장 큰(=본편) 녹화를 사용한다.
const source = sources
  .map((f) => ({ f, size: fs.statSync(path.join(RAW, f)).size }))
  .sort((a, b) => b.size - a.size)[0].f
const input = path.join(RAW, source)

console.log('ffmpeg:', ffmpeg)
console.log('input :', input)

const attempts = [
  ['-i', input, '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '30', '-movflags', '+faststart', '-y', TARGET],
  ['-i', input, '-c:v', 'mpeg4', '-q:v', '4', '-pix_fmt', 'yuv420p', '-r', '30', '-y', TARGET],
]

let ok = false
for (const args of attempts) {
  const res = spawnSync(ffmpeg, args, { encoding: 'utf8' })
  if (res.status === 0 && fs.existsSync(TARGET) && fs.statSync(TARGET).size > 0) {
    ok = true
    console.log('사용한 코덱:', args[args.indexOf('-c:v') + 1])
    break
  }
  console.warn('변환 시도 실패:', args[args.indexOf('-c:v') + 1])
}

if (!ok) {
  console.error('mp4 변환에 실패했습니다. 원본 webm을 그대로 사용하세요:', input)
  process.exit(1)
}

const bytes = fs.statSync(TARGET).size
console.log(`완료: ${TARGET} (${(bytes / 1024 / 1024).toFixed(2)} MB)`)
