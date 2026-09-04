'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { roleLabel } from '@/lib/labels'

type NavLink = { href: string; label: string }

const PUBLIC_LINKS: NavLink[] = [
  { href: '/spaces', label: '공간 찾기' },
  { href: '/calculator', label: '창업 예산 계산기' },
  { href: '/guide/legal', label: '법률·인허가 안내' },
]

const ROLE_LINKS: Record<string, NavLink[]> = {
  TENANT: [
    { href: '/spaces', label: '공간 찾기' },
    { href: '/dashboard', label: '내 창업 현황' },
    { href: '/dashboard/applications', label: '요청 현황' },
    { href: '/dashboard/favorites', label: '관심 공간' },
  ],
  LANDLORD: [
    { href: '/landlord', label: '내 공실' },
    { href: '/landlord/listings/new', label: '공실 등록' },
  ],
  PARTNER: [
    { href: '/partner', label: '파트너 홈' },
    { href: '/partner/packages', label: '패키지 관리' },
    { href: '/partner/orders', label: '장비 주문' },
  ],
  ADMIN: [
    { href: '/admin/overview', label: '운영 대시보드' },
    { href: '/admin', label: '신청 관리' },
    { href: '/admin/packages', label: '장비 패키지' },
  ],
}

export function SiteHeader() {
  const { data: session, status } = useSession()
  const [open, setOpen] = useState(false)

  const role = session?.user.role
  const links = role ? (ROLE_LINKS[role] ?? PUBLIC_LINKS) : PUBLIC_LINKS

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg)]/95 backdrop-blur">
      <div className="vs-container flex h-14 items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
          <span
            aria-hidden
            className="inline-block h-5 w-5 rounded-[6px] bg-[var(--brand)]"
          />
          <span className="text-[17px]">빈자리</span>
        </Link>

        <nav aria-label="주요 메뉴" className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-[14px] font-medium text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--ink)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {status === 'loading' ? (
            <div className="vs-skeleton h-8 w-24" aria-hidden />
          ) : session ? (
            <>
              <span className="hidden text-[13px] text-[var(--ink-muted)] sm:inline">
                {session.user.name}
                <span className="vs-badge vs-badge-brand ml-2">{roleLabel(role!)}</span>
              </span>
              <button
                type="button"
                className="vs-btn vs-btn-ghost !px-3 !py-2 !text-[14px]"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="vs-btn vs-btn-ghost !px-3 !py-2 !text-[14px]">
                로그인
              </Link>
              <Link href="/register" className="vs-btn vs-btn-primary !px-3 !py-2 !text-[14px]">
                시작하기
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label="메뉴 열기"
            aria-expanded={open}
            className="vs-btn vs-btn-secondary !px-3 !py-2 md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden>☰</span>
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="모바일 메뉴" className="vs-fade border-t border-[var(--line)] bg-[var(--surface)] md:hidden">
          <div className="vs-container flex flex-col py-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-3 text-[15px] font-medium"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
