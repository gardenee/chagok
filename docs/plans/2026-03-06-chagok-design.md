# 차곡 (Chagok) — MVP 1 기획 설계서

> "따로의 소비, 같이의 차곡"
> 부부/커플을 위한 공유 가계부 앱

---

## 1. 제품 개요

### 핵심 가치
단순한 지출 기록을 넘어, 두 사람의 경제적 대화가 일어나는 공간.
각자의 소비를 투명하게 공유하고, 함께 만들어가는 재정 습관을 지원한다.

### 슬로건
- "따로의 소비, 같이의 차곡"
- "우리 둘의 내일이 차곡차곡 쌓여요"

---

## 2. 기술 스택

| 역할 | 기술 | 비고 |
|------|------|------|
| 앱 프레임워크 | Expo SDK 52 + Expo Router v4 | iOS/Android/Web 통합 |
| 언어 | TypeScript | |
| UI | NativeWind (Tailwind CSS for RN) | |
| 애니메이션 | Reanimated 3 + Moti | 차곡 쌓임 모션, 햅틱 |
| 백엔드/DB | Supabase | Auth, PostgreSQL, Realtime, Storage |
| 푸시 알림 | Expo Notifications + FCM/APNs | |
| 상태관리 | Zustand | |
| 빌드/배포 | EAS Build | App Store / Google Play 제출 |

### 플랫폼 지원 계획
- **MVP 1**: iOS
- **MVP 2**: Android (코드 공유율 ~90%)
- **이후**: Web (Expo Web, 일부 네이티브 컴포넌트 fallback 필요)

---

## 3. UI/UX 컨셉

### 디자인 방향: 클레이모피즘 (Claymorphism)
찰흙을 빚어놓은 듯한 귀여운 입체감과 따뜻한 색감.

### 컬러 팔레트: "정원의 아침"
- **Main**: 버터 옐로우 (따뜻함, 돈) + 올리브 그린 (안정감, 성장)
- **Accent**: 소프트 피치, 라벤더
- **Background**: 크림 화이트

### 시각 요소
- 모든 카드/버튼: `rounded-3xl` 마시멜로 느낌
- 그림자: 메인 컬러 연하게 섞은 소프트 섀도우
- 아이콘: Lucide 아이콘, 굵기 두껍게 조정
- 애니메이션: 지출 입력 시 리스트 아래에서 위로 "차곡!" 쌓이는 모션
- 햅틱: 카테고리 선택, 저장 완료 시 피드백

---

## 4. 화면 구조 (네비게이션)

```
(인증 플로우)
  ├── 로그인 — 카카오 / 구글 소셜 로그인
  ├── 닉네임 설정 — 앱 내 표시 이름 (예: 가든)
  ├── 커플 연동 — 초대코드 생성/입력 + 카카오 링크 공유
  └── 가계부 이름 설정 — 커플 공유 가계부 이름 (예: 가든네 살림)

(메인 탭 — 4개)
  ├── 홈 — 이번 달 요약 대시보드
  ├── 가계부 — 지출/수입 리스트 + 입력
  ├── 캘린더 — 월간 뷰
  └── 설정 — 프로필, 카테고리, 고정지출
```

---

## 5. 핵심 기능 상세

### A. 홈 (대시보드)
- 이번 달 총 지출 / 수입 요약
- 카테고리별 예산 대비 소비 현황 (프로그레스 바)
- 나/파트너/함께 지출 비율 시각화
- 최근 지출 내역 3~5개 미리보기

### B. 가계부

**지출/수입 입력**
- 금액, 카테고리, 날짜, 메모 입력
- **태그**: 나(닉네임) / 파트너(닉네임) / 함께 — 지출 주체 명시
- 유형: 지출 / 수입 선택
- 카테고리 퀵 추가: 입력창에서 직접 타이핑으로 즉시 생성

**리스트 뷰**
- 날짜별 그룹핑
- 태그별 필터 (전체 / 나 / 파트너 / 함께)
- 카테고리별 필터
- 지출 항목 탭 → 상세 + 댓글 화면

**댓글**
- 개별 지출 내역에 텍스트 댓글 달기
- 동글동글한 말풍선 UI
- 실시간 반영 (Supabase Realtime)

### C. 카테고리 (핵심 기능)
- 커플 공유 카테고리 (기본 제공 + 커스텀)
- 커스텀 항목: 이름, 이모지 아이콘, 컬러, 월별 예산 금액
- 드래그 앤 드롭으로 순서 변경
- 개인 용돈은 카테고리로 관리 (예: "가든 용돈" 카테고리 + 나 태그)

