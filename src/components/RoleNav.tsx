'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

export function RoleNav() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <nav className="flex items-center gap-4 border-b p-4">
        <Link href="/tenant">홈</Link>
        <Link href="/login">로그인</Link>
        <Link href="/register">회원가입</Link>
      </nav>
    )
  }

  const role = session.user.role
  return (
    <nav className="flex items-center gap-4 border-b p-4">
      {role === 'TENANT' && (
        <>
          <Link href="/tenant">홈</Link>
          <Link href="/tenant/my/applications">신청 현황</Link>
          <Link href="/tenant/my/favorites">관심 목록</Link>
        </>
      )}
      {role === 'LANDLORD' && <Link href="/landlord">내 공실 대시보드</Link>}
      {role === 'ADMIN' && (
        <>
          <Link href="/admin">신청 관리</Link>
          <Link href="/admin/packages">장비 패키지 관리</Link>
        </>
      )}
      <button onClick={() => signOut({ callbackUrl: '/login' })}>로그아웃</button>
    </nav>
  )
}
