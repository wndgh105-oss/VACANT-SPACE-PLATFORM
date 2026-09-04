# 빈자리 (VACANT SPACE PLATFORM) — PRD & 화면 설계

> v1.0 · 2026-09-03 · 대상 코드베이스 `rental-platform`
> 기존 3역할 MVP(창업자/건물주/관리자) 위에 VACANT SPACE 확장 범위를 얹는 설계 문서입니다.
> 범위 경계는 [../business/03_MVP범위.md](../business/03_MVP범위.md) 참조.

---

## 1. 제품 목표와 성공 기준

| 목표 | 성공 기준 (MVP) |
|---|---|
| 창업자가 "총 얼마인지"를 3분 안에 안다 | 랜딩 진입 → 견적 확인까지 5클릭 이내 |
| 공간과 장비를 한 번에 구성한다 | 견적서 1장에 공간+장비+기간+총액이 모두 표시 |
| 건물주가 공실을 5분 안에 등록한다 | 필수 입력 12개 이하, 1페이지 폼 |
| 이전이 바이럴이 된다 | 창업자가 클릭 3번으로 티저 페이지 생성·공유 |
| 오해가 없다 | 모든 페이지에 데모 고지 노출 |

---

## 2. 사용자 역할

| 역할 | enum | 진입 경로 | 핵심 화면 |
|---|---|---|---|
| 예비 창업자 / 임차인 | `TENANT` | `/spaces`, `/dashboard` | 탐색·견적·요청·대시보드·이전 티저 |
| 공실 소유자 / 임대인 | `LANDLORD` | `/landlord` | 공간 등록·문의 관리·예상 수익 |
| 장비 렌탈 파트너 | `PARTNER` **(신규)** | `/partner` | 패키지 등록·주문 수신 |
| 관리자 | `ADMIN` | `/admin` | 전체 관리·실사 승인·신고 처리 |
| 비로그인 방문자 | — | `/`, `/spaces`, `/t/[slug]` | 랜딩·탐색·티저 페이지 (읽기) |

---

## 3. 정보 구조 (IA)

```
/                               랜딩
├─ /spaces                      공간 탐색 (목록 ⇄ 지도 전환)
│   └─ /spaces/[id]             공간 상세
│       └─ /spaces/[id]/quote   견적 구성 (기간 + 장비 패키지)
│           └─ /spaces/[id]/quote/request   상담·예약 요청
├─ /calculator                  "내 예산으로 가능한 창업" 계산기
├─ /guide/legal                 법률·인허가 안내 (신뢰 장치)
│
├─ /login  /register            인증
│
├─ /dashboard                   창업자 대시보드
│   ├─ /dashboard/applications  내 요청 현황
│   ├─ /dashboard/favorites     관심 공간
│   └─ /dashboard/relocate/[tenancyId]   이전 티저 생성
│
├─ /landlord                    건물주 대시보드
│   ├─ /landlord/listings/new       공실 등록
│   ├─ /landlord/listings/[id]      공실 상세/수정
│   └─ /landlord/listings/[id]/applications  요청 관리
│
├─ /partner                     장비 파트너 대시보드 (신규)
│   ├─ /partner/packages            패키지 관리
│   └─ /partner/orders              장비 주문 현황
│
├─ /admin                       관리자
│   ├─ /admin/listings  /admin/users  /admin/applications
│   ├─ /admin/packages  /admin/teasers  /admin/reports
│
└─ /t/[slug]                    이전 소식 티저 (공개, 비로그인)
```

> 기존 코드의 `/tenant/*` 경로는 `/spaces`·`/dashboard`로 재편하고, 구 경로는 리다이렉트로 유지합니다.

---

## 4. 사용자 플로우

### 4-1. 시나리오 A~C — 탐색에서 요청까지 (핵심 루프)

