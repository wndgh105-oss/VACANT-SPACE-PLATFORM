# 단기 임대형 모듈 창업 플랫폼 MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 창업자가 예산·업종·계약기간으로 공실을 찾아 신청하고, 건물주가 공실을 등록·신청을 확인하고, 운영자가 신청 상태와 장비 패키지를 관리하는 3축 MVP 웹 플랫폼을 구축한다.

**Architecture:** Next.js(App Router) 단일 애플리케이션 안에서 역할(Role: TENANT/LANDLORD/ADMIN)별 라우트 세그먼트(`/tenant`, `/landlord`, `/admin`)로 화면을 분리하고, 세 역할이 공유하는 Prisma/PostgreSQL 데이터 모델(Listing, Application, EquipmentPackage, User, Favorite)을 Route Handler API로 노출한다. 인증은 NextAuth Credentials로 처리하고 세션에 role을 실어 라우트/역할 가드에 사용한다.

**Tech Stack:** Next.js 14(App Router) + TypeScript, Prisma + PostgreSQL, NextAuth.js(Credentials), Tailwind CSS, bcryptjs, Vitest + React Testing Library(단위/통합), Playwright(핵심 플로우 E2E)

**Spec:**
- [docs/superpowers/specs/2026-09-02-tenant-screens-design.md](../specs/2026-09-02-tenant-screens-design.md)
- [docs/superpowers/specs/2026-09-02-landlord-screens-design.md](../specs/2026-09-02-landlord-screens-design.md)
- [docs/superpowers/specs/2026-09-02-admin-screens-design.md](../specs/2026-09-02-admin-screens-design.md)

## Global Constraints

- 웹(반응형) 우선, 모바일 네이티브 앱은 범위 밖 (스펙: 범위 결정 사항)
- MVP는 온라인 결제 없음 — 계약·정산은 오프라인, "신청/상담 요청"까지만 시스템으로 처리 (스펙: 범위 결정 사항)
- 계정 시스템은 이메일 기반 간단 회원가입/로그인 (창업자/건물주), 운영자는 사전 발급 계정으로 가입 화면 없음
- 장비 패키지는 업종(BusinessType)당 1개의 표준 패키지만 존재하며 운영자만 등록/수정 가능, 창업자·건물주는 참조만 함
- 신청 상태 "확정" ↔ 공실 상태 "마감"은 항상 양방향으로 연동됨 (운영자 스펙 §2)
- 사진 업로드는 MVP에서 로컬 파일시스템(`/public/uploads`) 저장
- 테스트 전략: 상태 전이·필터링 등 핵심 비즈니스 로직은 순수 함수로 추출해 Vitest 단위 테스트, API Route Handler는 Prisma를 모킹한 Vitest 통합 테스트, 상호작용이 있는 컴포넌트는 React Testing Library, 전체 플로우 1건만 Playwright E2E로 검증
- Node.js LTS(20.x 이상), TypeScript strict 모드

---

## Phase 0: 공통 기반 (Foundation)

### Task 1: 프로젝트 스캐폴딩 및 의존성 설치

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.js`, `.env`, `.env.example`
- Create: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`

**Interfaces:**
- Produces: Next.js App Router 프로젝트 뼈대. 이후 모든 태스크가 이 위에서 작업

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
npx create-next-app@14 . --typescript --tailwind --app --no-src-dir=false --import-alias "@/*" --eslint
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install prisma @prisma/client next-auth bcryptjs
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/bcryptjs @playwright/test
```

- [ ] **Step 3: 환경 변수 파일 작성**

`.env.example` (그리고 로컬용 `.env`에 실제 값 채우기):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/rental_platform"
NEXTAUTH_SECRET="change-me-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

- [ ] **Step 4: Vitest 설정 파일 작성**

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

`vitest.setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

`package.json`의 `scripts`에 추가:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 기본 Next.js 페이지가 에러 없이 빌드됨

- [ ] **Step 6: Commit**

```bash
git init
git add -A
git commit -m "chore: scaffold Next.js project with Tailwind, Vitest, Playwright"
```

---

### Task 2: Prisma 스키마 정의 및 마이그레이션

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/prisma.ts`
- Test: `tests/unit/lib/prisma.test.ts`

**Interfaces:**
- Produces:
  - Prisma Client 싱글턴: `import { prisma } from '@/lib/prisma'`
  - 모델: `User`, `Listing`, `Application`, `EquipmentPackage`, `Favorite`
  - Enum: `Role`(TENANT/LANDLORD/ADMIN), `BusinessType`(CAFE/RETAIL/OTHER), `ListingStatus`(OPEN/CLOSED), `ApplicationStatus`(PENDING/CONTACTING/CONFIRMED/REJECTED)

- [ ] **Step 1: Prisma 초기화**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: 스키마 작성**

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  TENANT
  LANDLORD
  ADMIN
}

enum BusinessType {
  CAFE
  RETAIL
  OTHER
}

enum ListingStatus {
  OPEN
  CLOSED
}

enum ApplicationStatus {
  PENDING
  CONTACTING
  CONFIRMED
  REJECTED
}

model User {
  id           String        @id @default(cuid())
  email        String        @unique
  passwordHash String
  name         String
  role         Role
  createdAt    DateTime      @default(now())
  listings     Listing[]     @relation("LandlordListings")
  applications Application[] @relation("TenantApplications")
  favorites    Favorite[]
}

model Listing {
  id                String         @id @default(cuid())
  landlordId        String
  landlord          User           @relation("LandlordListings", fields: [landlordId], references: [id])
  address           String
  area              Float
  monthlyRent       Int
  deposit           Int
  photos            String[]
  contractDurations Int[]
  businessTypes     BusinessType[]
  status            ListingStatus  @default(OPEN)
  createdAt         DateTime       @default(now())
  applications      Application[]
  favorites         Favorite[]
}

model EquipmentPackage {
  id           String       @id @default(cuid())
  businessType BusinessType @unique
  name         String
  items        String[]
  monthlyFee   Int
  createdAt    DateTime     @default(now())
}

model Application {
  id               String            @id @default(cuid())
  listingId        String
  listing          Listing           @relation(fields: [listingId], references: [id])
  tenantId         String
  tenant           User              @relation("TenantApplications", fields: [tenantId], references: [id])
  applicantName    String
  phone            String
  desiredDuration  Int
  desiredStartDate DateTime
  message          String?
  status           ApplicationStatus @default(PENDING)
  createdAt        DateTime          @default(now())
}

model Favorite {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    User     @relation(fields: [tenantId], references: [id])
  listingId String
  listing   Listing  @relation(fields: [listingId], references: [id])
  createdAt DateTime @default(now())

  @@unique([tenantId, listingId])
}
```

- [ ] **Step 3: Prisma Client 싱글턴 작성**

`src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: 싱글턴 동작 테스트 작성 (실패 확인 없이 바로 검증 가능한 단순 케이스)**

`tests/unit/lib/prisma.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('prisma client singleton', () => {
  it('exports a PrismaClient instance with expected models', () => {
    expect(prisma.user).toBeDefined()
    expect(prisma.listing).toBeDefined()
    expect(prisma.application).toBeDefined()
    expect(prisma.equipmentPackage).toBeDefined()
    expect(prisma.favorite).toBeDefined()
  })
})
```

- [ ] **Step 5: 마이그레이션 실행 및 테스트 확인**

Run: `npx prisma migrate dev --name init`
Run: `npm run test -- tests/unit/lib/prisma.test.ts`
Expected: 마이그레이션 성공, 테스트 PASS

- [ ] **Step 6: Commit**

```bash
git add prisma src/lib/prisma.ts tests/unit/lib/prisma.test.ts
git commit -m "feat: define Prisma schema and client singleton"
```

---

### Task 3: NextAuth 설정 (Credentials, role 포함 세션)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/types/next-auth.d.ts`
- Test: `tests/unit/lib/auth.test.ts`

**Interfaces:**
- Consumes: `prisma`(Task 2), `bcryptjs`
- Produces:
  - `authOptions: NextAuthOptions` (`@/lib/auth`)
  - 세션 타입 확장: `session.user.id: string`, `session.user.role: Role`

- [ ] **Step 1: 세션 타입 확장 작성**

`src/types/next-auth.d.ts`:

```typescript
import { Role } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
    }
  }
  interface User {
    id: string
    role: Role
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
  }
}
```

- [ ] **Step 2: 인증 로직 실패 테스트 작성**

`tests/unit/lib/auth.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { authorizeCredentials } from '@/lib/auth'

describe('authorizeCredentials', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null when user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    const result = await authorizeCredentials('a@a.com', 'pw')
    expect(result).toBeNull()
  })

  it('returns null when password does not match', async () => {
    const hash = await bcrypt.hash('correct-password', 10)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1', email: 'a@a.com', passwordHash: hash, name: 'A', role: 'TENANT', createdAt: new Date(),
    } as never)
    const result = await authorizeCredentials('a@a.com', 'wrong-password')
    expect(result).toBeNull()
  })

  it('returns user object when password matches', async () => {
    const hash = await bcrypt.hash('correct-password', 10)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: '1', email: 'a@a.com', passwordHash: hash, name: 'A', role: 'TENANT', createdAt: new Date(),
    } as never)
    const result = await authorizeCredentials('a@a.com', 'correct-password')
    expect(result).toEqual({ id: '1', email: 'a@a.com', name: 'A', role: 'TENANT' })
  })
})
```

- [ ] **Step 3: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/lib/auth.test.ts`
Expected: FAIL (`authorizeCredentials` is not exported)

- [ ] **Step 4: authOptions 구현**

`src/lib/auth.ts`:

```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function authorizeCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return null
  return { id: user.id, email: user.email, name: user.name, role: user.role }
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
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
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
```

- [ ] **Step 5: Route Handler 작성**

`src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
```

- [ ] **Step 6: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/lib/auth.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth.ts src/app/api/auth src/types/next-auth.d.ts tests/unit/lib/auth.test.ts
git commit -m "feat: add NextAuth credentials auth with role-aware session"
```

---

### Task 4: 회원가입 API + 회원가입/로그인 화면

