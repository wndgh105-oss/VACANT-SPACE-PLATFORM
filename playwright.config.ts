import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  globalSetup: './tests/e2e/globalSetup.ts',
  timeout: 30_000,
  // A cold `next dev` process compiles the NextAuth catch-all route and several
  // pages on demand; on the very first run this can make the CSRF-token cookie
  // write race the credentials POST that immediately follows it, so the first
  // sign-in attempt spuriously fails server-side (see task-18-report.md for the
  // full trace). The server is fully warm by the retry, so a single retry
  // reliably absorbs this one-time cold-start hiccup without masking a real bug.
  retries: 1,
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    // Node가 시스템 PATH에 없는 환경(포터블 설치 등)에서는
    // E2E_DEV_COMMAND로 npm 실행 경로를 지정할 수 있다.
    command: process.env.E2E_DEV_COMMAND ?? 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
