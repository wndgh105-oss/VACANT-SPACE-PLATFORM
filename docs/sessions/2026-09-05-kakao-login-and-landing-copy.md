# 2026-09-05 세션 기록 — 카카오 로그인 연동 & 랜딩 카피 정리

## 1. 카카오 로그인 디버깅 (KOE006)

### 증상
카카오 로그인 버튼을 누르면 `앱 관리자 설정 오류 (KOE006)` 에러 발생.

### 처음 의심했던 것 (틀림)
- 동의항목(닉네임/이메일) 설정 문제로 생각하고 한참 확인함.

### 실제 원인
**REST API 키에 Redirect URI가 아예 등록돼 있지 않았음.**
카카오 콘솔에는 Redirect URI 등록 위치가 두 군데다:
- JavaScript 키의 "카카오 로그인 리다이렉트 URI" (등록돼 있었음)
- **REST API 키의 "카카오 로그인 리다이렉트 URI"** (앱 > 플랫폼 키 > REST API 키 수정, 스크롤해야 보임) — **여기가 비어 있었음**

실제 로그인 흐름은 REST API 키(`client_id`)를 쓰므로, JS 키 쪽 등록은 무관했음.
→ 두 URI(`http://localhost:3000/api/auth/callback/kakao`, `https://vacant-space-platform.vercel.app/api/auth/callback/kakao`) 등록 후 해결.

### 부수 발견: 클라이언트 시크릿
REST API 키 발급 시 클라이언트 시크릿이 기본 ON으로 활성화돼 있었는데 `.env`의 `KAKAO_CLIENT_SECRET`이 비어 있었음. 콘솔에서 코드 복사해 `.env`(로컬)와 Vercel 환경변수(프로덕션)에 각각 채워 넣음.

---

## 2. 이메일 없이 로그인되도록 코드 수정

카카오 콘솔에서 `account_email`이 "권한 없음"(회색, 설정 불가) 상태였음 — 비즈 앱 전환 전에는 이메일 동의 자체를 요청할 수 없는 구조.

**임시 조치 (이후 3번에서 원복):**
- `prisma/schema.prisma`: `User.email`을 nullable로, `User.kakaoId`(카카오 고유 ID) 컬럼 추가
- `src/lib/auth.ts`: 카카오 로그인 시 이메일이 아니라 `kakaoId`로 계정 식별하도록 변경, `scope`에서 `account_email` 제외
- `middleware.ts`, `onboarding/role/page.tsx`, `set-role/route.ts`: 이메일 없는 계정은 온보딩 화면에서 이메일을 직접 입력받도록 확장

---

## 3. 프로덕션 배포 트러블슈팅

### 3-1. 프로덕션 DB 마이그레이션 미반영
로컬에서 `kakaoId` 컬럼을 추가하는 마이그레이션을 만들었지만, Vercel은 `prisma generate && next build`만 실행할 뿐 `prisma migrate deploy`를 돌리지 않아서 **프로덕션 DB(Neon)에는 반영되지 않았음.** 로그인 시도 시 `The column User.kakaoId does not exist` 500 에러 발생.

**해결:** `package.json`의 `build` 스크립트를
```
"build": "prisma generate && next build"
```
에서
```
"build": "prisma generate && prisma migrate deploy && next build"
```
로 변경. Vercel 빌드 환경 안에서 마이그레이션이 자동 실행되게 함 (Vercel의 `DATABASE_URL`은 "Secret" 타입이라 로컬에서 값을 가져올 방법이 아예 없어서, 로컬에서 직접 마이그레이션을 돌리는 건 애초에 불가능했음).

### 3-2. Vercel 프로젝트 링크 사고
`vercel link --yes`를 프로젝트명 지정 없이 실행했다가, 기존 "vacant-space-platform" 프로젝트에 연결되는 대신 **"rental-platform"이라는 새 프로젝트를 실수로 생성하고 같은 GitHub 저장소를 거기에도 연결**해버림. 사용자가 대시보드에서 직접 삭제 후, `vercel link --project vacant-space-platform`으로 올바르게 재연결.

---

## 4. account_email 신청 (비즈 앱 전환)

사업자 번호 없는 개인 개발자가 `account_email`을 필수 동의로 켜기까지의 실제 절차:

1. **앱 아이콘 등록** (앱 설정 > 일반 > 앱 기본 정보) — 이게 없으면 비즈 앱 전환 버튼 자체가 비활성화됨
2. 비즈니스 정보 섹션의 **"개인 개발자 비즈 앱 전환"** 버튼 (사업자 등록번호 있는 경우의 "사업자 정보 등록" 버튼과는 다름) → 전환 목적 "이메일 필수 동의" 선택
3. 전환 완료 후 동의항목의 `account_email` 상태가 "권한 없음" → "사용 안 함"으로 바뀜 → [설정]으로 "필수 동의"로 변경
4. 별도 심사 대기 없이 즉시 반영됨 (본인인증 단계는 요구받지 않았음)

전환 후 `src/lib/auth.ts`의 `scope`를 `'profile_nickname account_email'`로 복원.

