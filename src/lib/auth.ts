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

/** 카카오로 처음 로그인한 사람을 위해, 역할 없이(null) 계정을 찾거나 만든다. */
async function findOrCreateKakaoUser(email: string, name: string) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return existing
  return prisma.user.create({
    data: {
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
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'kakao') {
        if (!user.email) return false // 카카오 계정에 이메일 동의가 없으면 로그인 불가
        const dbUser = await findOrCreateKakaoUser(user.email, user.name ?? '카카오 사용자')
        // jwt 콜백이 이 값을 그대로 이어받도록 user 객체를 실제 DB 레코드로 덮어쓴다.
        user.id = dbUser.id
        user.role = dbUser.role
      }
      return true
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      // 역할 선택 화면에서 저장한 뒤 update()를 호출하면 DB의 최신 role을 다시 읽어온다.
      if (trigger === 'update' && token.id) {
        const fresh = await prisma.user.findUnique({ where: { id: token.id }, select: { role: true } })
        if (fresh) token.role = fresh.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      return session
    },
  },
}