**Files:**
- Create: `src/app/api/auth/register/route.ts`
- Create: `src/app/(auth)/register/page.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Test: `tests/unit/api/register.test.ts`

**Interfaces:**
- Consumes: `prisma`(Task 2), `authOptions`(Task 3)
- Produces: `POST /api/auth/register` — body `{ email, password, name, role: 'TENANT' | 'LANDLORD' }` → 201 시 `{ id, email, name, role }`, 이메일 중복 시 409

- [ ] **Step 1: 실패 테스트 작성**

`tests/unit/api/register.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/auth/register/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 409 when email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1' } as never)
    const res = await POST(makeRequest({ email: 'a@a.com', password: 'pw123456', name: 'A', role: 'TENANT' }))
    expect(res.status).toBe(409)
  })

  it('creates user and returns 201 on valid input', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: '1', email: 'a@a.com', name: 'A', role: 'TENANT', passwordHash: 'x', createdAt: new Date(),
    } as never)
    const res = await POST(makeRequest({ email: 'a@a.com', password: 'pw123456', name: 'A', role: 'TENANT' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toEqual({ id: '1', email: 'a@a.com', name: 'A', role: 'TENANT' })
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makeRequest({ email: 'a@a.com' }))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/register.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password, name, role } = body as {
    email?: string
    password?: string
    name?: string
    role?: Role
  }

  if (!email || !password || !name || (role !== 'TENANT' && role !== 'LANDLORD')) {
    return NextResponse.json({ error: 'invalid input' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({
    data: { email, passwordHash, name, role },
  })

  return NextResponse.json(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    { status: 201 }
  )
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/api/register.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 회원가입 화면 작성**

`src/app/(auth)/register/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'TENANT' })
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.status === 409) {
      setError('이미 등록된 이메일입니다.')
      return
    }
    if (!res.ok) {
      setError('입력 값을 확인해주세요.')
      return
    }
    router.push('/login')
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-sm space-y-4 p-4">
      <h1 className="text-xl font-bold">회원가입</h1>
      <div className="flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded border p-2 ${form.role === 'TENANT' ? 'bg-black text-white' : ''}`}
          onClick={() => setForm({ ...form, role: 'TENANT' })}
        >
          창업자로 가입
        </button>
        <button
          type="button"
          className={`flex-1 rounded border p-2 ${form.role === 'LANDLORD' ? 'bg-black text-white' : ''}`}
          onClick={() => setForm({ ...form, role: 'LANDLORD' })}
        >
          건물주로 가입
        </button>
      </div>
      <input
        className="w-full rounded border p-2"
        placeholder="이름"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="이메일"
        type="email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="비밀번호"
        type="password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded bg-black p-2 text-white" type="submit">
        가입하기
      </button>
    </form>
  )
}
```

- [ ] **Step 6: 로그인 화면 작성**

`src/app/(auth)/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      return
    }
    router.push(searchParams.get('callbackUrl') ?? '/')
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-16 max-w-sm space-y-4 p-4">
      <h1 className="text-xl font-bold">로그인</h1>
      <input
        className="w-full rounded border p-2"
        placeholder="이메일"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="비밀번호"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded bg-black p-2 text-white" type="submit">
        로그인
      </button>
    </form>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/auth/register src/app/\(auth\) tests/unit/api/register.test.ts
git commit -m "feat: add registration API and auth screens"
```

---

### Task 5: 공용 컴포넌트 (레이아웃, 배지, 리스팅 카드)

**Files:**
- Create: `src/components/RoleNav.tsx`
- Create: `src/components/StatusBadge.tsx`
- Create: `src/components/ListingCard.tsx`
- Create: `src/lib/labels.ts`
- Test: `tests/unit/components/StatusBadge.test.tsx`
- Test: `tests/unit/components/ListingCard.test.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Produces:
  - `labels.ts`: `businessTypeLabel(type: BusinessType): string`, `applicationStatusLabel(status: ApplicationStatus): string`
  - `<StatusBadge status={ApplicationStatus | ListingStatus} />`
  - `<ListingCard listing={{ id, address, monthlyRent, businessTypes, status, photos }} />` (Task 7 이후 API 응답과 동일한 필드 사용)

- [ ] **Step 1: 라벨 유틸 작성 (테스트 없이 바로 구현 — 단순 매핑 테이블)**

`src/lib/labels.ts`:

```typescript
import { BusinessType, ApplicationStatus, ListingStatus } from '@prisma/client'

export function businessTypeLabel(type: BusinessType): string {
  const map: Record<BusinessType, string> = {
    CAFE: '카페',
    RETAIL: '소매·팝업',
    OTHER: '기타',
  }
  return map[type]
}

export function applicationStatusLabel(status: ApplicationStatus): string {
  const map: Record<ApplicationStatus, string> = {
    PENDING: '대기중',
    CONTACTING: '연락중',
    CONFIRMED: '확정',
    REJECTED: '반려',
  }
  return map[status]
}

export function listingStatusLabel(status: ListingStatus): string {
  const map: Record<ListingStatus, string> = {
    OPEN: '공개중',
    CLOSED: '마감',
  }
  return map[status]
}
```

- [ ] **Step 2: StatusBadge 실패 테스트 작성**

`tests/unit/components/StatusBadge.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/StatusBadge'

describe('StatusBadge', () => {
  it('renders the Korean label for an application status', () => {
    render(<StatusBadge kind="application" status="CONFIRMED" />)
    expect(screen.getByText('확정')).toBeInTheDocument()
  })

  it('renders the Korean label for a listing status', () => {
    render(<StatusBadge kind="listing" status="CLOSED" />)
    expect(screen.getByText('마감')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/components/StatusBadge.test.tsx`
Expected: FAIL (모듈 없음)

- [ ] **Step 4: StatusBadge 구현**

`src/components/StatusBadge.tsx`:

```tsx
import { ApplicationStatus, ListingStatus } from '@prisma/client'
import { applicationStatusLabel, listingStatusLabel } from '@/lib/labels'

type Props =
  | { kind: 'application'; status: ApplicationStatus }
  | { kind: 'listing'; status: ListingStatus }

export function StatusBadge(props: Props) {
  const label = props.kind === 'application'
    ? applicationStatusLabel(props.status)
    : listingStatusLabel(props.status)

  const colorClass =
    props.status === 'CONFIRMED' || props.status === 'OPEN'
      ? 'bg-green-100 text-green-800'
      : props.status === 'REJECTED' || props.status === 'CLOSED'
        ? 'bg-gray-200 text-gray-600'
        : 'bg-yellow-100 text-yellow-800'

  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}
```

- [ ] **Step 5: ListingCard 실패 테스트 작성**

`tests/unit/components/ListingCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ListingCard } from '@/components/ListingCard'

const listing = {
  id: 'l1',
  address: '서울시 마포구 연남동',
  monthlyRent: 800000,
  businessTypes: ['CAFE'] as const,
  status: 'OPEN' as const,
  photos: [],
}

describe('ListingCard', () => {
  it('renders address, formatted rent, and business type label', () => {
    render(<ListingCard listing={listing} />)
    expect(screen.getByText('서울시 마포구 연남동')).toBeInTheDocument()
    expect(screen.getByText('월 800,000원')).toBeInTheDocument()
    expect(screen.getByText('카페')).toBeInTheDocument()
  })
})
```

- [ ] **Step 6: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/components/ListingCard.test.tsx`
Expected: FAIL (모듈 없음)

- [ ] **Step 7: ListingCard 구현**

`src/components/ListingCard.tsx`:

```tsx
import Link from 'next/link'
import { BusinessType, ListingStatus } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'
import { StatusBadge } from '@/components/StatusBadge'

export type ListingCardData = {
  id: string
  address: string
  monthlyRent: number
  businessTypes: BusinessType[]
  status: ListingStatus
  photos: string[]
}

