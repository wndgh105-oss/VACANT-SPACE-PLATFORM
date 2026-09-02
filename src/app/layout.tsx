import './globals.css'
import { SessionProviderWrapper } from '@/components/SessionProviderWrapper'
import { RoleNav } from '@/components/RoleNav'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <SessionProviderWrapper>
          <RoleNav />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
