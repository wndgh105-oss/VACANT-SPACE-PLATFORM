# 빈자리 (VACANT SPACE PLATFORM)

단기 임대형 공실 완화 · 모듈형 창업 렌탈 플랫폼 **MVP 데모**

비어 있는 상가를 2개월 단위로 빌리고, 카페·팝업·사무실·스터디 장비를 패키지로 함께 대여해서,
1억이 아니라 수백만 원으로 창업을 "시험 운영"해 볼 수 있게 하는 플랫폼입니다.

**🔗 라이브 데모: https://vacant-space-platform.vercel.app**
(Vercel + Neon PostgreSQL로 배포. 로그인 화면의 데모 계정 버튼으로 바로 둘러볼 수 있습니다.)

> ⚠️ **본 저장소는 아이디어 검증용 MVP 데모입니다.**
> 실제 매물·실제 결제·법적 계약 체결 기능이 없습니다. 표시되는 공간·상권 정보·금액은 모두 가정된 예시 데이터입니다.
> 중개 구조와 단기 계약 형태의 적법성은 **변호사·공인중개사 검토 전 단계**입니다. 자세한 내용은
> [docs/business/01_사업기획서.md](docs/business/01_사업기획서.md) 9절과 앱 내 `/guide/legal` 페이지를 참고하세요.

---

## 빠른 시작

### 사전 요구사항

| 항목 | 버전 | 비고 |
|---|---|---|
| Node.js | 20 이상 (개발·검증은 24.19.0) | |
| PostgreSQL | 14 이상 (개발·검증은 17) | 로컬 실행 필요 |
| ffmpeg | 선택 | 데모 영상을 mp4로 변환할 때만 필요 |

### 1. 설치

```bash
npm install
npx playwright install chromium
```

### 2. 데이터베이스 준비

```bash
createdb rental_platform          # 또는 psql에서 CREATE DATABASE rental_platform;
cp .env.example .env              # DATABASE_URL을 본인 환경에 맞게 수정
npx prisma migrate deploy         # 스키마 적용 (개발 중이면 migrate dev)
npx prisma generate
```

### 3. 데모 데이터 시드

```bash
npm run seed
```

공간 12건, 실사 대기 1건, 장비 패키지 4종, 운영 중 계약 1건, 공개된 이전 티저 1건이 만들어집니다.

### 4. 실행

```bash
npm run dev
```

http://localhost:3000 접속.

---

## 데모 계정

비밀번호는 모두 `demo1234` 입니다. 로그인 화면 우측의 **"데모 계정으로 바로 보기"** 버튼으로 클릭 한 번에 들어갈 수 있습니다.

| 역할 | 이메일 | 볼 수 있는 것 |
|---|---|---|
| 창업자 | `tenant@demo.kr` | 공간 탐색 · 견적 · 상담 요청 · 대시보드 · 이전 티저 생성 |
| 건물주 | `landlord@demo.kr` | 공실 등록 · 요청 관리 · 계약 확정 · 예상 수익 |
| 장비 파트너 | `partner@demo.kr` | 패키지 노출 관리 · 장비 주문 현황 |
| 운영자 | `admin@demo.kr` | 실사 승인 · 신청 관리 · 지표 · 티저 콘텐츠 |

**로그인 없이 볼 수 있는 화면**: `/` (랜딩), `/spaces` (탐색·지도), `/spaces/[id]` (상세),
`/calculator` (예산 계산기), `/guide/legal` (법률 안내), `/t/dudal-coffee` (이전 티저)

---

## 주요 화면

| 경로 | 설명 |
|---|---|
| `/` | 랜딩 — 문제 제기, 비용 비교, 퀵 검색 |
| `/spaces` | 공간 탐색 — 지역·예산·기간·업종·설비 필터, 목록 ⇄ 지도 전환 |
| `/spaces/[id]` | 공간 상세 — 조건, 상권 요약, 추천 업종, 정식 창업 대비 비용 |
| `/spaces/[id]/quote` | 견적 — 기간 + 장비 패키지 + 품목 가감 + 부가 옵션, 실시간 합계 |
| `/spaces/[id]/quote/request` | 상담·예약 요청 + 계약 전 확인 체크리스트 |
| `/calculator` | "내 예산으로 가능한 창업" 역산 계산기 |
| `/dashboard` | 창업자 대시보드 — 운영 중 계약, D-day, 연장/이전 |
| `/dashboard/relocate/[id]` | 이전 소식 티저 만들기 |
| `/t/[slug]` | 공개 이전 티저 — 힌트 카드, 흐린 지도, 카운트다운, 공유 |
| `/landlord` | 건물주 대시보드 — 공실, 요청 인박스, 예상 수익 |
| `/partner` `/partner/packages` `/partner/orders` | 장비 파트너 |
| `/admin/overview` `/admin` `/admin/packages` | 운영자 |
| `/guide/legal` | 법률·인허가 안내 (법률 자문 아님) |