export function ListingCard({ listing }: { listing: ListingCardData }) {
  return (
    <Link href={`/tenant/listings/${listing.id}`} className="block rounded border p-3 hover:shadow">
      <div className="mb-2 h-32 w-full rounded bg-gray-100">
        {listing.photos[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photos[0]} alt={listing.address} className="h-full w-full rounded object-cover" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <p className="font-medium">{listing.address}</p>
        <StatusBadge kind="listing" status={listing.status} />
      </div>
      <p className="text-sm text-gray-600">월 {listing.monthlyRent.toLocaleString()}원</p>
      <div className="mt-1 flex gap-1">
        {listing.businessTypes.map((t) => (
          <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
            {businessTypeLabel(t)}
          </span>
        ))}
      </div>
    </Link>
  )
}
```

- [ ] **Step 8: 역할별 네비게이션 작성**

`src/components/RoleNav.tsx`:

```tsx
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
```

- [ ] **Step 9: 루트 레이아웃에 세션 프로바이더와 네비게이션 연결**

`src/app/layout.tsx`:

```tsx
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
```

`src/components/SessionProviderWrapper.tsx`:

```tsx
'use client'

import { SessionProvider } from 'next-auth/react'

export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

- [ ] **Step 10: 테스트 실행하여 전체 통과 확인**

Run: `npm run test -- tests/unit/components`
Expected: PASS (3 tests)

- [ ] **Step 11: Commit**

```bash
git add src/components src/lib/labels.ts src/app/layout.tsx tests/unit/components
git commit -m "feat: add shared layout, status badge, and listing card components"
```

---

## Phase 1: 창업자(Tenant) 화면

### Task 6: 공실 목록 조회 API (필터: 가격대/업종/계약기간)

**Files:**
- Create: `src/lib/listingFilters.ts`
- Create: `src/app/api/listings/route.ts`
- Test: `tests/unit/lib/listingFilters.test.ts`
- Test: `tests/unit/api/listings.test.ts`

**Interfaces:**
- Produces:
  - `parseListingFilters(searchParams: URLSearchParams): { minPrice?: number; maxPrice?: number; businessType?: BusinessType; duration?: number }`
  - `buildListingWhere(filters): Prisma.ListingWhereInput`
  - `GET /api/listings?minPrice=&maxPrice=&businessType=&duration=` → `ListingCardData[]` (OPEN 상태만 기본 노출)

- [ ] **Step 1: 필터 파싱/쿼리 빌더 실패 테스트 작성**

`tests/unit/lib/listingFilters.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { parseListingFilters, buildListingWhere } from '@/lib/listingFilters'

describe('parseListingFilters', () => {
  it('parses all provided filters', () => {
    const params = new URLSearchParams('minPrice=500000&maxPrice=1000000&businessType=CAFE&duration=2')
    expect(parseListingFilters(params)).toEqual({
      minPrice: 500000,
      maxPrice: 1000000,
      businessType: 'CAFE',
      duration: 2,
    })
  })

  it('returns empty object when no params given', () => {
    expect(parseListingFilters(new URLSearchParams())).toEqual({})
  })
})

describe('buildListingWhere', () => {
  it('always restricts to OPEN listings', () => {
    expect(buildListingWhere({})).toMatchObject({ status: 'OPEN' })
  })

  it('adds price range, business type, and duration conditions', () => {
    const where = buildListingWhere({ minPrice: 500000, maxPrice: 1000000, businessType: 'CAFE', duration: 2 })
    expect(where).toMatchObject({
      status: 'OPEN',
      monthlyRent: { gte: 500000, lte: 1000000 },
      businessTypes: { has: 'CAFE' },
      contractDurations: { has: 2 },
    })
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/lib/listingFilters.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/lib/listingFilters.ts`:

```typescript
import { Prisma, BusinessType } from '@prisma/client'

export type ListingFilters = {
  minPrice?: number
  maxPrice?: number
  businessType?: BusinessType
  duration?: number
}

export function parseListingFilters(searchParams: URLSearchParams): ListingFilters {
  const filters: ListingFilters = {}
  const minPrice = searchParams.get('minPrice')
  const maxPrice = searchParams.get('maxPrice')
  const businessType = searchParams.get('businessType')
  const duration = searchParams.get('duration')

  if (minPrice) filters.minPrice = Number(minPrice)
  if (maxPrice) filters.maxPrice = Number(maxPrice)
  if (businessType) filters.businessType = businessType as BusinessType
  if (duration) filters.duration = Number(duration)

  return filters
}

export function buildListingWhere(filters: ListingFilters): Prisma.ListingWhereInput {
  const where: Prisma.ListingWhereInput = { status: 'OPEN' }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.monthlyRent = {
      ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
      ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
    }
  }
  if (filters.businessType) {
    where.businessTypes = { has: filters.businessType }
  }
  if (filters.duration !== undefined) {
    where.contractDurations = { has: filters.duration }
  }

  return where
}
```

- [ ] **Step 4: API 라우트 실패 테스트 작성**

`tests/unit/api/listings.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: { listing: { findMany: vi.fn() } },
}))

import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/listings/route'

describe('GET /api/listings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns listings from prisma as JSON', async () => {
    vi.mocked(prisma.listing.findMany).mockResolvedValue([
      { id: 'l1', address: 'A', monthlyRent: 500000, businessTypes: ['CAFE'], status: 'OPEN', photos: [] },
    ] as never)

    const res = await GET(new Request('http://localhost/api/listings?businessType=CAFE'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0].address).toBe('A')
  })
})
```

- [ ] **Step 5: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/listings.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 6: 구현**

`src/app/api/listings/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseListingFilters, buildListingWhere } from '@/lib/listingFilters'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const filters = parseListingFilters(searchParams)
  const where = buildListingWhere(filters)

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      address: true,
      monthlyRent: true,
      businessTypes: true,
      status: true,
      photos: true,
    },
  })

  return NextResponse.json(listings)
}
```

- [ ] **Step 7: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/lib/listingFilters.test.ts tests/unit/api/listings.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 8: Commit**

```bash
git add src/lib/listingFilters.ts src/app/api/listings/route.ts tests/unit/lib/listingFilters.test.ts tests/unit/api/listings.test.ts
git commit -m "feat: add listing search API with price/business-type/duration filters"
```

---

### Task 7: 홈/검색 화면 + 추천 위젯

**Files:**
- Create: `src/components/FilterBar.tsx`
- Create: `src/components/RecommendWidget.tsx`
- Create: `src/app/tenant/page.tsx`
- Test: `tests/unit/components/FilterBar.test.tsx`
- Test: `tests/unit/components/RecommendWidget.test.tsx`

**Interfaces:**
- Consumes: `GET /api/listings`(Task 6), `ListingCard`(Task 5)
- Produces: `<FilterBar value={filters} onChange={(next) => void} />`, `<RecommendWidget onComplete={(filters) => void} onSkip={() => void} />`

- [ ] **Step 1: FilterBar 실패 테스트 작성**

`tests/unit/components/FilterBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterBar } from '@/components/FilterBar'

describe('FilterBar', () => {
  it('calls onChange with the selected business type', async () => {
    const onChange = vi.fn()
    render(<FilterBar value={{}} onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '카페' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ businessType: 'CAFE' }))
  })
})
```

- [ ] **Step 2: RecommendWidget 실패 테스트 작성**

`tests/unit/components/RecommendWidget.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecommendWidget } from '@/components/RecommendWidget'

describe('RecommendWidget', () => {
  it('walks through 3 steps and calls onComplete with combined answers', async () => {
    const onComplete = vi.fn()
    render(<RecommendWidget onComplete={onComplete} onSkip={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: '~500,000원' }))
    await userEvent.click(screen.getByRole('button', { name: '카페' }))
    await userEvent.click(screen.getByRole('button', { name: '즉시' }))

    expect(onComplete).toHaveBeenCalledWith({ maxPrice: 500000, businessType: 'CAFE' })
  })

  it('calls onSkip when skip button is clicked', async () => {
    const onSkip = vi.fn()
    render(<RecommendWidget onComplete={vi.fn()} onSkip={onSkip} />)
    await userEvent.click(screen.getByRole('button', { name: '건너뛰기' }))
    expect(onSkip).toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/components/FilterBar.test.tsx tests/unit/components/RecommendWidget.test.tsx`
Expected: FAIL (모듈 없음)

- [ ] **Step 4: FilterBar 구현**

`src/components/FilterBar.tsx`:

```tsx
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'

export type Filters = {
  minPrice?: number
  maxPrice?: number
  businessType?: BusinessType
  duration?: number
}

const BUSINESS_TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OTHER']
const DURATIONS = [2, 4, 6]

export function FilterBar({ value, onChange }: { value: Filters; onChange: (next: Filters) => void }) {
  return (
    <div className="flex flex-wrap gap-4 border-b p-4">
      <div>
        <p className="mb-1 text-sm text-gray-500">가격대</p>
        <div className="flex gap-1">
          {[500000, 1000000, 2000000].map((p) => (
            <button
              key={p}
              type="button"
              className={`rounded border px-2 py-1 text-sm ${value.maxPrice === p ? 'bg-black text-white' : ''}`}
              onClick={() => onChange({ ...value, maxPrice: p })}
            >
              ~{p.toLocaleString()}원
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-sm text-gray-500">업종</p>
        <div className="flex gap-1">
          {BUSINESS_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded border px-2 py-1 text-sm ${value.businessType === t ? 'bg-black text-white' : ''}`}
              onClick={() => onChange({ ...value, businessType: t })}
            >
              {businessTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-sm text-gray-500">계약기간</p>
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              className={`rounded border px-2 py-1 text-sm ${value.duration === d ? 'bg-black text-white' : ''}`}
              onClick={() => onChange({ ...value, duration: d })}
            >
              {d}개월
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: RecommendWidget 구현**

`src/components/RecommendWidget.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'
import { Filters } from '@/components/FilterBar'

const BUDGETS = [{ label: '~500,000원', maxPrice: 500000 }, { label: '~1,000,000원', maxPrice: 1000000 }]
const BUSINESS_TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OTHER']
const TIMINGS = ['즉시', '1개월 내', '미정']

export function RecommendWidget({
  onComplete,
  onSkip,
}: {
  onComplete: (filters: Filters) => void
  onSkip: () => void
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [answers, setAnswers] = useState<Filters>({})

  return (
    <div className="rounded border p-4">
      <div className="mb-2 flex justify-between">
        <p className="font-medium">추천 위젯 ({step}/3)</p>
        <button type="button" className="text-sm text-gray-500" onClick={onSkip}>
          건너뛰기
        </button>
      </div>

      {step === 1 && (
        <div className="flex gap-2">
          {BUDGETS.map((b) => (
            <button
              key={b.label}
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => {
                setAnswers({ ...answers, maxPrice: b.maxPrice })
                setStep(2)
              }}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex gap-2">
          {BUSINESS_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => {
                setAnswers({ ...answers, businessType: t })
                setStep(3)
              }}
            >
              {businessTypeLabel(t)}
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="flex gap-2">
          {TIMINGS.map((label) => (
            <button
              key={label}
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => onComplete(answers)}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/components/FilterBar.test.tsx tests/unit/components/RecommendWidget.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 7: 홈/검색 화면 작성**

`src/app/tenant/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { FilterBar, Filters } from '@/components/FilterBar'
import { RecommendWidget } from '@/components/RecommendWidget'
import { ListingCard, ListingCardData } from '@/components/ListingCard'

function buildQuery(filters: Filters) {
  const params = new URLSearchParams()
  if (filters.minPrice) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice) params.set('maxPrice', String(filters.maxPrice))
  if (filters.businessType) params.set('businessType', filters.businessType)
  if (filters.duration) params.set('duration', String(filters.duration))
  return params.toString()
}