```
랜딩 /
  │ [지역·기간·예산 입력] 또는 [바로 둘러보기]
  ▼
/spaces  ─── 필터: 지역·월예산·보증금·기간·면적·업종·주차·설비·즉시입주
  │  ⇄ [지도 보기] 토글
  │ 카드 클릭
  ▼
/spaces/[id]  ─── 사진 / 조건 / 상권 요약 / 추천 업종 / 월 예상 비용
  │ [이 공간으로 견적 만들기]
  ▼
/spaces/[id]/quote
  │  ① 이용 기간 선택 (1~6개월 슬라이더)
  │  ② 장비 패키지 선택 (카페/팝업/사무실/스터디) — 품목 체크로 가감
  │  ③ 부가 옵션 (간판·보험·인허가 대행)
  │  ▼ 실시간 합계 (월 비용 / 총 비용 / 정식창업 대비 절감액)
  │ [상담·예약 요청하기]
  ▼
/spaces/[id]/quote/request  ─── 이름·연락처·시작희망일·메시지 + 계약 체크리스트 확인
  │ [요청 보내기]  (※ 데모: 실제 계약·결제 아님)
  ▼
완료 화면 → /dashboard/applications
```

### 4-2. 시나리오 D~E — 운영, 연장, 이전 바이럴

```
/dashboard
  │ 진행 중 계약 카드: 공간 · 기간 · 잔여 D-day · 월 비용 · 장비 목록
  │
  ├─[연장하기]──▶ 연장 요청 생성 (수수료 8%→5% 안내)
  ├─[정식 창업 전환]──▶ 상담 요청 (안내만)
  └─[다른 곳으로 이전]
        ▼
   이전 추천 목록 (예산·업종 유사, 상권 등급 상향)
        │ 새 공간 선택 → 견적 → 요청
        ▼
   /dashboard/relocate/[tenancyId]  이전 티저 만들기
        │  · 힌트 카드 3장 작성 (자동 초안 제공)
        │  · 지도 힌트 반경 선택 (300m / 500m / 1km)
        │  · 오픈 예정일 설정
        │  · 미리보기
        │ [티저 공개하기]
        ▼
   /t/[slug]  공개 티저 페이지 → SNS 공유 (링크 복사 / 이미지 카드 다운로드)
```

### 4-3. 시나리오 F — 건물주

```
/register (역할: 건물주) → /landlord
  │ [공실 등록하기]
  ▼
/landlord/listings/new  ─── 주소·좌표·면적·월이용료·보증금·가능기간·허용업종·설비·사진
  │ 저장 → 상태 `PENDING_REVIEW` (관리자 실사 승인 대기)
  ▼
관리자 승인 → 상태 `OPEN` → 노출
  ▼
/landlord  대시보드: 등록 공실 / 문의 수 / 요청 목록 / 예상 수익 / 공실 기간
  │ 요청 카드 [상담중] → [확정] → 계약(Tenancy) 생성
```

---

## 5. 페이지 목록 및 핵심 컴포넌트

