import { Role } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
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