export default function TenantHomePage() {
  const [filters, setFilters] = useState<Filters>({})
  const [showWidget, setShowWidget] = useState(true)
  const [listings, setListings] = useState<ListingCardData[]>([])

  useEffect(() => {
    fetch(`/api/listings?${buildQuery(filters)}`)
      .then((res) => res.json())
      .then(setListings)
  }, [filters])

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-bold">가볍게 시작하는 창업, 공실을 찾아보세요</h1>
      {showWidget && (
        <div className="mb-4">
          <RecommendWidget
            onComplete={(answers) => {
              setFilters(answers)
              setShowWidget(false)
            }}
            onSkip={() => setShowWidget(false)}
          />
        </div>
      )}
      <FilterBar value={filters} onChange={setFilters} />
      {listings.length === 0 ? (
        <p className="mt-8 text-center text-gray-500">조건에 맞는 공실이 없어요. 필터를 완화해보세요.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/components/FilterBar.tsx src/components/RecommendWidget.tsx src/app/tenant/page.tsx tests/unit/components/FilterBar.test.tsx tests/unit/components/RecommendWidget.test.tsx
git commit -m "feat: add tenant home/search screen with filter bar and recommend widget"
```

---

### Task 8: 공실 상세 API + 상세 페이지(장비 패키지 인라인)

**Files:**
- Create: `src/app/api/listings/[id]/route.ts`
- Create: `src/app/tenant/listings/[id]/page.tsx`
- Test: `tests/unit/api/listingDetail.test.ts`

**Interfaces:**
- Produces: `GET /api/listings/:id` → 공실 상세 + 연결된 `EquipmentPackage[]`(businessTypes에 해당하는 패키지들), 404 시 존재하지 않음

- [ ] **Step 1: 실패 테스트 작성**

`tests/unit/api/listingDetail.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    listing: { findUnique: vi.fn() },
    equipmentPackage: { findMany: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/listings/[id]/route'

describe('GET /api/listings/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 404 when listing does not exist', async () => {
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/listings/x'), { params: { id: 'x' } })
    expect(res.status).toBe(404)
  })

  it('returns listing with matching equipment packages', async () => {
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({
      id: 'l1', address: 'A', businessTypes: ['CAFE'], monthlyRent: 500000, deposit: 1000000,
      area: 20, photos: [], contractDurations: [2, 4], status: 'OPEN', createdAt: new Date(),
    } as never)
    vi.mocked(prisma.equipmentPackage.findMany).mockResolvedValue([
      { id: 'p1', businessType: 'CAFE', name: '카페 스타터 패키지', items: ['에스프레소 머신'], monthlyFee: 100000 },
    ] as never)

    const res = await GET(new Request('http://localhost/api/listings/l1'), { params: { id: 'l1' } })
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.address).toBe('A')
    expect(json.equipmentPackages).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/listingDetail.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/app/api/listings/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({ where: { id: params.id } })
  if (!listing) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const equipmentPackages = await prisma.equipmentPackage.findMany({
    where: { businessType: { in: listing.businessTypes } },
  })

  return NextResponse.json({ ...listing, equipmentPackages })
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/api/listingDetail.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 상세 페이지 작성**

`src/app/tenant/listings/[id]/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BusinessType, ListingStatus } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'
import { StatusBadge } from '@/components/StatusBadge'

type ListingDetail = {
  id: string
  address: string
  area: number
  monthlyRent: number
  deposit: number
  photos: string[]
  contractDurations: number[]
  businessTypes: BusinessType[]
  status: ListingStatus
  equipmentPackages: { id: string; name: string; items: string[]; monthlyFee: number }[]
}

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<ListingDetail | null>(null)

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((res) => res.json())
      .then(setListing)
  }, [params.id])

  if (!listing) return <p className="p-4">불러오는 중...</p>

  return (
    <main className="mx-auto max-w-3xl p-4 pb-24">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{listing.address}</h1>
        <StatusBadge kind="listing" status={listing.status} />
      </div>
      <p>면적 {listing.area}㎡ · 월 {listing.monthlyRent.toLocaleString()}원 · 보증금 {listing.deposit.toLocaleString()}원</p>
      <p className="mt-1 text-sm text-gray-600">
        계약 가능 기간: {listing.contractDurations.map((d) => `${d}개월`).join(', ')}
      </p>

      <section className="mt-6">
        <h2 className="mb-2 font-semibold">업종별 장비 패키지</h2>
        {listing.equipmentPackages.length === 0 ? (
          <p className="text-sm text-gray-500">이 업종은 장비 패키지 준비 중, 공실만 임대 가능합니다.</p>
        ) : (
          listing.equipmentPackages.map((pkg) => (
            <div key={pkg.id} className="mb-2 rounded border p-3">
              <p className="font-medium">{pkg.name}</p>
              <p className="text-sm text-gray-600">{pkg.items.join(', ')}</p>
              <p className="text-sm">월 {pkg.monthlyFee.toLocaleString()}원</p>
            </div>
          ))
        )}
      </section>

      <div className="mt-2 flex flex-wrap gap-1">
        {listing.businessTypes.map((t) => (
          <span key={t} className="rounded bg-gray-100 px-2 py-0.5 text-xs">
            {businessTypeLabel(t)}
          </span>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
        {listing.status === 'CLOSED' ? (
          <button className="w-full rounded bg-gray-300 p-3 text-gray-600" disabled>
            마감된 공실입니다
          </button>
        ) : (
          <Link
            href={`/tenant/listings/${listing.id}/apply`}
            className="block w-full rounded bg-black p-3 text-center text-white"
          >
            신청하기
          </Link>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/listings/\[id\] src/app/tenant/listings tests/unit/api/listingDetail.test.ts
git commit -m "feat: add listing detail API and page with inline equipment packages"
```

---

### Task 9: 신청 생성 API + 신청 폼 화면

**Files:**
- Create: `src/app/api/applications/route.ts`
- Create: `src/app/tenant/listings/[id]/apply/page.tsx`
- Test: `tests/unit/api/applications.post.test.ts`

**Interfaces:**
- Consumes: `authOptions`(Task 3), `prisma`(Task 2)
- Produces: `POST /api/applications` — body `{ listingId, applicantName, phone, desiredDuration, desiredStartDate, message? }`, 비로그인 401, 이미 신청한 공실 409, 성공 시 201

- [ ] **Step 1: 실패 테스트 작성**

`tests/unit/api/applications.post.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { application: { findFirst: vi.fn(), create: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/applications/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/applications', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/applications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not logged in', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await POST(makeRequest({ listingId: 'l1' }))
    expect(res.status).toBe(401)
  })

  it('returns 409 when tenant already applied to this listing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.application.findFirst).mockResolvedValue({ id: 'existing' } as never)

    const res = await POST(
      makeRequest({ listingId: 'l1', applicantName: 'A', phone: '010', desiredDuration: 2, desiredStartDate: '2026-10-01' })
    )
    expect(res.status).toBe(409)
  })

  it('creates application and returns 201', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.application.findFirst).mockResolvedValue(null)
    vi.mocked(prisma.application.create).mockResolvedValue({ id: 'a1', status: 'PENDING' } as never)

    const res = await POST(
      makeRequest({ listingId: 'l1', applicantName: 'A', phone: '010', desiredDuration: 2, desiredStartDate: '2026-10-01' })
    )
    expect(res.status).toBe(201)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/applications.post.test.ts`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: 구현**

`src/app/api/applications/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { listingId, applicantName, phone, desiredDuration, desiredStartDate, message } = body as {
    listingId: string
    applicantName: string
    phone: string
    desiredDuration: number
    desiredStartDate: string
    message?: string
  }

  const existing = await prisma.application.findFirst({
    where: { listingId, tenantId: session.user.id },
  })
  if (existing) {
    return NextResponse.json({ error: 'already applied' }, { status: 409 })
  }

  const application = await prisma.application.create({
    data: {
      listingId,
      tenantId: session.user.id,
      applicantName,
      phone,
      desiredDuration,
      desiredStartDate: new Date(desiredStartDate),
      message,
    },
  })

  return NextResponse.json(application, { status: 201 })
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/api/applications.post.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 신청 폼 화면 작성 (비로그인 시 로그인으로 유도)**

`src/app/tenant/listings/[id]/apply/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function ApplyPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [form, setForm] = useState({ applicantName: '', phone: '', desiredDuration: 2, desiredStartDate: '', message: '' })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (status === 'loading') return <p className="p-4">불러오는 중...</p>

  if (status === 'unauthenticated') {
    router.push(`/login?callbackUrl=/tenant/listings/${params.id}/apply`)
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId: params.id, ...form }),
    })
    if (res.status === 409) {
      setError('이미 이 공실에 신청하셨습니다.')
      return
    }
    if (!res.ok) {
      setError('신청 처리 중 문제가 발생했습니다.')
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <main className="mx-auto max-w-md p-4 text-center">
        <p className="mb-4">운영팀이 확인 후 24~48시간 내 연락드립니다.</p>
        <a href="/tenant/my/applications" className="underline">
          신청 현황 보러가기
        </a>
      </main>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-md space-y-3 p-4">
      <h1 className="text-xl font-bold">신청/상담 요청</h1>
      <input
        className="w-full rounded border p-2"
        placeholder="이름"
        value={form.applicantName}
        onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        placeholder="연락처"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <select
        className="w-full rounded border p-2"
        value={form.desiredDuration}
        onChange={(e) => setForm({ ...form, desiredDuration: Number(e.target.value) })}
      >
        <option value={2}>2개월</option>
        <option value={4}>4개월</option>
        <option value={6}>6개월</option>
      </select>
      <input
        className="w-full rounded border p-2"
        type="date"
        value={form.desiredStartDate}
        onChange={(e) => setForm({ ...form, desiredStartDate: e.target.value })}
      />
      <textarea
        className="w-full rounded border p-2"
        placeholder="요청 메시지 (선택)"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded bg-black p-2 text-white" type="submit">
        신청하기
      </button>
    </form>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/applications/route.ts src/app/tenant/listings/\[id\]/apply tests/unit/api/applications.post.test.ts
git commit -m "feat: add application creation API and request form"
```

---

### Task 10: 내 신청 현황 API + 마이페이지 화면

**Files:**
- Modify: `src/app/api/applications/route.ts` (GET 추가)
- Create: `src/app/tenant/my/applications/page.tsx`
- Test: `tests/unit/api/applications.get.test.ts`

**Interfaces:**
- Produces: `GET /api/applications` — 세션 role에 따라 결과 분기(TENANT: 본인 신청만, LANDLORD: 소유 공실의 신청만, ADMIN: 전체), 비로그인 401

- [ ] **Step 1: 실패 테스트 작성**

`tests/unit/api/applications.get.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { application: { findMany: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/applications/route'

describe('GET /api/applications', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 401 when not logged in', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/applications'))
    expect(res.status).toBe(401)
  })

  it('filters by tenantId for TENANT role', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.application.findMany).mockResolvedValue([])

    await GET(new Request('http://localhost/api/applications'))
    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 't1' } })
    )
  })

  it('filters by listing.landlordId for LANDLORD role', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.application.findMany).mockResolvedValue([])

    await GET(new Request('http://localhost/api/applications'))
    expect(prisma.application.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { listing: { landlordId: 'lord1' } } })
    )
  })

  it('returns all applications for ADMIN role', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'admin1', role: 'ADMIN' } } as never)
    vi.mocked(prisma.application.findMany).mockResolvedValue([])

    await GET(new Request('http://localhost/api/applications'))
    expect(prisma.application.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }))
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/applications.get.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현 (기존 파일에 GET 추가)**

`src/app/api/applications/route.ts`에 추가:

```typescript
import { Prisma } from '@prisma/client'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')

  let where: Prisma.ApplicationWhereInput = {}
  if (session.user.role === 'TENANT') {
    where = { tenantId: session.user.id }
  } else if (session.user.role === 'LANDLORD') {
    where = { listing: { landlordId: session.user.id } }
  }
  if (statusFilter) {
    where = { ...where, status: statusFilter as never }
  }

  const applications = await prisma.application.findMany({
    where,
    include: { listing: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(applications)
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/api/applications.get.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 5: 마이페이지 화면 작성**

`src/app/tenant/my/applications/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ApplicationStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'