| # | 경로 | 목적 | 핵심 컴포넌트 | 접근 |
|---|---|---|---|---|
| P1 | `/` | 랜딩: 문제→해결→비용비교→CTA | `Hero`(퀵검색), `CostCompareBlock`, `HowItWorks`, `PackageStrip`, `TrustStrip`, `DemoBanner` | 공개 |
| P2 | `/spaces` | 탐색 | `FilterPanel`, `ListingCard`, `ViewToggle`, `SpaceMap`, `EmptyState`, `SkeletonGrid` | 공개 |
| P3 | `/spaces/[id]` | 상세 | `PhotoGallery`, `SpecTable`, `AreaSummary`, `RecommendedTypes`, `CostPreview`, `TrustBadges`, `FavoriteButton` | 공개 |
| P4 | `/spaces/[id]/quote` | 견적 구성 | `DurationSlider`, `PackagePicker`, `ItemToggleList`, `AddonList`, `QuoteSummary`(sticky) | 공개(요청 시 로그인) |
| P5 | `/spaces/[id]/quote/request` | 요청 폼 | `RequestForm`, `ContractChecklist`, `DemoNotice` | TENANT |
| P6 | `/calculator` | 예산 역산 | `BudgetInput`, `FeasibilityResult`, `MatchedListings` | 공개 |
| P7 | `/dashboard` | 창업자 대시보드 | `TenancyCard`, `CountdownBadge`, `NextActionPanel`, `RelocationSuggest` | TENANT |
| P8 | `/dashboard/applications` | 요청 현황 | `ApplicationTimeline`, `StatusBadge` | TENANT |
| P9 | `/dashboard/favorites` | 관심 공간 | `ListingCard` | TENANT |
| P10 | `/dashboard/relocate/[id]` | 티저 생성 | `HintCardEditor`, `BlurMapPicker`, `DatePicker`, `TeaserPreview` | TENANT |
| P11 | `/t/[slug]` | 공개 티저 | `TeaserHero`, `HintCards`, `BlurredMap`, `CountdownTimer`, `ShareBar`, `PlatformFooterCTA` | 공개 |
| P12 | `/landlord` | 건물주 대시보드 | `RevenueSummary`, `ListingRow`, `VacancyGauge`, `RequestInbox` | LANDLORD |
| P13 | `/landlord/listings/new` `/edit` | 공실 등록 | `ListingForm`, `CoordPicker`, `FacilityToggles`, `PhotoUploader` | LANDLORD |
| P14 | `/landlord/listings/[id]/applications` | 요청 관리 | `ApplicationRow`, `StatusActions` | LANDLORD |
| P15 | `/partner` | 파트너 대시보드 | `PackageRow`, `OrderInbox`, `RevenueSummary` | PARTNER |
| P16 | `/partner/packages` | 패키지 관리 | `PackageForm`, `ItemEditor` | PARTNER |
| P17 | `/admin` | 관리자 홈 | `StatTiles`, `ReviewQueue` | ADMIN |
| P18 | `/admin/*` | 각 관리 화면 | `DataTable`, `StatusActions` | ADMIN |
| P19 | `/guide/legal` | 법률·인허가 안내 | `ChecklistAccordion`, `DisclaimerBlock` | 공개 |
| P20 | `/login` `/register` | 인증 | `AuthForm`, `RoleSelect` | 공개 |

---

## 6. 데이터 모델 (ERD)

### 6-1. 관계도

```
User ──< Listing ──< Application >── User(tenant)
 │         │  │           │
 │         │  │           └──> Quote (1:1, optional)
 │         │  └──< Favorite >── User(tenant)
 │         └──< Tenancy >── User(tenant)
 │                 └──1:1── RelocationTeaser ──< TeaserHint
 │
 ├──< EquipmentPackage(partner) ──< EquipmentItem
 │                                       │
 │                                  QuoteItem >── Quote
 ├──< Review
 └──< Report
```

### 6-2. 모델 정의 (변경분 굵게)