**기본 제공 카테고리 예시**
식비 / 카페 / 교통 / 쇼핑 / 여가 / 의료 / 고정지출 / 기타

### D. 캘린더
- 월간 뷰
- 태그 필터: 전체 / 나 / 파트너 / 함께
- 지출 있는 날: 작은 동전 아이콘
- 일정 있는 날: 작은 하트 (함께) / 점 (개인)
- 오늘 표시: 형광펜으로 슥 그은 듯한 동그라미
- 일정 추가: 제목, 날짜, 태그(나/파트너/함께)
- 가계부 연동: 날짜 탭 시 해당일 지출 내역 표시

### E. 고정지출
- 월세, 구독료 등 반복 지출 등록
- 항목: 이름, 금액, 카테고리, 결제일(매월 N일)
- 결제일 D-1 푸시 알림

### F. 설정
- 프로필: 닉네임, 아바타 변경
- 가계부 이름 변경
- 카테고리 관리
- 고정지출 관리
- 커플 연동 정보 확인
- 알림 설정

---

## 6. 데이터베이스 설계 (Supabase / PostgreSQL)

```sql
-- 커플 그룹
couples (
  id uuid PK,
  book_name text,           -- 가계부 이름 (예: 가든네 살림)
  invite_code text UNIQUE,  -- 6자리 초대 코드
  created_at timestamptz
)

-- 사용자
users (
  id uuid PK,               -- Supabase Auth uid
  couple_id uuid FK,
  nickname text,
  avatar_url text,
  created_at timestamptz
)

-- 카테고리 (커플 공유)
categories (
  id uuid PK,
  couple_id uuid FK,
  name text,
  icon text,                -- 이모지
  color text,               -- hex color
  budget_amount integer,    -- 월 예산 (원)
  sort_order integer,
  created_at timestamptz
)

-- 지출/수입 내역
transactions (
  id uuid PK,
  couple_id uuid FK,
  user_id uuid FK,          -- 입력한 사람
  category_id uuid FK,
  amount integer,
  type text,                -- 'expense' | 'income'
  tag text,                 -- 'me' | 'partner' | 'together'
  memo text,
  date date,
  created_at timestamptz
)

-- 댓글
comments (
  id uuid PK,
  transaction_id uuid FK,
  user_id uuid FK,
  content text,
  created_at timestamptz
)

-- 캘린더 일정
schedules (
  id uuid PK,
  couple_id uuid FK,
  user_id uuid FK,
  title text,
  date date,
  tag text,                 -- 'me' | 'partner' | 'together'
  created_at timestamptz
)

-- 고정지출
fixed_expenses (
  id uuid PK,
  couple_id uuid FK,
  category_id uuid FK,
  name text,
  amount integer,
  due_day integer,          -- 매월 N일
  created_at timestamptz
)
```

---

## 7. 실시간 동기화
- Supabase Realtime으로 `transactions`, `comments`, `schedules` 테이블 구독
- 파트너가 지출 입력 시 내 앱에 즉시 반영

---

## 8. 푸시 알림

| 트리거 | 내용 |
|--------|------|
| 파트너가 지출 입력 | "{닉네임}이 {카테고리}에 {금액}원 지출했어요" |
| 파트너가 댓글 작성 | "{닉네임}이 댓글을 달았어요" |
| 고정지출 결제일 D-1 | "내일은 {이름} 결제일이에요 ({금액}원)" |

---

## 9. 커플 연동 플로우

1. 사용자 A가 앱에서 초대코드 생성 (6자리)
2. 공유 방법:
   - 코드 직접 전달
   - "카카오로 초대하기" → 딥링크 포함 메시지 전송
3. 사용자 B가 코드 입력 또는 링크 클릭 → 자동 연동
4. 연동 완료 후 가계부 이름 설정

---

## 10. MVP 범위 요약

### 포함
- 소셜 로그인 (카카오, 구글)
- 커플 연동 (초대코드 + 링크)
- 가계부 이름 설정
- 지출/수입 CRUD
- 나/파트너/함께 태그
- 카테고리 커스텀 (이름/아이콘/컬러/예산/순서)
- 홈 대시보드 (카테고리별 예산 현황)
- 캘린더 (지출 연동 + 일정 추가)
- 댓글
- 고정지출 등록
- 실시간 동기화
- 푸시 알림 (파트너 지출, 댓글, 고정지출 리마인더)

### MVP 이후
- 리액션 스티커
- 지출 분할 계산 (n:m 비율)
- 자산 관리 (계좌 잔액)
- 통계 리포트 (월별 추이, 카테고리 분석)
- Android 빌드
- Web 지원