type ApplicationRow = {
  id: string
  status: ApplicationStatus
  createdAt: string
  listing: { id: string; address: string; photos: string[] }
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([])

  useEffect(() => {
    fetch('/api/applications')
      .then((res) => res.json())
      .then(setApplications)
  }, [])

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-bold">신청 현황</h1>
      {applications.length === 0 ? (
        <p className="text-gray-500">아직 신청한 공실이 없어요.</p>
      ) : (
        <ul className="space-y-2">
          {applications.map((app) => (
            <li key={app.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <p className="font-medium">{app.listing.address}</p>
                <p className="text-sm text-gray-500">{new Date(app.createdAt).toLocaleDateString()}</p>
              </div>
              <StatusBadge kind="application" status={app.status} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/applications/route.ts src/app/tenant/my/applications tests/unit/api/applications.get.test.ts
git commit -m "feat: add role-scoped application listing API and tenant status page"
```

---

### Task 11: 찜(관심 목록) 기능

**Files:**
- Create: `src/app/api/favorites/route.ts`
- Create: `src/app/tenant/my/favorites/page.tsx`
- Test: `tests/unit/api/favorites.test.ts`

**Interfaces:**
- Produces: `POST /api/favorites` — body `{ listingId }`, 이미 찜한 경우 삭제(toggle), 성공 시 `{ favorited: boolean }`. `GET /api/favorites` — 로그인한 창업자의 찜 목록(Listing 포함)

- [ ] **Step 1: 실패 테스트 작성**

`tests/unit/api/favorites.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    favorite: { findUnique: vi.fn(), create: vi.fn(), delete: vi.fn(), findMany: vi.fn() },
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { POST, GET } from '@/app/api/favorites/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/favorites', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/favorites (toggle)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('creates a favorite when none exists and returns favorited: true', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.favorite.create).mockResolvedValue({ id: 'f1' } as never)

    const res = await POST(makeRequest({ listingId: 'l1' }))
    const json = await res.json()
    expect(json).toEqual({ favorited: true })
  })

  it('deletes an existing favorite and returns favorited: false', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.favorite.findUnique).mockResolvedValue({ id: 'f1' } as never)
    vi.mocked(prisma.favorite.delete).mockResolvedValue({ id: 'f1' } as never)

    const res = await POST(makeRequest({ listingId: 'l1' }))
    const json = await res.json()
    expect(json).toEqual({ favorited: false })
  })
})

describe('GET /api/favorites', () => {
  it('returns favorites with listing data for the logged-in tenant', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    vi.mocked(prisma.favorite.findMany).mockResolvedValue([{ id: 'f1', listing: { id: 'l1' } }] as never)

    const res = await GET()
    const json = await res.json()
    expect(json).toHaveLength(1)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/favorites.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

`src/app/api/favorites/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { listingId } = (await request.json()) as { listingId: string }
  const tenantId = session.user.id

  const existing = await prisma.favorite.findUnique({
    where: { tenantId_listingId: { tenantId, listingId } },
  })

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } })
    return NextResponse.json({ favorited: false })
  }

  await prisma.favorite.create({ data: { tenantId, listingId } })
  return NextResponse.json({ favorited: true })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const favorites = await prisma.favorite.findMany({
    where: { tenantId: session.user.id },
    include: { listing: true },
  })

  return NextResponse.json(favorites)
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/api/favorites.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: 관심 목록 화면 작성**

`src/app/tenant/my/favorites/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ListingCard, ListingCardData } from '@/components/ListingCard'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<{ id: string; listing: ListingCardData }[]>([])

  useEffect(() => {
    fetch('/api/favorites')
      .then((res) => res.json())
      .then(setFavorites)
  }, [])

  return (
    <main className="mx-auto max-w-4xl p-4">
      <h1 className="mb-4 text-xl font-bold">관심 목록</h1>
      {favorites.length === 0 ? (
        <p className="text-gray-500">찜한 공실이 없어요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {favorites.map((f) => (
            <ListingCard key={f.id} listing={f.listing} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/favorites src/app/tenant/my/favorites tests/unit/api/favorites.test.ts
git commit -m "feat: add favorite toggle API and favorites page"
```

---

## Phase 2: 건물주(Landlord) 화면

### Task 12: 내 공실 대시보드 API + 화면

**Files:**
- Create: `src/app/api/landlord/listings/route.ts`
- Create: `src/app/landlord/page.tsx`
- Test: `tests/unit/api/landlordListings.test.ts`

**Interfaces:**
- Produces: `GET /api/landlord/listings` — 로그인한 건물주 소유 공실 + 각 공실의 신청 건수(`_count.applications`), LANDLORD가 아니면 403

- [ ] **Step 1: 실패 테스트 작성**

`tests/unit/api/landlordListings.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { listing: { findMany: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/landlord/listings/route'

describe('GET /api/landlord/listings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when caller is not a landlord', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    const res = await GET()
    expect(res.status).toBe(403)
  })

  it('returns only listings owned by the logged-in landlord with application counts', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.findMany).mockResolvedValue([
      { id: 'l1', address: 'A', _count: { applications: 3 } },
    ] as never)

    const res = await GET()
    expect(prisma.listing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { landlordId: 'lord1' } })
    )
    const json = await res.json()
    expect(json[0]._count.applications).toBe(3)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/landlordListings.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

`src/app/api/landlord/listings/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const listings = await prisma.listing.findMany({
    where: { landlordId: session.user.id },
    include: { _count: { select: { applications: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(listings)
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/api/landlordListings.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: 대시보드 화면 작성**

`src/app/landlord/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BusinessType, ListingStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'

type LandlordListing = {
  id: string
  address: string
  monthlyRent: number
  status: ListingStatus
  businessTypes: BusinessType[]
  _count: { applications: number }
}

export default function LandlordDashboardPage() {
  const [listings, setListings] = useState<LandlordListing[]>([])

  useEffect(() => {
    fetch('/api/landlord/listings')
      .then((res) => res.json())
      .then(setListings)
  }, [])

  return (
    <main className="mx-auto max-w-4xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">내 공실 대시보드</h1>
        <Link href="/landlord/listings/new" className="rounded bg-black px-3 py-2 text-white">
          + 새 공실 등록
        </Link>
      </div>
      {listings.length === 0 ? (
        <p className="text-gray-500">첫 공실을 등록해보세요.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <Link key={listing.id} href={`/landlord/listings/${listing.id}`} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{listing.address}</p>
                <StatusBadge kind="listing" status={listing.status} />
              </div>
              <p className="text-sm text-gray-600">월 {listing.monthlyRent.toLocaleString()}원</p>
              <p className="mt-1 text-sm">신청 {listing._count.applications}건</p>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/api/landlord/listings src/app/landlord/page.tsx tests/unit/api/landlordListings.test.ts
git commit -m "feat: add landlord dashboard API and screen"
```

---

### Task 13: 공실 등록/수정 API + 폼 화면 (사진 업로드, 장비 패키지 선택)

**Files:**
- Create: `src/app/api/upload/route.ts`
- Create: `src/app/landlord/listings/new/page.tsx`
- Create: `src/app/landlord/listings/[id]/edit/page.tsx`
- Create: `src/components/ListingForm.tsx`
- Modify: `src/app/api/listings/route.ts` (POST 추가)
- Modify: `src/app/api/listings/[id]/route.ts` (PATCH 추가)
- Test: `tests/unit/api/listings.post.test.ts`
- Test: `tests/unit/api/listings.patch.test.ts`

**Interfaces:**
- Produces:
  - `POST /api/listings` — LANDLORD만, body `{ address, area, monthlyRent, deposit, photos, contractDurations, businessTypes }` → 201
  - `PATCH /api/listings/:id` — 소유자 LANDLORD만, 부분 수정 가능, 소유자가 아니면 403
  - `POST /api/upload` — multipart 파일을 받아 `/public/uploads`에 저장하고 `{ url }` 반환
  - `<ListingForm initial={...} onSubmit={(data) => void} />` 등록/수정 공용 폼

- [ ] **Step 1: POST 실패 테스트 작성**

`tests/unit/api/listings.post.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { listing: { findMany: vi.fn(), create: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/listings/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/listings', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('POST /api/listings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when caller is not a landlord', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    const res = await POST(makeRequest({ address: 'A' }))
    expect(res.status).toBe(403)
  })

  it('creates a listing owned by the logged-in landlord', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.create).mockResolvedValue({ id: 'l1' } as never)

    const res = await POST(
      makeRequest({
        address: 'A', area: 20, monthlyRent: 500000, deposit: 1000000,
        photos: ['/uploads/a.jpg'], contractDurations: [2, 4], businessTypes: ['CAFE'],
      })
    )
    expect(res.status).toBe(201)
    expect(prisma.listing.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ landlordId: 'lord1' }) })
    )
  })
})
```

- [ ] **Step 2: PATCH 실패 테스트 작성**

`tests/unit/api/listings.patch.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))
vi.mock('@/lib/prisma', () => ({
  prisma: { listing: { findUnique: vi.fn(), update: vi.fn() } },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { PATCH } from '@/app/api/listings/[id]/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/listings/l1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('PATCH /api/listings/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when caller does not own the listing', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord2', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({ id: 'l1', landlordId: 'lord1' } as never)

    const res = await PATCH(makeRequest({ monthlyRent: 600000 }), { params: { id: 'l1' } })
    expect(res.status).toBe(403)
  })

  it('updates listing when caller owns it', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'lord1', role: 'LANDLORD' } } as never)
    vi.mocked(prisma.listing.findUnique).mockResolvedValue({ id: 'l1', landlordId: 'lord1' } as never)
    vi.mocked(prisma.listing.update).mockResolvedValue({ id: 'l1', monthlyRent: 600000 } as never)

    const res = await PATCH(makeRequest({ monthlyRent: 600000 }), { params: { id: 'l1' } })
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 3: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/listings.post.test.ts tests/unit/api/listings.patch.test.ts`
Expected: FAIL

- [ ] **Step 4: 구현 — listings POST 추가**

`src/app/api/listings/route.ts`에 추가:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const listing = await prisma.listing.create({
    data: { ...body, landlordId: session.user.id },
  })

  return NextResponse.json(listing, { status: 201 })
}
```

- [ ] **Step 5: 구현 — listings/[id] PATCH 추가**

`src/app/api/listings/[id]/route.ts`에 추가:

```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'LANDLORD') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const listing = await prisma.listing.findUnique({ where: { id: params.id } })
  if (!listing || listing.landlordId !== session.user.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const updated = await prisma.listing.update({ where: { id: params.id }, data: body })

  return NextResponse.json(updated)
}
```

- [ ] **Step 6: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/api/listings.post.test.ts tests/unit/api/listings.patch.test.ts`
Expected: PASS (4 tests)

- [ ] **Step 7: 사진 업로드 API 작성**

`src/app/api/upload/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'no file' }, { status: 400 })
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
```

- [ ] **Step 8: 등록/수정 공용 폼 컴포넌트 작성**

`src/components/ListingForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'

export type ListingFormData = {
  address: string
  area: number
  monthlyRent: number
  deposit: number
  photos: string[]
  contractDurations: number[]
  businessTypes: BusinessType[]
}

const ALL_DURATIONS = [2, 4, 6]
const ALL_BUSINESS_TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OTHER']

