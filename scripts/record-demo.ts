import 'dotenv/config'
import { chromium, Page } from '@playwright/test'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import fs from 'node:fs'
import path from 'node:path'

/**
 * 데모 영상 녹화 스크립트 (45~60초 목표).
 *
 * 실제 실행 중인 개발 서버를 Playwright 크로미움으로 자동 조작하면서 화면을 녹화한다.
 * 결과물:
 *   docs/demo/raw/*.webm      Playwright 원본 녹화
 *   docs/demo/scenes/NN-*.png 장면별 스크린샷
 * 이후 scripts/build-demo.mjs 가 webm → demo.mp4 로 변환한다.
 *
 * 사용법: npm run demo:record   (개발 서버가 localhost:3000 에 떠 있어야 함)
 */

const BASE = process.env.DEMO_BASE_URL ?? 'http://localhost:3000'
const OUT = path.join(process.cwd(), 'docs', 'demo')
const RAW = path.join(OUT, 'raw')
const SCENES = path.join(OUT, 'scenes')

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** 사람이 스크롤하는 것처럼 부드럽게 이동 */
async function smoothScroll(page: Page, top: number, settle = 900) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), top)
  await wait(settle)
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(SCENES, `${name}.png`) })
}

/** 데모 요청 상태를 초기화해 재실행 가능하게 만든다 */
async function resetDemoState() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })
  try {
    const tenant = await prisma.user.findUnique({ where: { email: 'tenant@demo.kr' } })
    if (!tenant) throw new Error('데모 시드가 필요합니다. 먼저 `npm run seed` 를 실행하세요.')

    // 영상이 실제로 요청을 넣는 공간들. 같은 공간에 두 번 신청하면 409가 나므로
    // 매 녹화 전에 지워 재실행 가능하게 만든다. (대시보드 데모용 연남동 요청은 남긴다)
    const targets = await prisma.listing.findMany({
      where: { OR: [{ address: { contains: '망원동' } }, { title: { contains: '연무장길' } }] },
      select: { id: true },
    })
    const ids = targets.map((t) => t.id)
    if (ids.length) {
      await prisma.application.deleteMany({ where: { tenantId: tenant.id, listingId: { in: ids } } })
      await prisma.listing.updateMany({
        where: { id: { in: ids }, status: 'CLOSED' },
        data: { status: 'OPEN' },
      })
    }
  } finally {
    await prisma.$disconnect()
  }
}

async function login(page: Page, email: string) {
  await page.goto(`${BASE}/login`)
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill('demo1234')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15_000 })
}

async function logout(page: Page) {
  await page.goto(`${BASE}/api/auth/signout`)
  await page.getByRole('button', { name: 'Sign out' }).click()
  await wait(600)
}