| 모델 | 필드 | 비고 |
|---|---|---|
| **User** | id, email, passwordHash, name, role(`TENANT`\|`LANDLORD`\|**`PARTNER`**\|`ADMIN`), **phone**, **verified**, **companyName**, createdAt | `verified`는 데모용 수동 토글 |
| **Listing** | id, landlordId, **title**, address, **region**, **lat**, **lng**, area, monthlyRent, deposit, **maintenanceFee**, photos[], contractDurations[], businessTypes[], **parking**, **powerKw**, **hasGas**, **hasDrain**, **immediateMoveIn**, **areaSummary**, **recommendedTypes[]**, **description**, status(**`PENDING_REVIEW`**\|`OPEN`\|`CLOSED`), createdAt | 좌표는 자체 SVG 지도 투영에 사용 |
| **EquipmentPackage** | id, **partnerId?**, businessType, name, **description**, monthlyFee, **active**, createdAt | 기존 `items String[]` → **EquipmentItem 관계로 승격** |
| **EquipmentItem** *(신규)* | id, packageId, name, monthlyFee, **optional**, sortOrder | `optional=true`면 체크 해제 가능 |
| **Quote** *(신규)* | id, tenantId?, listingId, months, spaceTotal, equipmentTotal, addonTotal, grandTotal, savedVsFull, createdAt | 견적 스냅샷 |
| **QuoteItem** *(신규)* | id, quoteId, itemId?, label, monthlyFee, kind(`PACKAGE`\|`ITEM`\|`ADDON`) | |
| **Application** | id, listingId, tenantId, **quoteId?**, applicantName, phone, desiredDuration, desiredStartDate, message, status, createdAt | |
| **Tenancy** *(신규)* | id, listingId, tenantId, applicationId?, startDate, endDate, monthlyTotal, status(`ACTIVE`\|`ENDED`\|`EXTENDED`\|`RELOCATED`), createdAt | 대시보드 D-day의 근거 |
| **RelocationTeaser** *(신규)* | id, tenancyId, slug@unique, storeName, fromAddress, toRegionHint, **hintRadiusM**, **toLat**, **toLng**, openDate, message, published, views, createdAt | `/t/[slug]` |
| **TeaserHint** *(신규)* | id, teaserId, text, emoji, sortOrder | 힌트 카드 |
| **Review** *(신규)* | id, tenancyId, authorId, rating(1-5), body, createdAt | |
| **Report** *(신규)* | id, reporterId, targetType, targetId, reason, handled, createdAt | 신고 |
| **Favorite** | (기존 유지) | |

### 6-3. 마이그레이션 주의

- `Role`, `BusinessType`, `ListingStatus` enum에 값 **추가만** 합니다 (기존 값 제거 없음).
- `BusinessType`: `CAFE`, `RETAIL`, `OTHER` → **`OFFICE`, `STUDY` 추가**. `RETAIL`을 팝업스토어 표시명으로 매핑.
- `EquipmentPackage.items String[]` 는 **삭제하지 않고 유지**하되 신규 화면은 `EquipmentItem`을 사용합니다 (기존 API·테스트 보호).
- `EquipmentPackage.businessType`의 `@unique` 제약은 **제거**합니다 (업종당 여러 파트너 패키지 허용).

---

## 7. API / 서버 액션 설계

기존 REST Route Handler 패턴을 유지합니다. 신규 엔드포인트만 표기합니다.

| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| GET | `/api/listings` | 공개 | 필터 쿼리 확장: `region, minRent, maxRent, maxDeposit, months, minArea, businessType, parking, gas, drain, immediate` |
| GET | `/api/listings/[id]` | 공개 | 상세 (상권 요약·추천 업종 포함) |
| POST | `/api/quotes` | 공개 | 견적 계산 + 저장. body: `{listingId, months, packageId?, itemIds[], addonIds[]}` → 합계 반환 |
| GET | `/api/quotes/[id]` | 소유자 | 견적 조회 |
| GET | `/api/packages?businessType=` | 공개 | 업종별 패키지 + 품목 |
| POST/PATCH/DELETE | `/api/partner/packages[/id]` | PARTNER | 파트너 패키지 관리 |
| GET | `/api/partner/orders` | PARTNER | 확정 계약에 포함된 장비 주문 |
| POST | `/api/applications` | TENANT | 요청 생성 (quoteId 연결) |
| PATCH | `/api/applications/[id]` | LANDLORD/ADMIN | 상태 전이. `CONFIRMED` 전이 시 **Tenancy 자동 생성** (트랜잭션) |
| GET | `/api/tenancies` | TENANT | 내 계약 목록 (D-day 계산은 서버) |
| POST | `/api/tenancies/[id]/extend` | TENANT | 연장 요청 |
| POST | `/api/teasers` | TENANT | 티저 생성 (slug 자동 생성) |
| PATCH | `/api/teasers/[id]` | 소유자 | 수정·공개 토글 |
| GET | `/api/teasers/[slug]` | 공개 | 티저 조회 + 조회수 증가 |
| POST | `/api/reviews` | TENANT | 후기 등록 |
| POST | `/api/reports` | 로그인 | 신고 |
| PATCH | `/api/admin/listings/[id]/review` | ADMIN | 실사 승인 (`PENDING_REVIEW`→`OPEN`) |