export function ListingForm({
  initial,
  onSubmit,
}: {
  initial?: Partial<ListingFormData>
  onSubmit: (data: ListingFormData) => void
}) {
  const [form, setForm] = useState<ListingFormData>({
    address: initial?.address ?? '',
    area: initial?.area ?? 0,
    monthlyRent: initial?.monthlyRent ?? 0,
    deposit: initial?.deposit ?? 0,
    photos: initial?.photos ?? [],
    contractDurations: initial?.contractDurations ?? [],
    businessTypes: initial?.businessTypes ?? [],
  })

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const data = new FormData()
    data.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: data })
    const { url } = await res.json()
    setForm((f) => ({ ...f, photos: [...f.photos, url] }))
  }

  function toggleDuration(d: number) {
    setForm((f) => ({
      ...f,
      contractDurations: f.contractDurations.includes(d)
        ? f.contractDurations.filter((x) => x !== d)
        : [...f.contractDurations, d],
    }))
  }

  function toggleBusinessType(t: BusinessType) {
    setForm((f) => ({
      ...f,
      businessTypes: f.businessTypes.includes(t)
        ? f.businessTypes.filter((x) => x !== t)
        : [...f.businessTypes, t],
    }))
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
    >
      <input
        className="w-full rounded border p-2"
        placeholder="주소"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
      />
      <input
        className="w-full rounded border p-2"
        type="number"
        placeholder="면적(㎡)"
        value={form.area || ''}
        onChange={(e) => setForm({ ...form, area: Number(e.target.value) })}
      />
      <input
        className="w-full rounded border p-2"
        type="number"
        placeholder="월 임대료"
        value={form.monthlyRent || ''}
        onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
      />
      <input
        className="w-full rounded border p-2"
        type="number"
        placeholder="보증금"
        value={form.deposit || ''}
        onChange={(e) => setForm({ ...form, deposit: Number(e.target.value) })}
      />

      <div>
        <p className="mb-1 text-sm text-gray-500">사진</p>
        <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        <div className="mt-2 flex gap-2">
          {form.photos.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="공실 사진" className="h-16 w-16 rounded object-cover" />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-sm text-gray-500">계약 가능 기간</p>
        {ALL_DURATIONS.map((d) => (
          <label key={d} className="mr-3">
            <input type="checkbox" checked={form.contractDurations.includes(d)} onChange={() => toggleDuration(d)} />{' '}
            {d}개월
          </label>
        ))}
      </div>

      <div>
        <p className="mb-1 text-sm text-gray-500">가능한 업종 (선택 시 표준 장비 패키지가 함께 제공됩니다)</p>
        {ALL_BUSINESS_TYPES.map((t) => (
          <label key={t} className="mr-3">
            <input type="checkbox" checked={form.businessTypes.includes(t)} onChange={() => toggleBusinessType(t)} />{' '}
            {businessTypeLabel(t)}
          </label>
        ))}
      </div>

      <button className="w-full rounded bg-black p-2 text-white" type="submit">
        저장
      </button>
    </form>
  )
}
```

- [ ] **Step 9: 등록 페이지 작성**

`src/app/landlord/listings/new/page.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { ListingForm, ListingFormData } from '@/components/ListingForm'

export default function NewListingPage() {
  const router = useRouter()

  async function handleSubmit(data: ListingFormData) {
    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const listing = await res.json()
    router.push(`/landlord/listings/${listing.id}`)
  }

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-xl font-bold">공실 등록</h1>
      <ListingForm onSubmit={handleSubmit} />
    </main>
  )
}
```

- [ ] **Step 10: 수정 페이지 작성**

`src/app/landlord/listings/[id]/edit/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ListingForm, ListingFormData } from '@/components/ListingForm'

export default function EditListingPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [initial, setInitial] = useState<ListingFormData | null>(null)

  useEffect(() => {
    fetch(`/api/listings/${params.id}`)
      .then((res) => res.json())
      .then(setInitial)
  }, [params.id])

  async function handleSubmit(data: ListingFormData) {
    await fetch(`/api/listings/${params.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    router.push(`/landlord/listings/${params.id}`)
  }

  if (!initial) return <p className="p-4">불러오는 중...</p>

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-xl font-bold">공실 수정</h1>
      <ListingForm initial={initial} onSubmit={handleSubmit} />
    </main>
  )
}
```

- [ ] **Step 11: Commit**

```bash
git add src/app/api/upload src/app/api/listings src/app/landlord/listings src/components/ListingForm.tsx tests/unit/api/listings.post.test.ts tests/unit/api/listings.patch.test.ts
git commit -m "feat: add listing create/update APIs, photo upload, and listing form"
```

---

### Task 14: 공실 상세(건물주 뷰) + 공실별 신청 리스트

**Files:**
- Create: `src/app/landlord/listings/[id]/page.tsx`
- Create: `src/app/landlord/listings/[id]/applications/page.tsx`
- Test: `tests/unit/lib/applicationSummary.test.ts`
- Create: `src/lib/applicationSummary.ts`

**Interfaces:**
- Consumes: `GET /api/listings/:id`(Task 8), `GET /api/applications?listingId=`(확장, 아래 Step 참고)
- Produces: `summarizeRecentApplications(applications, limit): Application[]` — 최신순 상위 N개

- [ ] **Step 1: 요약 유틸 실패 테스트 작성**

`tests/unit/lib/applicationSummary.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { summarizeRecentApplications } from '@/lib/applicationSummary'

describe('summarizeRecentApplications', () => {
  it('returns at most `limit` items, most recent first', () => {
    const apps = [
      { id: '1', createdAt: '2026-01-01' },
      { id: '2', createdAt: '2026-01-03' },
      { id: '3', createdAt: '2026-01-02' },
    ]
    expect(summarizeRecentApplications(apps, 2).map((a) => a.id)).toEqual(['2', '3'])
  })

  it('returns empty array when given no applications', () => {
    expect(summarizeRecentApplications([], 3)).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/lib/applicationSummary.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

`src/lib/applicationSummary.ts`:

```typescript
export function summarizeRecentApplications<T extends { createdAt: string | Date }>(
  applications: T[],
  limit: number
): T[] {
  return [...applications]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/lib/applicationSummary.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: `GET /api/applications`에 listingId 필터 지원 추가**

`src/app/api/applications/route.ts`의 GET 함수 내 `where` 조립 부분을 다음과 같이 수정:

```typescript
  const listingId = searchParams.get('listingId')
  if (listingId) {
    where = { ...where, listingId }
  }
```
(`statusFilter` 처리 블록 바로 아래에 추가한다.)

- [ ] **Step 6: 공실 상세(건물주 뷰) 페이지 작성**

`src/app/landlord/listings/[id]/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ApplicationStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'
import { summarizeRecentApplications } from '@/lib/applicationSummary'

type Application = { id: string; applicantName: string; status: ApplicationStatus; createdAt: string }
type ListingDetail = { id: string; address: string; monthlyRent: number; status: 'OPEN' | 'CLOSED' }

export default function LandlordListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<ListingDetail | null>(null)
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    fetch(`/api/listings/${params.id}`).then((res) => res.json()).then(setListing)
    fetch(`/api/applications?listingId=${params.id}`).then((res) => res.json()).then(setApplications)
  }, [params.id])

  if (!listing) return <p className="p-4">불러오는 중...</p>

  const recent = summarizeRecentApplications(applications, 3)

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">{listing.address}</h1>
        <StatusBadge kind="listing" status={listing.status} />
      </div>
      <p className="mb-4">월 {listing.monthlyRent.toLocaleString()}원</p>
      <Link href={`/landlord/listings/${listing.id}/edit`} className="rounded border px-3 py-2">
        수정하기
      </Link>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold">최근 신청</h2>
          <Link href={`/landlord/listings/${listing.id}/applications`} className="text-sm underline">
            전체 신청 보기
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">아직 들어온 신청이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((app) => (
              <li key={app.id} className="flex items-center justify-between rounded border p-2">
                <span>{app.applicantName}</span>
                <StatusBadge kind="application" status={app.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
```

- [ ] **Step 7: 공실별 신청 리스트 페이지 작성**

`src/app/landlord/listings/[id]/applications/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ApplicationStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'

type Application = {
  id: string
  applicantName: string
  phone: string
  desiredDuration: number
  desiredStartDate: string
  message: string | null
  status: ApplicationStatus
  createdAt: string
}

export default function ListingApplicationsPage({ params }: { params: { id: string } }) {
  const [applications, setApplications] = useState<Application[]>([])

  useEffect(() => {
    fetch(`/api/applications?listingId=${params.id}`)
      .then((res) => res.json())
      .then(setApplications)
  }, [params.id])

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-bold">신청 리스트</h1>
      {applications.length === 0 ? (
        <p className="text-gray-500">아직 들어온 신청이 없어요.</p>
      ) : (
        <ul className="space-y-3">
          {applications.map((app) => (
            <li key={app.id} className="rounded border p-3">
              <div className="flex items-center justify-between">
                <p className="font-medium">{app.applicantName} ({app.phone})</p>
                <StatusBadge kind="application" status={app.status} />
              </div>
              <p className="text-sm text-gray-600">
                희망 계약기간 {app.desiredDuration}개월 · 희망 시작일 {new Date(app.desiredStartDate).toLocaleDateString()}
              </p>
              {app.message && <p className="mt-1 text-sm">{app.message}</p>}
              <p className="mt-1 text-xs text-gray-400">{new Date(app.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/app/landlord/listings/\[id\] src/lib/applicationSummary.ts src/app/api/applications/route.ts tests/unit/lib/applicationSummary.test.ts
git commit -m "feat: add landlord listing detail view and per-listing application list"
```

---

## Phase 3: 운영자(Admin) 화면

### Task 15: 관리자 권한 가드 유틸

**Files:**
- Create: `src/lib/requireAdmin.ts`
- Test: `tests/unit/lib/requireAdmin.test.ts`

**Interfaces:**
- Produces: `requireAdmin(): Promise<{ ok: true; session: Session } | { ok: false; response: NextResponse }>` — Task 16~17의 모든 관리자 API에서 재사용

- [ ] **Step 1: 실패 테스트 작성**

`tests/unit/lib/requireAdmin.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authOptions: {} }))

import { getServerSession } from 'next-auth'
import { requireAdmin } from '@/lib/requireAdmin'

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns ok: false with 401 when not logged in', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(401)
  })

  it('returns ok: false with 403 when logged in but not ADMIN', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 't1', role: 'TENANT' } } as never)
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(403)
  })

  it('returns ok: true with session when caller is ADMIN', async () => {
    const session = { user: { id: 'admin1', role: 'ADMIN' } }
    vi.mocked(getServerSession).mockResolvedValue(session as never)
    const result = await requireAdmin()
    expect(result).toEqual({ ok: true, session })
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/lib/requireAdmin.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

`src/lib/requireAdmin.ts`:

```typescript
import { NextResponse } from 'next/server'
import { getServerSession, Session } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function requireAdmin(): Promise<
  { ok: true; session: Session } | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions)
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  }
  if (session.user.role !== 'ADMIN') {
    return { ok: false, response: NextResponse.json({ error: 'forbidden' }, { status: 403 }) }
  }
  return { ok: true, session }
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/lib/requireAdmin.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/requireAdmin.ts tests/unit/lib/requireAdmin.test.ts
git commit -m "feat: add reusable admin authorization guard"
```

---

### Task 16: 신청 상태 변경 API (확정↔공실 마감 양방향 연동) + 전체 신청 관리 화면

**Files:**
- Create: `src/lib/applicationStatusTransition.ts`
- Create: `src/app/api/applications/[id]/route.ts`
- Create: `src/app/admin/page.tsx`
- Test: `tests/unit/lib/applicationStatusTransition.test.ts`
- Test: `tests/unit/api/applicationStatus.test.ts`

**Interfaces:**
- Produces:
  - `resolveListingStatusAfterTransition(newStatus: ApplicationStatus): 'OPEN' | 'CLOSED' | null` — CONFIRMED면 CLOSED, CONFIRMED에서 벗어나면 OPEN, 그 외 변화 없음(null)은 이 함수에서는 항상 값 반환하되 호출부에서 "이전 상태가 CONFIRMED였는지"와 조합해 실제 갱신 여부 결정
  - `PATCH /api/applications/:id` — ADMIN만, body `{ status }` → 신청 갱신 + 필요 시 연결된 Listing 상태 갱신

- [ ] **Step 1: 전이 로직 실패 테스트 작성**

`tests/unit/lib/applicationStatusTransition.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { computeListingStatusUpdate } from '@/lib/applicationStatusTransition'

describe('computeListingStatusUpdate', () => {
  it('returns CLOSED when transitioning into CONFIRMED', () => {
    expect(computeListingStatusUpdate('PENDING', 'CONFIRMED')).toBe('CLOSED')
  })

  it('returns OPEN when transitioning out of CONFIRMED', () => {
    expect(computeListingStatusUpdate('CONFIRMED', 'REJECTED')).toBe('OPEN')
    expect(computeListingStatusUpdate('CONFIRMED', 'PENDING')).toBe('OPEN')
  })

  it('returns null when the transition does not involve CONFIRMED', () => {
    expect(computeListingStatusUpdate('PENDING', 'CONTACTING')).toBeNull()
    expect(computeListingStatusUpdate('CONTACTING', 'REJECTED')).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/lib/applicationStatusTransition.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

`src/lib/applicationStatusTransition.ts`:

```typescript
import { ApplicationStatus, ListingStatus } from '@prisma/client'

export function computeListingStatusUpdate(
  previousStatus: ApplicationStatus,
  nextStatus: ApplicationStatus
): ListingStatus | null {
  if (previousStatus !== 'CONFIRMED' && nextStatus === 'CONFIRMED') {
    return 'CLOSED'
  }
  if (previousStatus === 'CONFIRMED' && nextStatus !== 'CONFIRMED') {
    return 'OPEN'
  }
  return null
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/lib/applicationStatusTransition.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: API 실패 테스트 작성**

`tests/unit/api/applicationStatus.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/requireAdmin', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    application: { findUnique: vi.fn(), update: vi.fn() },
    listing: { update: vi.fn() },
  },
}))

import { requireAdmin } from '@/lib/requireAdmin'
import { prisma } from '@/lib/prisma'
import { PATCH } from '@/app/api/applications/[id]/route'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/applications/a1', {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('PATCH /api/applications/:id', () => {
  beforeEach(() => vi.clearAllMocks())

  it('delegates to requireAdmin and returns its response when unauthorized', async () => {
    const forbiddenResponse = new Response(null, { status: 403 })
    vi.mocked(requireAdmin).mockResolvedValue({ ok: false, response: forbiddenResponse as never })

    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })
    expect(res.status).toBe(403)
  })

  it('updates application and closes the listing when confirming', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'PENDING', listingId: 'l1' } as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONFIRMED', listingId: 'l1' } as never)

    const res = await PATCH(makeRequest({ status: 'CONFIRMED' }), { params: { id: 'a1' } })
    expect(res.status).toBe(200)
    expect(prisma.listing.update).toHaveBeenCalledWith({ where: { id: 'l1' }, data: { status: 'CLOSED' } })
  })

  it('does not touch the listing when the transition does not involve CONFIRMED', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.application.findUnique).mockResolvedValue({ id: 'a1', status: 'PENDING', listingId: 'l1' } as never)
    vi.mocked(prisma.application.update).mockResolvedValue({ id: 'a1', status: 'CONTACTING', listingId: 'l1' } as never)

    await PATCH(makeRequest({ status: 'CONTACTING' }), { params: { id: 'a1' } })
    expect(prisma.listing.update).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 6: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/applicationStatus.test.ts`
Expected: FAIL

- [ ] **Step 7: 구현**

`src/app/api/applications/[id]/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/requireAdmin'
import { prisma } from '@/lib/prisma'
import { computeListingStatusUpdate } from '@/lib/applicationStatusTransition'
import { ApplicationStatus } from '@prisma/client'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { status } = (await request.json()) as { status: ApplicationStatus }

  const current = await prisma.application.findUnique({ where: { id: params.id } })
  if (!current) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: { status },
  })

  const listingStatusUpdate = computeListingStatusUpdate(current.status, status)
  if (listingStatusUpdate) {
    await prisma.listing.update({
      where: { id: current.listingId },
      data: { status: listingStatusUpdate },
    })
  }

  return NextResponse.json(updated)
}
```

- [ ] **Step 8: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/api/applicationStatus.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 9: 전체 신청 관리 화면 작성**

`src/app/admin/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ApplicationStatus } from '@prisma/client'
import { StatusBadge } from '@/components/StatusBadge'
import { applicationStatusLabel } from '@/lib/labels'