/** 마지막 클로징 카드 (영상 아웃트로용 오버레이) */
async function outro(page: Page) {
  await page.evaluate(() => {
    const el = document.createElement('div')
    el.id = 'demo-outro'
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'z-index:99999',
      'display:flex',
      'flex-direction:column',
      'align-items:center',
      'justify-content:center',
      'gap:18px',
      'background:#241F1B',
      'color:#fff',
      'font-family:system-ui,-apple-system,"Malgun Gothic",sans-serif',
      'text-align:center',
      'opacity:0',
      'transition:opacity 600ms ease',
    ].join(';')
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <span style="width:28px;height:28px;border-radius:8px;background:#C4562B;display:inline-block"></span>
        <span style="font-size:30px;font-weight:700">빈자리</span>
      </div>
      <p style="font-size:40px;font-weight:700;line-height:1.35;margin:0">
        공실은 기회가 되고,<br/>창업은 가벼워집니다.
      </p>
      <p style="font-size:15px;opacity:.6;margin:0">MVP 데모 · 실제 결제·법적 계약 체결 기능은 포함되어 있지 않습니다</p>
    `
    document.body.appendChild(el)
    requestAnimationFrame(() => {
      el.style.opacity = '1'
    })
  })
  await wait(4200)
}

async function main() {
  fs.mkdirSync(RAW, { recursive: true })
  fs.mkdirSync(SCENES, { recursive: true })
  for (const f of fs.readdirSync(RAW)) fs.rmSync(path.join(RAW, f), { force: true })

  await resetDemoState()

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    recordVideo: { dir: RAW, size: { width: 1280, height: 800 } },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()

  // 로그인은 녹화 대상이 아니므로 먼저 처리
  await login(page, 'tenant@demo.kr')

  // ── 장면 1. 문제 제기 (랜딩) ───────────────────────────────
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await wait(1600)
  await shot(page, '01-landing-hero')
  await smoothScroll(page, 720)
  await shot(page, '02-cost-compare')
  await wait(1400)

  // ── 장면 2. 조건 검색 ─────────────────────────────────────
  await smoothScroll(page, 0, 700)
  await page.getByLabel('지역').selectOption('성수동')
  await wait(450)
  await page.getByLabel('이용 기간').selectOption('2')
  await wait(450)
  await page.getByLabel('월 예산').selectOption('1500000')
  await wait(450)
  await page.getByLabel('하려는 업종').selectOption('CAFE')
  await wait(700)
  await shot(page, '03-quick-search')
  await page.getByRole('button', { name: '조건에 맞는 공간 찾기' }).click()

  // ── 장면 3. 검색 결과 + 지도 ──────────────────────────────
  await page.waitForURL(/\/spaces\?/)
  await page.waitForLoadState('networkidle')
  await wait(1300)
  await shot(page, '04-search-results')
  await page.getByRole('button', { name: '지도' }).click()
  await wait(1500)
  await shot(page, '05-map-view')
  await page.getByRole('button', { name: '목록' }).click()
  await wait(800)

  // ── 장면 4. 공간 선택 ─────────────────────────────────────
  await page.getByRole('link', { name: /연무장길 코너/ }).click()
  await page.waitForLoadState('networkidle')
  await wait(1400)
  await shot(page, '06-space-detail')
  await smoothScroll(page, 620)
  await wait(1200)

  // ── 장면 5. 기간 + 장비 패키지 ────────────────────────────
  await smoothScroll(page, 0, 500)
  await page.getByRole('link', { name: '이 공간으로 견적 만들기' }).click()
  await page.waitForLoadState('networkidle')
  await wait(1200)
  await page.getByRole('button', { name: '2개월', exact: true }).click()
  await wait(800)
  await shot(page, '07-quote-duration')
  await page.getByRole('button', { name: /카페 스타터/ }).click()
  await wait(1400)
  await shot(page, '08-quote-package')
  await smoothScroll(page, 420)
  await wait(1500)

  // ── 장면 6. 총비용과 절감 효과 ────────────────────────────
  await smoothScroll(page, 0, 700)
  await shot(page, '09-quote-total')
  await wait(1800)

  // ── 장면 7. 상담 요청 완료 ────────────────────────────────
  await page.getByRole('button', { name: '상담·예약 요청하기' }).click()
  await page.waitForURL(/\/quote\/request/)
  await page.waitForLoadState('networkidle')
  await wait(900)
  await page.getByLabel('이름').fill('김도현')
  await wait(250)
  await page.getByLabel('연락처').fill('010-1234-5678')
  await wait(400)
  for (const cb of await page.locator('form input[type=checkbox]').all()) {
    await cb.check()
    await wait(140)
  }
  await shot(page, '10-request-form')
  await page.getByRole('button', { name: '요청 보내기' }).click()
  try {
    await page.getByRole('heading', { name: '요청이 접수되었어요' }).waitFor({ timeout: 15_000 })
  } catch (e) {
    await shot(page, 'ERROR-request')
    const alerts = await page.getByRole('alert').allInnerTexts()
    console.error('요청 제출 실패. 화면 경고:', alerts)
    throw e
  }
  await wait(1800)
  await shot(page, '11-request-done')

  // ── 장면 8. 창업자 대시보드 ───────────────────────────────
  await page.goto(`${BASE}/dashboard`)
  await page.waitForLoadState('networkidle')
  await wait(2000)
  await shot(page, '12-tenant-dashboard')

  // ── 장면 9. 이전 티저 ─────────────────────────────────────
  await page.goto(`${BASE}/t/dudal-coffee`)
  await page.waitForLoadState('networkidle')
  await wait(1900)
  await shot(page, '13-teaser-hero')
  await smoothScroll(page, 560)
  await wait(1700)
  await shot(page, '14-teaser-hints')
  await smoothScroll(page, 1150)
  await wait(1500)
  await shot(page, '15-teaser-share')

  // ── 장면 10. 건물주: 공실 → 계약 전환 ─────────────────────
  await logout(page)
  await login(page, 'landlord@demo.kr')
  await page.goto(`${BASE}/landlord`)
  await page.waitForLoadState('networkidle')
  await wait(1700)
  await shot(page, '16-landlord-dashboard')

  const manage = page.getByRole('link', { name: '관리' }).first()
  if (await manage.count()) {
    await manage.click()
    await page.waitForLoadState('networkidle')
    await wait(1100)
    const startBtn = page.getByRole('button', { name: '상담 시작' }).first()
    if (await startBtn.count()) {
      await startBtn.click()
      await wait(1200)
    }
    const confirmBtn = page.getByRole('button', { name: '계약 확정' }).first()
    if (await confirmBtn.count()) {
      await confirmBtn.click()
      await wait(1800)
    }
    await shot(page, '17-landlord-confirmed')
  }

  // ── 클로징 ────────────────────────────────────────────────
  await page.goto(BASE)
  await page.waitForLoadState('networkidle')
  await wait(600)
  await outro(page)
  await shot(page, '18-outro')

  await context.close()
  await browser.close()

  const files = fs.readdirSync(RAW).filter((f) => f.endsWith('.webm'))
  console.log('녹화 완료:', files.map((f) => path.join('docs/demo/raw', f)).join(', '))
  console.log('장면 스크린샷:', fs.readdirSync(SCENES).length, '장')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