---

## 기술 스택

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + 자체 디자인 토큰 (아이보리 / 차콜 / 테라코타)
- **Prisma 7** + **PostgreSQL**
- **NextAuth.js** (Credentials, JWT 세션)
- **Zod** 입력 검증
- **Vitest** + React Testing Library (단위·통합), **Playwright** (E2E·영상 녹화)

외부 지도 API·상권 공공 API·PG·알림톡은 **연동하지 않았습니다.** 대체 구현은 아래 "가짜로 처리한 것" 참조.

---

## 스크립트

| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm test` | Vitest 단위·통합 테스트 |
| `npm run seed` | 데모 데이터 시드 |
| `npm run seed:e2e` | E2E 전용 픽스처 시드 |
| `npm run test:e2e` | Playwright E2E (개발 서버 자동 기동/재사용) |
| `npm run demo:record` | 데모 영상 녹화 (개발 서버 필요) |
| `npm run demo:build` | 녹화본 → `docs/demo/demo.mp4` 변환 (ffmpeg 필요) |
| `npm run demo` | 녹화 + 변환 |

> Node를 시스템 PATH에 두지 않은 환경에서는 Playwright 개발 서버 명령을
> `E2E_DEV_COMMAND="C:\path\to\npm.cmd run dev"` 로 지정할 수 있습니다.

---

## 문서

| 문서 | 내용 |
|---|---|
| [docs/business/01_사업기획서.md](docs/business/01_사업기획서.md) | 사업기획서 11개 항목 (문제·해결·고객·시장·수익·운영·리스크·바이럴·로드맵) |
| [docs/business/02_요약_린캔버스_피치.md](docs/business/02_요약_린캔버스_피치.md) | 1페이지 요약, Lean Canvas, 60초 피치, 수익 예시 3케이스·민감도 분석 |
| [docs/business/03_MVP범위.md](docs/business/03_MVP범위.md) | MVP 포함/제외 범위, "가짜로 처리한 것" 목록, 완료 판정 기준 |
| [docs/product/PRD.md](docs/product/PRD.md) | PRD — IA, 플로우, 페이지·컴포넌트, ERD, API, 디자인 토큰, 빈/오류 상태 |
| [docs/demo/자막_원고.md](docs/demo/자막_원고.md) | 데모 영상 스토리보드·자막 원고·재생성 방법 |

---

## 가짜로 처리한 것 (정직한 고지)

| 항목 | 실제 상태 | 이 저장소의 구현 |
|---|---|---|
| 결제 | 없음 | 금액 계산만. "데모" 고지 상시 노출 |
| 계약 체결 | 없음 | 상태 값(요청/상담/확정)과 Tenancy 레코드만 |
| 지도 | 외부 지도 API 미사용 (키 없음) | 위경도를 선형 투영한 자체 SVG 지도 |
| 상권 데이터 | 공공 API 미연동 | 시드에 하드코딩된 예시 텍스트 ("예시 데이터" 라벨 표기) |
| 본인 인증 | 실제 인증 없음 | `verified` 불리언 필드 표시만 |
| 매물 사진 | 실제 사진 아님 | `/api/placeholder/[seed]` 가 생성하는 추상 SVG |
| 알림 (이메일/SMS/알림톡) | 발송 없음 | 화면 내 목록으로 대체 |
| 보험·인허가 연계 | 계약 없음 | 안내 문구와 상담 체크박스만 |
| 소셜 로그인 | 없음 | 이메일/비밀번호만 |

---

## 검증 상태

| 검사 | 결과 |
|---|---|
| `npx tsc --noEmit` | 통과 |
| `npm run lint` | 통과 (경고 0) |
| `npm run build` | 통과 |
| `npm test` | 25개 파일 / 92개 테스트 통과 |
| `npm run test:e2e` | 6개 시나리오 통과 |
| 반응형 | 375px(모바일) / 1280px(데스크톱) 확인 |
| 데모 영상 | `docs/demo/demo.mp4` — 59.2초 · H.264 1280×800 · 3.26MB · 재생 확인 |