type ApplicationRow = {
  id: string
  applicantName: string
  phone: string
  desiredDuration: number
  desiredStartDate: string
  createdAt: string
  status: ApplicationStatus
  listing: { id: string; address: string }
}

const ALL_STATUSES: ApplicationStatus[] = ['PENDING', 'CONTACTING', 'CONFIRMED', 'REJECTED']

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationRow[]>([])
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | ''>('')

  useEffect(() => {
    const query = statusFilter ? `?status=${statusFilter}` : ''
    fetch(`/api/applications${query}`)
      .then((res) => res.json())
      .then(setApplications)
  }, [statusFilter])

  async function handleStatusChange(id: string, status: ApplicationStatus) {
    if (status === 'CONFIRMED') {
      const confirmed = window.confirm('이 공실이 자동으로 마감 처리됩니다. 계속할까요?')
      if (!confirmed) return
    }
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
  }

  return (
    <main className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-xl font-bold">전체 신청 관리</h1>
      <div className="mb-4">
        <select
          className="rounded border p-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | '')}
        >
          <option value="">전체 상태</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {applicationStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {applications.length === 0 ? (
        <p className="text-gray-500">조건에 맞는 신청이 없어요.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="p-2">신청자</th>
              <th className="p-2">연락처</th>
              <th className="p-2">공실</th>
              <th className="p-2">희망기간</th>
              <th className="p-2">신청일</th>
              <th className="p-2">상태</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b">
                <td className="p-2">{app.applicantName}</td>
                <td className="p-2">{app.phone}</td>
                <td className="p-2">{app.listing.address}</td>
                <td className="p-2">{app.desiredDuration}개월</td>
                <td className="p-2">{new Date(app.createdAt).toLocaleDateString()}</td>
                <td className="p-2">
                  <select
                    className="rounded border p-1"
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {applicationStatusLabel(s)}
                      </option>
                    ))}
                  </select>
                  <span className="ml-2">
                    <StatusBadge kind="application" status={app.status} />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
```

- [ ] **Step 10: Commit**

```bash
git add src/lib/applicationStatusTransition.ts src/app/api/applications/\[id\] src/app/admin/page.tsx tests/unit/lib/applicationStatusTransition.test.ts tests/unit/api/applicationStatus.test.ts
git commit -m "feat: add application status transition API with listing auto-close and admin table"
```

---

### Task 17: 장비 패키지 마스터 관리 API + 화면

**Files:**
- Create: `src/app/api/packages/route.ts`
- Create: `src/app/api/packages/[id]/route.ts`
- Create: `src/app/admin/packages/page.tsx`
- Test: `tests/unit/api/packages.test.ts`

**Interfaces:**
- Produces:
  - `GET /api/packages` — 전체(모든 역할 조회 가능, 창업자/건물주 화면도 이 API 재사용)
  - `POST /api/packages` — ADMIN만, body `{ businessType, name, items, monthlyFee }`, 이미 해당 업종 패키지 존재 시 409
  - `PATCH /api/packages/:id`, `DELETE /api/packages/:id` — ADMIN만

- [ ] **Step 1: 실패 테스트 작성**

`tests/unit/api/packages.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/requireAdmin', () => ({ requireAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    equipmentPackage: {
      findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    },
  },
}))

import { requireAdmin } from '@/lib/requireAdmin'
import { prisma } from '@/lib/prisma'
import { GET, POST } from '@/app/api/packages/route'
import { PATCH, DELETE } from '@/app/api/packages/[id]/route'

function makeRequest(method: string, body?: unknown) {
  return new Request('http://localhost/api/packages', {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('GET /api/packages', () => {
  it('returns all packages without requiring admin', async () => {
    vi.mocked(prisma.equipmentPackage.findMany).mockResolvedValue([{ id: 'p1' }] as never)
    const res = await GET()
    expect(res.status).toBe(200)
  })
})

describe('POST /api/packages', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns 403 when not admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) as never })
    const res = await POST(makeRequest('POST', { businessType: 'CAFE', name: 'X', items: [], monthlyFee: 1 }))
    expect(res.status).toBe(403)
  })

  it('returns 409 when a package for this business type already exists', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.findUnique).mockResolvedValue({ id: 'existing' } as never)
    const res = await POST(makeRequest('POST', { businessType: 'CAFE', name: 'X', items: [], monthlyFee: 1 }))
    expect(res.status).toBe(409)
  })

  it('creates package when admin and business type is free', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.findUnique).mockResolvedValue(null)
    vi.mocked(prisma.equipmentPackage.create).mockResolvedValue({ id: 'p1' } as never)
    const res = await POST(makeRequest('POST', { businessType: 'CAFE', name: 'X', items: ['a'], monthlyFee: 1 }))
    expect(res.status).toBe(201)
  })
})

