# 차곡 — Codemap

> 코드 구조, 기술 스택, 패턴 레퍼런스

---

## 기술 스택

| 역할 | 기술 | 버전 |
|------|------|------|
| 앱 프레임워크 | Expo | SDK 55 |
| 라우팅 | Expo Router | v4 (파일 기반) |
| 언어 | TypeScript | |
| 스타일링 | NativeWind + Tailwind CSS | NativeWind v4, Tailwind v3 |
| 애니메이션 | Reanimated + Moti | Reanimated v4.2.1 |
| 백엔드/DB | Supabase JS | v2 (Auth, PostgreSQL, Realtime, Storage) |
| 서버 상태 | TanStack React Query | |
| 클라이언트 상태 | Zustand | |
| 빌드 | EAS Build | |
| DB 마이그레이션 | Supabase CLI | |
| 테스트 | Jest + jest-expo + RNTL | |

---

## 프로젝트 구조

```
chagok/
├── app/
│   ├── _layout.tsx          # 루트 레이아웃 — QueryClientProvider + 인증 분기
│   ├── index.tsx            # 진입점 (루트 리다이렉트용)
│   ├── (auth)/
│   │   ├── _layout.tsx      # 인증 스택 (headerShown: false)
│   │   ├── index.tsx        # 인트로 화면 (butter 배경)
│   │   └── login.tsx        # 로그인 화면 (butter 배경)
│   └── (tabs)/
│       ├── _layout.tsx      # 메인 탭 바
│       └── index.tsx        # 홈 탭
├── components/              # 공유 컴포넌트
├── constants/
│   ├── colors.ts            # 컬러 팔레트 상수
│   └── typography.ts        # 타이포그래피 토큰 (NativeWind className)
├── lib/
│   └── supabase.ts          # Supabase 클라이언트 인스턴스
├── store/
│   └── auth.ts              # Zustand auth store
├── __tests__/
│   └── store/
│       └── auth.test.ts     # auth store 단위 테스트
├── types/
│   └── database.ts          # Supabase DB 타입 전체 (Row/Insert/Update + alias)
├── supabase/
│   └── migrations/          # DB 마이그레이션 파일 (Supabase CLI)
│       ├── 20260306000001_init_tables.sql
│       ├── 20260306000002_rls.sql
│       ├── 20260306000003_functions.sql
│       ├── 20260306000004_indexes.sql
│       └── 20260306000005_realtime.sql
├── docs/
│   └── plans/               # 기획 문서 (설계서, 세팅 플랜)
├── assets/                  # 앱 아이콘, 스플래시
├── global.css               # Tailwind 베이스 임포트
├── tailwind.config.js       # NativeWind 프리셋 + 커스텀 컬러
├── metro.config.js          # withNativeWind 래핑
├── babel.config.js          # nativewind/babel + reanimated 플러그인
├── jest.config.js           # jest-expo 프리셋
├── nativewind-env.d.ts      # NativeWind 타입 선언
├── CLAUDE.md                # 프로젝트 사상 및 개발 지침
└── codemap.md               # 이 파일
```

---

## 화면 구조 (라우팅)

```
(auth) 그룹 — 비로그인 상태
  ├── /                인트로 화면 (butter 배경 + cream 버튼)
  └── /login           로그인 화면 (butter 배경 + cream 소셜 버튼)

(tabs) 그룹 — 로그인 상태
  ├── /               홈 (대시보드)
  ├── /ledger         가계부 (지출/수입 리스트 + 입력)
  ├── /calendar       캘린더 (월간 뷰)
  └── /settings       설정
```

**인증 분기 로직** (`app/_layout.tsx:16-31`)
- user === null + auth 그룹 밖 → `/(auth)/login` 리다이렉트
- user 존재 + auth 그룹 안 → `/(tabs)` 리다이렉트

---

## 핵심 파일 상세

### `app/_layout.tsx`
- `QueryClientProvider` (staleTime 5분, retry 1회)
- Supabase Auth 세션 감지 → `useAuthStore.setUser` 연동 예정
- `useSegments` + `useRouter`로 인증 분기

### `lib/supabase.ts`
- `createClient<Database>` — TypeScript 타입 완전 연결
- `AsyncStorage` 기반 세션 지속
- `autoRefreshToken: true`, `detectSessionInUrl: false`
- 환경변수: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### `types/database.ts`
- 7개 테이블 × Row/Insert/Update 타입
- DB 함수 타입: `create_couple`, `join_couple`, `get_my_couple_id`
- 편의 alias: `Couple`, `UserProfile`, `Category`, `Transaction`, `Comment`, `Schedule`, `FixedExpense`, `Tag`, `TransactionType`
- `User` 대신 `UserProfile` 사용 (Supabase Auth `User` 타입과 충돌 방지)