**공통 규칙**
- 모든 입력은 Zod 스키마로 검증. 실패 시 `400 { error, fields }`
- 인증 실패 `401`, 권한 없음 `403`, 없음 `404`
- 상태 전이는 `applicationStatusTransition.ts`의 허용 표를 따름 (기존 로직 재사용)
- 금액 계산은 **서버의 `lib/quote.ts` 단일 함수**에서만 수행 (클라이언트는 표시만) — 조작 방지 및 테스트 용이

---

## 8. 견적 계산 규칙 (`lib/quote.ts`)

```
spaceTotal      = monthlyRent × months
maintenance     = maintenanceFee × months
equipmentTotal  = Σ(선택된 품목 monthlyFee) × months
addonTotal      = Σ(일회성 부가 옵션)
deposit         = deposit                    (반환 대상, 총액과 분리 표기)
─────────────────────────────────────────────
grandTotal      = spaceTotal + maintenance + equipmentTotal + addonTotal
needCash        = grandTotal + deposit
monthlyAvg      = grandTotal / months

fullStartupCost = 업종별 기준 정식창업 비용 (상수 테이블, 면적 비례)
savedVsFull     = fullStartupCost − needCash
savedRate       = savedVsFull / fullStartupCost
```

정식 창업 기준 비용(가정, `lib/startupBaseline.ts` 상수):

| 업종 | 평당 인테리어 | 장비 | 보증금 배수 | 권리금 |
|---|---:|---:|---:|---:|
| 카페 | 1,500,000원 | 15,000,000원 | 월세×20 | 20,000,000원 |
| 팝업/리테일 | 900,000원 | 5,000,000원 | 월세×15 | 15,000,000원 |
| 사무실 | 700,000원 | 4,000,000원 | 월세×10 | 0원 |
| 스터디 | 800,000원 | 6,000,000원 | 월세×10 | 0원 |

> 이 수치는 가정값이며 화면에 "가정 기준" 라벨을 함께 표시합니다.

---

## 9. 디자인 시스템

### 9-1. 컬러 토큰

| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg` | `#FBF8F3` (아이보리) | 페이지 배경 |
| `--surface` | `#FFFFFF` | 카드 |
| `--surface-alt` | `#F3EDE4` | 보조 영역 |
| `--ink` | `#241F1B` (차콜) | 본문 |
| `--ink-muted` | `#6B615A` | 보조 텍스트 |
| `--line` | `#E4DACE` | 보더 |
| `--brand` | `#C4562B` (테라코타) | 주요 CTA |
| `--brand-strong` | `#A5431F` | hover |
| `--brand-soft` | `#FBEDE5` | 배지 배경 |
| `--ok` | `#2F7A55` / `--warn` `#B4761B` / `--danger` `#B03A2E` | 상태 |

대비 검증(가정): `--ink` on `--bg` ≈ 13.8:1, 흰 글자 on `--brand` ≈ 4.7:1 → WCAG AA 충족.
다크 모드는 MVP 범위 밖 — `color-scheme: light` 고정.

### 9-2. 타이포·간격·모션

