import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  function redirectToLogin() {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  if (!token) {
    return redirectToLogin()
  }

  // 카카오 등 소셜 로그인으로 막 생긴 계정은 역할(과, 이메일 동의가 아직 없다면 이메일)을
  // 고르기 전까지 다른 곳에 못 들어간다.
  if ((!token.role || !token.email) && pathname !== '/onboarding/role') {
    const url = new URL('/onboarding/role', request.url)
    url.searchParams.set('callbackUrl', pathname + search)
    return NextResponse.redirect(url)
  }

  if (pathname.startsWith('/landlord') && token.role !== 'LANDLORD') {
    return redirectToLogin()
  }

  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    return redirectToLogin()
  }

  if (pathname.startsWith('/partner') && token.role !== 'PARTNER' && token.role !== 'ADMIN') {
    return redirectToLogin()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/tenant/my/:path*', '/landlord/:path*', '/admin/:path*', '/dashboard/:path*', '/partner/:path*', '/onboarding/:path*'],
}