### `store/auth.ts`
```typescript
interface User {
  id: string;
  nickname: string;
  coupleId: string | null;
}
// useAuthStore: { user, setUser }
```

### `constants/colors.ts`
```typescript
Colors.butter    // #FAD97A — 메인 배경 (인트로/로그인)
Colors.brown     // #7B5E3A — 텍스트, 강조
Colors.cream     // #FEFCF5 — 일반 화면 배경
Colors.peach     // #F7B8A0 — 보조 포인트
Colors.lavender  // #D4C5F0 — 보조 포인트
Colors.white     // #FFFFFF
Colors.black     // #1A1A1A
```

### `constants/typography.ts`
```typescript
// 폰트: IBMPlexSansKR (font-ibm-bold / font-ibm-semibold / font-ibm-regular)
Typography.display   // font-ibm-bold text-[80px] text-brown tracking-tight
Typography.titleLg   // font-ibm-bold text-[48px] text-brown tracking-tight
Typography.title     // font-ibm-bold text-3xl text-brown
Typography.subtitle  // font-ibm-semibold text-xl text-brown
Typography.heading   // font-ibm-semibold text-lg text-brown
Typography.body      // font-ibm-regular text-base text-brown/80
Typography.caption   // font-ibm-regular text-[13px] text-brown/50
Typography.btnLabel  // font-ibm-bold text-[17px] text-brown
Typography.btnSocial // font-ibm-semibold text-base text-brown
```

---

## 설정 파일 핵심 사항

### `babel.config.js`
- 테스트 환경에서 `react-native-reanimated/plugin` 제외
  (`process.env.NODE_ENV === 'test'` 체크)
- reanimated 플러그인은 반드시 plugins 배열 마지막

### `tailwind.config.js`
- content: `app/**`, `components/**`
- presets: `nativewind/preset`
- 커스텀 colors: butter, brown, cream, peach, lavender
- 커스텀 fontFamily: `font-ibm-bold` / `font-ibm-semibold` / `font-ibm-regular` (IBMPlexSansKR)

### `metro.config.js`
- `withNativeWind(config, { input: './global.css' })`

---

## DB 스키마 (Supabase / PostgreSQL)

```sql
couples        id, book_name, invite_code(UNIQUE), created_at
users          id(=Auth uid), couple_id(FK), nickname, avatar_url, created_at
categories     id, couple_id(FK), name, icon(emoji), color(hex),
               budget_amount(원), sort_order, created_at
transactions   id, couple_id(FK), user_id(FK), category_id(FK),
               amount, type('expense'|'income'),
               tag('me'|'partner'|'together'), memo, date, created_at
comments       id, transaction_id(FK), user_id(FK), content, created_at
schedules      id, couple_id(FK), user_id(FK), title, date,
               tag('me'|'partner'|'together'), created_at
fixed_expenses id, couple_id(FK), category_id(FK), name, amount,
               due_day(매월 N일), created_at
```

**Realtime 구독 대상**: `transactions`, `comments`, `schedules`

**고정지출 연동 정책 (MVP)**: `fixed_expenses`는 알림 전용 기록. 실제 지출은 수동으로 `transactions`에 입력.

---

## DB 마이그레이션 (Supabase CLI)

```bash
npx supabase migration list        # 적용 현황 확인
npx supabase db push               # 미적용 마이그레이션 원격 적용
npx supabase migration new <name>  # 새 마이그레이션 파일 생성
```

마이그레이션 파일 위치: `supabase/migrations/YYYYMMDDHHMMSS_<name>.sql`

---

## 알려진 이슈 & 해결책

| 문제 | 해결 |
|------|------|
| NativeWind 설치 시 peer deps 충돌 | `--legacy-peer-deps` 플래그 사용 |
| Tailwind v4 호환성 문제 | Tailwind v3 고정 (`tailwindcss@3`) |
| Reanimated v4 의존성 누락 | `react-native-worklets` 별도 설치 필요 |
| 테스트 환경에서 reanimated 오류 | babel.config.js에서 조건부 플러그인 제외 |

---

## 개발 명령어

```bash
npx expo start --ios          # iOS 시뮬레이터 실행
npx expo start --ios --clear  # 캐시 초기화 후 실행
npx jest                      # 테스트 전체 실행
npx jest --watch              # watch 모드
eas build --platform ios      # 프로덕션 빌드
npx supabase db push          # DB 마이그레이션 적용
npx supabase migration list   # 마이그레이션 상태 확인
```

---

## 환경 변수 (`.env.local`)

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

`.env.local`은 gitignore됨. `.env.example` 참고.
