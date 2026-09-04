import type { Metadata } from 'next'
import './globals.css'
import { SessionProviderWrapper } from '@/components/SessionProviderWrapper'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { DemoBanner } from '@/components/DemoBanner'

export const metadata: Metadata = {
  title: '빈자리 — 단기 임대형 공실 완화 · 모듈형 창업 렌탈',
  description:
    '비어 있는 상가를 2개월 단위로 빌리고 장비를 패키지로 함께 대여해, 수백만 원으로 창업을 시험 운영하는 플랫폼 (MVP 데모).',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SessionProviderWrapper>
          <DemoBanner />
          <SiteHeader />
          <main id="main">{children}</main>
          <SiteFooter />
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
