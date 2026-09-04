import { test, expect } from '@playwright/test'

/**
 * VACANT SPACE 확장 범위의 핵심 흐름.
 * 데모 시드(`npm run seed`)가 먼저 실행되어 있어야 한다.
 */

async function loginDemo(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill('demo1234')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page.getByLabel('이메일')).toHaveCount(0)
}

test('랜딩에서 조건 검색 → 견적 → 상담 요청까지 이어진다', async ({ page }) => {
  await loginDemo(page, 'tenant@demo.kr')

  // 랜딩 퀵 검색
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /두 달만 장사해 보세요/ })).toBeVisible()
  await page.getByLabel('지역').selectOption('망원동')
  await page.getByLabel('월 예산').selectOption('1200000')
  await page.getByLabel('하려는 업종').selectOption('CAFE')
  await page.getByRole('button', { name: '조건에 맞는 공간 찾기' }).click()

  // 검색 결과
  await expect(page).toHaveURL(/\/spaces\?/)
  const card = page.getByRole('link', { name: /망원시장 초입/ })
  await expect(card).toBeVisible()
  await card.click()

  // 상세 → 견적
  await expect(page.getByRole('heading', { name: /망원시장 초입/ })).toBeVisible()
  await page.getByRole('link', { name: '이 공간으로 견적 만들기' }).click()

  // 견적: 기간 + 패키지 선택 시 합계가 실제로 바뀐다
  await expect(page.getByRole('heading', { name: /얼마나 빌릴까요/ })).toBeVisible()
  await page.getByRole('button', { name: '2개월', exact: true }).click()
  await page.getByRole('button', { name: /카페 스타터/ }).click()

  const summary = page.getByText('계약 시점에 필요한 현금').locator('..')
  const withPackage = await summary.innerText()

  // 선택 품목을 빼면 금액이 줄어야 한다
  await page.getByRole('checkbox', { name: /제빙기/ }).uncheck()
  await expect(summary).not.toHaveText(withPackage)

  // 요청 화면
  await page.getByRole('button', { name: '상담·예약 요청하기' }).click()
  await expect(page).toHaveURL(/\/quote\/request/)

  await page.getByLabel('이름').fill('김도현')
  await page.getByLabel('연락처').fill('010-1234-5678')
  for (const checkbox of await page.locator('form input[type=checkbox]').all()) {
    await checkbox.check()
  }
  await page.getByRole('button', { name: '요청 보내기' }).click()

  await expect(page.getByRole('heading', { name: '요청이 접수되었어요' })).toBeVisible()
  await expect(page.getByText('아직 결제나 계약이 진행된 것은 아닙니다')).toBeVisible()
})

test('이전 소식 티저 페이지가 비로그인 방문자에게 공개된다', async ({ page }) => {
  await page.goto('/t/dudal-coffee')
  await expect(page.getByRole('heading', { name: /우리가 어디로 옮겼게요/ })).toBeVisible()
  await expect(page.getByText('아직 성수동을 벗어나지 않았어요.')).toBeVisible()
  await expect(page.getByRole('link', { name: '나도 두 달만 열어보기' })).toBeVisible()
})

test('창업자 대시보드가 운영 중인 계약과 남은 기간을 보여준다', async ({ page }) => {
  await loginDemo(page, 'tenant@demo.kr')
  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: '내 창업 현황' })).toBeVisible()
  await expect(page.getByText('계약 종료까지')).toBeVisible()
  await expect(page.getByText(/^D-\d+$/)).toBeVisible()
})

test('예산 계산기가 예산에 맞는 공간을 찾아준다', async ({ page }) => {
  await page.goto('/calculator')
  await page.getByLabel('쓸 수 있는 총 예산').fill('900')
  await page.getByRole('button', { name: '2개월', exact: true }).click()
  await expect(page.getByText(/월 이용료/).first()).toBeVisible()
  await expect(page.getByRole('heading', { name: /지금 예산으로 가능한 공간/ })).toBeVisible()
})

test('모든 페이지에 데모 고지가 상시 노출된다', async ({ page }) => {
  for (const path of ['/', '/spaces', '/calculator', '/guide/legal', '/t/dudal-coffee']) {
    await page.goto(path)
    await expect(page.getByText('실제 매물·실제 결제·법적 계약 체결이 아닙니다.', { exact: false })).toBeVisible()
  }
})