### 발견한 진짜 버그: 이메일 백필 누락
`findOrCreateKakaoUser`가 `kakaoId`로 기존 계정을 찾으면 그 레코드를 그대로 반환만 하고, 나중에 들어온 이메일 값으로 갱신하지 않았음. 즉 이메일 동의 없이 만들어진 계정은 이후 동의를 받아도 영원히 이메일이 null로 남는 문제. `byKakaoId.email`이 비어있고 새 `email`이 들어오면 update하도록 수정.

프로덕션 DB에 이 버그로 영향받은 계정이 있는지 Neon SQL Editor로 확인한 결과 **0건** (본인 테스트 계정 1개뿐이었고, 재로그인으로 이미 해결됨).

### 이후 정리
이메일이 이제 필수로 보장되므로, 2번에서 만든 "온보딩 이메일 입력" 관련 코드(미들웨어 게이트, 온보딩 페이지의 이메일 필드, set-role API의 이메일 처리)를 전부 원래의 역할-전용 형태로 되돌림.

---

## 5. 전체 로그인 플로우 검증

로컬 + 프로덕션 양쪽에서 확인한 것:
- 카카오 로그인 → 온보딩(역할 선택) → 대시보드
- 이메일/비밀번호 회원가입 → 로그인
- 데모 계정 4종(창업자/건물주/장비 파트너/운영자) 전부 정상 로그인 및 역할별 네비게이션 전환

테스트 중 생성된 계정들은 로컬 psql / 프로덕션 Neon SQL Editor로 정리함.

---

## 6. 랜딩 페이지 카피 & 로고 정리

### 헤드라인
기존: "1억을 걸기 전에, 두 달만 장사해 보세요."
→ 당근마켓(친근한 구어체) + 배달의민족(옷 사이즈 비유) 스타일을 섞어서:
**"일단, 두 달만 해볼까요? / 안 맞으면 사이즈 바꾸면 되니까요!"**
(처음엔 3줄로 줄바꿈돼서 폰트 크기를 26px/36px로 줄여 2줄 고정)

### 부제
"보증금도 권리금도 없이 가볍게 시작하는 창업." — 폰트 크기 축소

### 다른 섹션 제목
- "어떻게 하나요" → **"네 단계면 충분해요!"**
- "업종별 모듈형 장비 패키지" → **"장비도, 필요한 만큼만"**
- (그대로 둔 것: "짧게 빌린다고 대충 하지 않습니다", "공실은 기회가 되고, 창업은 가벼워집니다" — 이미 톤이 맞거나 사이트 전역 태그라인이라 유지)

### 로고
헤더의 단색 정사각형 박스를 사용자가 제공한 손 모양 아이콘(`public/logo-icon.png`, 카카오 앱 아이콘으로도 쓴 것과 동일 파일)으로 교체, 이후 원본 비율(127:97) 유지하며 확대.

### 데모 계정 안내 문구 제거
로그인 페이지 데모 계정 목록 아래 있던 "프로덕션 배포 시 이 안내 블록은 제거해야 합니다" 자기 지시적 경고문만 삭제 (데모 계정 버튼 자체는 심사용으로 계속 유지).

---

## 7. 커밋 이력 (`rental-platform`, `main` 브랜치)

```
4e2cece fix: allow Kakao login without email consent
b4be43b fix: run pending Prisma migrations during the Vercel build
9939f07 feat: request account_email now that Kakao's business-app review is done
95e2ca5 fix: backfill email on existing Kakao accounts once granted
b280c4e refactor: drop onboarding email fallback now that account_email is mandatory
7233cd1 chore: remove dev-only disclaimer note from login page demo panel
e9a8bab copy: rewrite landing hero headline and add header logo icon
dcfe996 style: enlarge header logo icon, keep its native aspect ratio
0083527 copy: add exclamation to hero headline, shrink subcopy text size
0ec23c0 fix: shrink hero headline so the second line no longer wraps to a third
c66089d copy: sharpen two more homepage section headings
```

---

## 8. 미해결 / 알아둘 것

- **보증금 안전장치 없음**: MVP는 자금을 일절 보관하지 않도록 설계돼 있어(`docs/business/03_MVP범위.md` X1), "임대인이 보증금 들고 잠적" 같은 리스크를 막을 기술적 장치가 현재 없음. 완화책은 "현장 실사 100%"와 (더미로 구현된) "본인 인증 표시"뿐.
- **전체 진행률**: 모두의창업 심사용 MVP 데모 기준으로는 100% (계획된 N1~N17 + DoD 전부 통과, 카카오 로그인까지 추가 완료). 실제 운영 가능한 서비스 기준으로는 40~50% 수준 — 결제/에스크로, 전자계약, 실명인증, 알림 발송, 외부 지도·상권 연동, 파트너 정산 등 22개 보류 항목(X1~X22) 중 21개가 아직 미착수.
- 관련 메모리: `project-rental-platform-kakao-login`, `project-rental-platform-mvp`, `project-rental-platform-binjari-merge`, `rental-platform-local-toolchain`
