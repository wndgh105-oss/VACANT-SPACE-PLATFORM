import { Role } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      /** 카카오 이메일 동의가 심사 대기 중인 계정은 온보딩에서 입력받기 전까지 null이다. */
      email: string | null
      name: string
      /** 카카오 등 소셜 로그인으로 새로 만든 계정은 역할을 고르기 전까지 null이다. */
      role: Role | null
    }
  }
  interface User {
    id: string
    role: Role | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role | null
  }
}
