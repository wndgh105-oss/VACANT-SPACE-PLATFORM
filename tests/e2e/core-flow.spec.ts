import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill('password123')
  await page.getByRole('button', { name: '로그인', exact: true }).click()
  await expect(page.getByLabel('이메일')).toHaveCount(0)
}

async function logout(page: import('@playwright/test').Page) {
  // NextAuth's GET /api/auth/signout only renders a confirmation page; actually
  // ending the session requires submitting its POST form.
  await page.goto('/api/auth/signout')
  await page.getByRole('button', { name: 'Sign out' }).click()
}

test('tenant applies, admin confirms, landlord sees closed listing', async ({ page }) => {
  await login(page, 'tenant@e2e.test')
  await page.goto('/tenant')
  await page.getByText('서울시 마포구 연남동 E2E 테스트 공실').click()
  await page.getByRole('link', { name: '신청하기' }).click()

  await page.getByPlaceholder('이름').fill('창업자테스트')
  await page.getByPlaceholder('연락처').fill('010-1234-5678')
  await page.locator('input[type=date]').fill('2026-10-01')
  await page.getByRole('button', { name: '신청하기' }).click()
  await expect(page.getByText('운영팀이 확인 후')).toBeVisible()

  await logout(page)
  await login(page, 'admin@e2e.test')
  await page.goto('/admin')
  // Scope to the application row's status <select> (not the top status-filter
  // combobox) and wait for the table to finish its client-side fetch before
  // interacting with it.
  // 데모 시드가 다른 신청을 함께 만들어 두므로, 이 테스트가 만든 공실의 행으로 좁힌다.
  const row = page.locator('tbody tr', { hasText: '서울시 마포구 연남동 E2E 테스트 공실' })
  const rowStatusSelect = row.getByRole('combobox')
  await expect(rowStatusSelect).toBeVisible()
  page.once('dialog', (dialog) => dialog.accept())
  const patchResponse = page.waitForResponse(
    (res) => res.url().includes('/api/applications/') && res.request().method() === 'PATCH'
  )
  await rowStatusSelect.selectOption('CONFIRMED')
  const response = await patchResponse
  expect(response.ok()).toBeTruthy()
  await expect(row.locator('span.rounded-full', { hasText: '계약 확정' })).toBeVisible()

  await logout(page)
  await login(page, 'landlord@e2e.test')
  await page.goto('/landlord')
  await expect(page.getByText('마감').first()).toBeVisible()
})
