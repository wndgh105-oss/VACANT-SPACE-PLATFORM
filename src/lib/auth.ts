import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import KakaoProvider from 'next-auth/providers/kakao'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { prisma } from '@/lib/prisma'

export async function authorizeCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role }
}

/**
 * 카카오로 처음 로그인한 사람을 위해, 역할 없이(null) 계정을 찾거나 만든다.
 * account_email 동의항목이 카카오 심사 대기 중이라 이메일이 없을 수 있으므로,
 * 카카오 고유 ID(kakaoId)를 기준으로 계정을 식별한다. 이메일이 오면(심사 통과 후)
 * 기존에 이메일로 가입한 계정과도 연결해 중복 계정이 생기지 않게 한다.
 */
async function findOrCreateKakaoUser(kakaoId: string, email: string | null, name: string) {
  const byKakaoId = await prisma.user.findUnique({ where: { kakaoId } })
  if (byKakaoId) return byKakaoId

  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) {
      return prisma.user.update({ where: { id: byEmail.id }, data: { kakaoId } })
    }
  }

  return prisma.user.create({
    data: {
      kakaoId,
      email,
      name,
      // 소셜 로그인 계정은 비밀번호 기반 로그인을 쓰지 않으므로 해시를 채울 필요는 없지만,
      // 컬럼이 NOT NULL이라 검증 불가능한 무작위 값을 채워 자격증명 로그인 경로를 원천 차단한다.
      passwordHash: await bcrypt.hash(randomUUID(), 10),
      role: null,
    },
  })
}

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        return authorizeCredentials(credentials.email, credentials.password)
      },
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID ?? '',
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? '',
      // account_email은 개인 개발자 비즈 앱 전환 후 필수 동의로 설정 완료 (2026-09-05).
      authorization: { params: { scope: 'profile_nickname account_email' } },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'kakao') {
        const dbUser = await findOrCreateKakaoUser(account.providerAccountId, user.email ?? null, user.name ?? '카카오 사용자')
        // jwt 콜백이 이 값을 그대로 이어받도록 user 객체를 실제 DB 레코드로 덮어쓴다.
        user.id = dbUser.id
        user.email = dbUser.email
        user.role = dbUser.role
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.email = user.email
      }
      // 온보딩 화면에서 역할(+이메일)을 저장한 뒤 update()를 호출하면 DB 최신값을 다시 읽어온다.
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({ where: { id: token.id }, select: { role: true, email: true } })
        if (fresh) {
          token.role = fresh.role
          token.email = fresh.email
        }
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.email = token.email ?? null
      return session
    },
  },
}