describe('DELETE /api/packages/:id', () => {
  it('returns 403 when not admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: false, response: new Response(null, { status: 403 }) as never })
    const res = await DELETE(makeRequest('DELETE'), { params: { id: 'p1' } })
    expect(res.status).toBe(403)
  })

  it('deletes package when admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.delete).mockResolvedValue({ id: 'p1' } as never)
    const res = await DELETE(makeRequest('DELETE'), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
  })
})

describe('PATCH /api/packages/:id', () => {
  it('updates package when admin', async () => {
    vi.mocked(requireAdmin).mockResolvedValue({ ok: true, session: {} as never })
    vi.mocked(prisma.equipmentPackage.update).mockResolvedValue({ id: 'p1', name: 'Y' } as never)
    const res = await PATCH(makeRequest('PATCH', { name: 'Y' }), { params: { id: 'p1' } })
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm run test -- tests/unit/api/packages.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현 — `src/app/api/packages/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'
import { BusinessType } from '@prisma/client'

export async function GET() {
  const packages = await prisma.equipmentPackage.findMany()
  return NextResponse.json(packages)
}

export async function POST(request: Request) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await request.json()
  const { businessType, name, items, monthlyFee } = body as {
    businessType: BusinessType
    name: string
    items: string[]
    monthlyFee: number
  }

  const existing = await prisma.equipmentPackage.findUnique({ where: { businessType } })
  if (existing) {
    return NextResponse.json({ error: 'package already exists for this business type' }, { status: 409 })
  }

  const created = await prisma.equipmentPackage.create({
    data: { businessType, name, items, monthlyFee },
  })

  return NextResponse.json(created, { status: 201 })
}
```

- [ ] **Step 4: 구현 — `src/app/api/packages/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/requireAdmin'

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await request.json()
  const updated = await prisma.equipmentPackage.update({ where: { id: params.id }, data: body })
  return NextResponse.json(updated)
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  await prisma.equipmentPackage.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 5: 테스트 실행하여 통과 확인**

Run: `npm run test -- tests/unit/api/packages.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 6: 관리 화면 작성**

`src/app/admin/packages/page.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { BusinessType } from '@prisma/client'
import { businessTypeLabel } from '@/lib/labels'

type Package = { id: string; businessType: BusinessType; name: string; items: string[]; monthlyFee: number }

const ALL_BUSINESS_TYPES: BusinessType[] = ['CAFE', 'RETAIL', 'OTHER']

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [form, setForm] = useState({ businessType: 'CAFE' as BusinessType, name: '', itemsText: '', monthlyFee: 0 })
  const [error, setError] = useState<string | null>(null)

  function loadPackages() {
    fetch('/api/packages')
      .then((res) => res.json())
      .then(setPackages)
  }

  useEffect(loadPackages, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessType: form.businessType,
        name: form.name,
        items: form.itemsText.split(',').map((s) => s.trim()).filter(Boolean),
        monthlyFee: form.monthlyFee,
      }),
    })
    if (res.status === 409) {
      setError('이 업종에는 이미 패키지가 등록되어 있습니다.')
      return
    }
    setForm({ businessType: 'CAFE', name: '', itemsText: '', monthlyFee: 0 })
    loadPackages()
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('이 패키지를 사용 중인 공실이 있을 수 있습니다. 삭제할까요?')
    if (!confirmed) return
    await fetch(`/api/packages/${id}`, { method: 'DELETE' })
    loadPackages()
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-bold">장비 패키지 마스터 관리</h1>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2 rounded border p-3">
        <select
          className="w-full rounded border p-2"
          value={form.businessType}
          onChange={(e) => setForm({ ...form, businessType: e.target.value as BusinessType })}
        >
          {ALL_BUSINESS_TYPES.map((t) => (
            <option key={t} value={t}>
              {businessTypeLabel(t)}
            </option>
          ))}
        </select>
        <input
          className="w-full rounded border p-2"
          placeholder="패키지명"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="w-full rounded border p-2"
          placeholder="포함 장비 (쉼표로 구분)"
          value={form.itemsText}
          onChange={(e) => setForm({ ...form, itemsText: e.target.value })}
        />
        <input
          className="w-full rounded border p-2"
          type="number"
          placeholder="월 렌탈료"
          value={form.monthlyFee || ''}
          onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-black p-2 text-white" type="submit">
          등록
        </button>
      </form>

      <ul className="space-y-2">
        {packages.map((pkg) => (
          <li key={pkg.id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                [{businessTypeLabel(pkg.businessType)}] {pkg.name}
              </p>
              <button className="text-sm text-red-600" onClick={() => handleDelete(pkg.id)}>
                삭제
              </button>
            </div>
            <p className="text-sm text-gray-600">{pkg.items.join(', ')}</p>
            <p className="text-sm">월 {pkg.monthlyFee.toLocaleString()}원</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/api/packages src/app/admin/packages tests/unit/api/packages.test.ts
git commit -m "feat: add equipment package master CRUD API and admin management screen"
```

---

### Task 18: 핵심 플로우 E2E 테스트 (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/core-flow.spec.ts`
- Create: `tests/e2e/seed.ts`

**Interfaces:**
- Consumes: 전체 애플리케이션(개발 서버, 테스트 DB)
- Produces: "창업자 신청 → 운영자 확정 → 건물주 확인"까지 이어지는 단일 E2E 시나리오

- [ ] **Step 1: Playwright 설정 작성**

`playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 2: 시드 스크립트 작성 (테스트용 계정 및 데이터 생성)**

`tests/e2e/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const landlord = await prisma.user.upsert({
    where: { email: 'landlord@e2e.test' },
    update: {},
    create: { email: 'landlord@e2e.test', passwordHash, name: '건물주테스트', role: 'LANDLORD' },
  })

  const tenant = await prisma.user.upsert({
    where: { email: 'tenant@e2e.test' },
    update: {},
    create: { email: 'tenant@e2e.test', passwordHash, name: '창업자테스트', role: 'TENANT' },
  })

  await prisma.user.upsert({
    where: { email: 'admin@e2e.test' },
    update: {},
    create: { email: 'admin@e2e.test', passwordHash, name: '운영자테스트', role: 'ADMIN' },
  })

  await prisma.equipmentPackage.upsert({
    where: { businessType: 'CAFE' },
    update: {},
    create: { businessType: 'CAFE', name: '카페 스타터 패키지', items: ['에스프레소 머신', '냉장고'], monthlyFee: 100000 },
  })

  await prisma.listing.create({
    data: {
      landlordId: landlord.id,
      address: '서울시 마포구 연남동 E2E 테스트 공실',
      area: 20,
      monthlyRent: 500000,
      deposit: 1000000,
      photos: [],
      contractDurations: [2, 4],
      businessTypes: ['CAFE'],
      status: 'OPEN',
    },
  })

  console.log('seeded', { landlordId: landlord.id, tenantId: tenant.id })
}

main().finally(() => prisma.$disconnect())
```

- [ ] **Step 3: `package.json`에 시드 스크립트 등록**

```json
{
  "scripts": {
    "seed:e2e": "tsx tests/e2e/seed.ts"
  }
}
```

Run: `npm install -D tsx`

- [ ] **Step 4: E2E 시나리오 작성 (아직 미구현 상태이므로 실행 시 실패)**

`tests/e2e/core-flow.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login')
  await page.getByPlaceholder('이메일').fill(email)
  await page.getByPlaceholder('비밀번호').fill('password123')
  await page.getByRole('button', { name: '로그인' }).click()
}

test('tenant applies, admin confirms, landlord sees closed listing', async ({ page }) => {
  await login(page, 'tenant@e2e.test')
  await page.goto('/tenant')
  await page.getByText('서울시 마포구 연남동 E2E 테스트 공실').click()
  await page.getByRole('link', { name: '신청하기' }).click()

  await page.getByPlaceholder('이름').fill('창업자테스트')
  await page.getByPlaceholder('연락처').fill('010-1234-5678')
  await page.locator('input[type=date]').fill('2026-10-01')
  await page.getByRole('button', { name: '신청하기' }).click()
  await expect(page.getByText('운영팀이 확인 후')).toBeVisible()

  await page.goto('/api/auth/signout')
  await login(page, 'admin@e2e.test')
  await page.goto('/admin')
  await page.getByRole('combobox').last().selectOption('CONFIRMED')
  page.once('dialog', (dialog) => dialog.accept())
  await expect(page.getByText('확정')).toBeVisible()

  await page.goto('/api/auth/signout')
  await login(page, 'landlord@e2e.test')
  await page.goto('/landlord')
  await expect(page.getByText('마감')).toBeVisible()
})
```

- [ ] **Step 5: 데이터베이스 마이그레이션 및 시드 실행**

Run: `npx prisma migrate deploy`
Run: `npm run seed:e2e`

- [ ] **Step 6: E2E 테스트 실행하여 통과 확인**

Run: `npm run test:e2e`
Expected: PASS (1 test) — 창업자 신청부터 운영자 확정, 건물주 마감 확인까지 전체 플로우가 통과함

- [ ] **Step 7: Commit**

```bash
git add playwright.config.ts tests/e2e package.json
git commit -m "test: add core end-to-end flow covering tenant application, admin confirmation, and landlord view"
```

---

## Self-Review 결과

- **스펙 커버리지**: 창업자 스펙 8개 화면(§4.1~4.8) → Task 6~11에서 모두 구현. 건물주 스펙 5개 화면(§4.1~4.5) → Task 12~14. 운영자 스펙 4개 화면(§4.1~4.4) → Task 15~17. 확정↔마감 양방향 연동(운영자 스펙 §4.3) → Task 16의 `computeListingStatusUpdate`. 장비 패키지 준비중 안내(창업자 스펙 §5) → Task 8 상세 페이지에서 `equipmentPackages.length === 0` 분기 처리.
- **플레이스홀더 스캔**: TBD/TODO 없음. 모든 스텝에 실행 가능한 코드/명령 포함.
- **타입 일관성**: `ListingCardData`(Task 5) 필드가 Task 6 API 응답, Task 7 홈 화면에서 동일하게 사용됨. `computeListingStatusUpdate`(Task 16) 시그니처가 API 구현부와 테스트에서 일치. `requireAdmin`(Task 15)의 반환 타입이 Task 16, 17에서 동일하게 사용됨.
- **범위 확인**: 세 스펙에서 공통으로 제외했던 계약 연장/이동/철수, 온라인 결제, 알림 시스템, 통계 대시보드는 이 플랜에도 포함하지 않았음 — 각 스펙의 "제외 항목"과 일치.

## 다음 단계 (이 플랜 범위 밖)

- 계약 연장/이동/철수 처리 (2개월 계약 만료 시점 창업자 선택지) — 별도 스펙/플랜 필요
- 온라인 결제·정산 시스템
- 알림 시스템(신규 신청 시 이메일/푸시)
- 배포 환경 구성(클라우드 스토리지로 사진 업로드 교체 포함)