- 폰트: `Pretendard` → 없으면 `system-ui, -apple-system, "Malgun Gothic", sans-serif`
- 스케일: 32/24/20/16/14/12, 본문 16px, 행간 1.6
- 라운드: 카드 16px, 버튼 12px, 배지 999px
- 그림자: `0 1px 2px rgba(36,31,27,.06), 0 8px 24px rgba(36,31,27,.05)`
- 모션: 120~240ms `cubic-bezier(.2,.8,.2,1)`. 카드 등장은 stagger 40ms. `prefers-reduced-motion` 존중.

### 9-3. 반응형

| 브레이크포인트 | 레이아웃 |
|---|---|
| < 640px (기본) | 1열 카드, 필터는 바텀시트, 하단 고정 CTA |
| 640~1024px | 2열 카드, 필터 접이식 |
| ≥ 1024px | 좌측 필터 고정 + 3열 카드, 지도는 우측 분할 |

### 9-4. 접근성 규칙

- 모든 폼 요소에 `<label htmlFor>` 연결
- 포커스: `outline: 2px solid var(--brand); outline-offset: 2px` — 절대 제거하지 않음
- 아이콘 전용 버튼에 `aria-label`
- 지도는 장식이 아니라 정보 → 목록 뷰가 항상 동등하게 제공됨 (지도는 `role="img"` + `aria-label` 요약)
- 상태 변경은 `aria-live="polite"`로 안내
- 색만으로 상태를 표현하지 않음 (배지에 텍스트 병기)

---

## 10. 오류 · 빈 상태 · 로딩 설계

| 상황 | 화면 | 문구 방향 |
|---|---|---|
| 검색 결과 0건 | `EmptyState` + 조건 완화 제안 버튼 | "조건에 맞는 공간이 아직 없어요. 예산을 20만 원 올리면 3곳이 보여요." |
| 목록 로딩 | `SkeletonGrid` (카드 6개) | — |
| 견적 계산 중 | 합계 영역 shimmer | — |
| 네트워크 실패 | 인라인 에러 + [다시 시도] | "잠시 연결이 끊겼어요. 다시 시도해 주세요." |
| 권한 없음 | 403 페이지 + 역할 안내 | "이 화면은 건물주 계정에서 볼 수 있어요." |
| 로그인 필요 | 요청 버튼 클릭 시 로그인 유도 모달 (견적 상태는 보존) | "요청을 보내려면 로그인이 필요해요." |
| 등록 사진 없음 | 추상 SVG 플레이스홀더 | alt="사진 준비 중인 공간" |
| 티저 미공개 | 404 대신 안내 페이지 | "아직 공개되지 않은 소식이에요." |
| 계약 없음(대시보드) | 온보딩 카드 | "아직 진행 중인 공간이 없어요. 먼저 둘러볼까요?" |
| 폼 검증 실패 | 필드 하단 에러 + 첫 오류로 포커스 이동 | 구체적 지시형 문구 |

---

## 11. MVP vs 향후 고도화

| 기능 | MVP | 향후 |
|---|---|---|
| 지도 | 자체 SVG 좌표 지도 | 네이버/카카오 지도 SDK, 클러스터링, 반경 검색 |
| 상권 정보 | 시드 텍스트(예시 라벨) | 공공데이터 유동인구·업종 생존율 연동 |
| 견적 | 규칙 기반 계산 | 파트너 실시간 재고·배송비 반영 |
| 계약 | 상태 표시 | 전자계약·전자서명 (법무 검토 후) |
| 결제 | 없음 | PG + 에스크로 (전자금융 검토 후) |
| 알림 | 화면 내 목록 | 카카오 알림톡·이메일·푸시 |
| 인증 | 이메일/비번 | 카카오·네이버 소셜, 본인확인 |
| 추천 | 규칙 기반(예산·업종·상권등급) | 성공 데이터 기반 랭킹 모델 |
| 티저 | 링크 공유 + 이미지 카드 | 위치 미션 게임, 쿠폰 발급, SNS API 직접 게시 |
| 파트너 | 패키지 등록·주문 확인 | 셀프 온보딩, 자동 정산, 재고 연동 |
