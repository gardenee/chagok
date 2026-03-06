# Supabase DB 스키마 구축 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 차곡 앱의 전체 데이터베이스 스키마를 Supabase에 구축하고, TypeScript 타입을 앱 코드에 연결한다.

**Architecture:** Supabase SQL Editor에서 실행할 마이그레이션 SQL 파일을 로컬에 작성한 뒤 순서대로 실행한다. RLS(Row Level Security)로 커플 단위 데이터 격리를 구현하고, TypeScript Database 타입을 생성해 `lib/supabase.ts`에 연결한다.

**Tech Stack:** Supabase PostgreSQL, Row Level Security, TypeScript

---

## 사전 확인

Supabase 프로젝트 대시보드 → SQL Editor 탭이 열려 있는지 확인.
`.env.local`에 `EXPO_PUBLIC_SUPABASE_URL`과 `EXPO_PUBLIC_SUPABASE_ANON_KEY`가 채워져 있는지 확인.

---

## Task 1: 테이블 생성 SQL 작성

**Files:**
- Create: `supabase/01_tables.sql`

**Step 1: SQL 파일 생성**

`supabase/01_tables.sql`:

```sql
-- uuid 확장 활성화 (이미 활성화된 경우 무시됨)
create extension if not exists "pgcrypto";

-- ───────────────────────────────
-- 커플 그룹
-- ───────────────────────────────
create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  book_name text not null default '우리 가계부',
  invite_code text not null unique,
  created_at timestamptz not null default now()
);

-- ───────────────────────────────
-- 유저 프로필 (Supabase Auth와 1:1)
-- ───────────────────────────────
create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  couple_id uuid references couples(id) on delete set null,
  nickname text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ───────────────────────────────
-- 카테고리 (커플 공유)
-- ───────────────────────────────
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  color text not null default '#6B7C3A',
  budget_amount integer not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ───────────────────────────────
-- 지출/수입 내역
-- ───────────────────────────────
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  amount integer not null check (amount > 0),
  type text not null check (type in ('expense', 'income')),
  tag text not null check (tag in ('me', 'partner', 'together')),
  memo text,
  date date not null,
  created_at timestamptz not null default now()
);

-- ───────────────────────────────
-- 댓글
-- ───────────────────────────────
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ───────────────────────────────
-- 캘린더 일정
-- ───────────────────────────────
create table if not exists schedules (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  date date not null,
  tag text not null check (tag in ('me', 'partner', 'together')),
  created_at timestamptz not null default now()
);

-- ───────────────────────────────
-- 고정지출
-- ───────────────────────────────
create table if not exists fixed_expenses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  amount integer not null check (amount > 0),
  due_day integer not null check (due_day between 1 and 31),
  created_at timestamptz not null default now()
);
```

**Step 2: Supabase SQL Editor에서 실행**

Supabase 대시보드 → SQL Editor → `supabase/01_tables.sql` 내용 붙여넣기 → Run

**Step 3: 실행 결과 확인**

Table Editor 탭에서 7개 테이블이 생성됐는지 확인:
`couples`, `users`, `categories`, `transactions`, `comments`, `schedules`, `fixed_expenses`

**Step 4: 커밋**

```bash
git add supabase/01_tables.sql
git commit -m "chore: Supabase 테이블 스키마 생성"
```

---

## Task 2: RLS 정책 SQL 작성

**Files:**
- Create: `supabase/02_rls.sql`

**Step 1: SQL 파일 생성**

`supabase/02_rls.sql`:

```sql
-- ───────────────────────────────
-- 모든 테이블 RLS 활성화
-- ───────────────────────────────
alter table couples enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;
alter table comments enable row level security;
alter table schedules enable row level security;
alter table fixed_expenses enable row level security;

-- ───────────────────────────────
-- 헬퍼 함수: 현재 유저의 couple_id 반환
-- ───────────────────────────────
create or replace function get_my_couple_id()
returns uuid
language sql
security definer
stable
as $$
  select couple_id from users where id = auth.uid()
$$;

-- ───────────────────────────────
-- couples 정책
-- ───────────────────────────────

-- 본인이 속한 커플만 조회 가능
create policy "커플 멤버만 조회" on couples
  for select using (id = get_my_couple_id());

-- 로그인한 유저는 커플 생성 가능
create policy "로그인 유저 커플 생성" on couples
  for insert with check (auth.uid() is not null);

-- 본인 커플만 수정 가능
create policy "커플 멤버만 수정" on couples
  for update using (id = get_my_couple_id());

-- 초대코드로 커플 조회 허용 (연동 전 유저가 입력한 코드 검색)
-- authenticated 유저가 invite_code로 조회 가능 (아직 couples에 없어도)
create policy "초대코드로 커플 조회" on couples
  for select using (auth.uid() is not null);

-- 위 두 select 정책 중 "커플 멤버만 조회"는 "초대코드로 커플 조회"로 대체됨
-- 아래처럼 하나만 유지:
-- 즉, authenticated 유저는 invite_code 검색을 위해 couples를 select할 수 있음
-- (RLS는 OR 조건으로 동작하므로 가장 넓은 정책이 적용됨)

-- ───────────────────────────────
-- users 정책
-- ───────────────────────────────

-- 같은 커플 멤버는 서로 프로필 조회 가능
create policy "커플 멤버 프로필 조회" on users
  for select using (
    couple_id = get_my_couple_id()
    or id = auth.uid()
  );

-- 본인 row만 생성 가능
create policy "본인 프로필 생성" on users
  for insert with check (id = auth.uid());

-- 본인 row만 수정 가능
create policy "본인 프로필 수정" on users
  for update using (id = auth.uid());

-- ───────────────────────────────
-- categories 정책
-- ───────────────────────────────

create policy "커플 카테고리 조회" on categories
  for select using (couple_id = get_my_couple_id());

create policy "커플 카테고리 생성" on categories
  for insert with check (couple_id = get_my_couple_id());

create policy "커플 카테고리 수정" on categories
  for update using (couple_id = get_my_couple_id());

create policy "커플 카테고리 삭제" on categories
  for delete using (couple_id = get_my_couple_id());

-- ───────────────────────────────
-- transactions 정책
-- ───────────────────────────────

create policy "커플 거래내역 조회" on transactions
  for select using (couple_id = get_my_couple_id());

create policy "커플 거래내역 생성" on transactions
  for insert with check (
    couple_id = get_my_couple_id()
    and user_id = auth.uid()
  );

create policy "본인 거래내역 수정" on transactions
  for update using (user_id = auth.uid());

create policy "본인 거래내역 삭제" on transactions
  for delete using (user_id = auth.uid());

-- ───────────────────────────────
-- comments 정책
-- ───────────────────────────────

create policy "커플 댓글 조회" on comments
  for select using (
    exists (
      select 1 from transactions t
      where t.id = transaction_id
      and t.couple_id = get_my_couple_id()
    )
  );

create policy "커플 댓글 생성" on comments
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from transactions t
      where t.id = transaction_id
      and t.couple_id = get_my_couple_id()
    )
  );

create policy "본인 댓글 삭제" on comments
  for delete using (user_id = auth.uid());

-- ───────────────────────────────
-- schedules 정책
-- ───────────────────────────────

create policy "커플 일정 조회" on schedules
  for select using (couple_id = get_my_couple_id());

create policy "커플 일정 생성" on schedules
  for insert with check (
    couple_id = get_my_couple_id()
    and user_id = auth.uid()
  );

create policy "본인 일정 수정" on schedules
  for update using (user_id = auth.uid());

create policy "본인 일정 삭제" on schedules
  for delete using (user_id = auth.uid());

-- ───────────────────────────────
-- fixed_expenses 정책
-- ───────────────────────────────

create policy "커플 고정지출 조회" on fixed_expenses
  for select using (couple_id = get_my_couple_id());

create policy "커플 고정지출 생성" on fixed_expenses
  for insert with check (couple_id = get_my_couple_id());

create policy "커플 고정지출 수정" on fixed_expenses
  for update using (couple_id = get_my_couple_id());

create policy "커플 고정지출 삭제" on fixed_expenses
  for delete using (couple_id = get_my_couple_id());
```

**Step 2: Supabase SQL Editor에서 실행**

`supabase/02_rls.sql` 내용 붙여넣기 → Run

**Step 3: 실행 결과 확인**

Supabase 대시보드 → Authentication → Policies 탭에서 각 테이블에 정책이 생성됐는지 확인.

**Step 4: 커밋**

```bash
git add supabase/02_rls.sql
git commit -m "chore: RLS 정책 설정 — 커플 단위 데이터 격리"
```

---

## Task 3: 기본 카테고리 Seed 함수 작성

> 기본 카테고리는 커플 생성 시 자동으로 삽입된다. Seed SQL이 아닌 DB 함수로 구현한다.

**Files:**
- Create: `supabase/03_functions.sql`

**Step 1: SQL 파일 생성**

`supabase/03_functions.sql`:

```sql
-- ───────────────────────────────
-- 커플 생성 + 기본 카테고리 삽입 함수
-- 인증 플로우에서 호출: supabase.rpc('create_couple', { book_name, invite_code })
-- ───────────────────────────────
create or replace function create_couple(book_name text, invite_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_couple_id uuid;
begin
  -- 커플 생성
  insert into couples (book_name, invite_code)
  values (book_name, invite_code)
  returning id into new_couple_id;

  -- 호출한 유저를 해당 커플에 연결
  update users set couple_id = new_couple_id where id = auth.uid();

  -- 기본 카테고리 삽입
  insert into categories (couple_id, name, icon, color, sort_order) values
    (new_couple_id, '식비',     '🍚', '#F5E642', 1),
    (new_couple_id, '카페',     '☕', '#FFB5A0', 2),
    (new_couple_id, '교통',     '🚌', '#C9B8E8', 3),
    (new_couple_id, '쇼핑',     '🛍', '#6B7C3A', 4),
    (new_couple_id, '여가',     '🎉', '#F5E642', 5),
    (new_couple_id, '의료',     '💊', '#FFB5A0', 6),
    (new_couple_id, '고정지출', '🏠', '#C9B8E8', 7),
    (new_couple_id, '기타',     '📦', '#6B7C3A', 8);

  return new_couple_id;
end;
$$;

-- ───────────────────────────────
-- 초대코드로 커플 합류 함수
-- 인증 플로우에서 호출: supabase.rpc('join_couple', { invite_code })
-- ───────────────────────────────
create or replace function join_couple(invite_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  target_couple_id uuid;
  member_count integer;
begin
  -- 초대코드로 커플 찾기
  select id into target_couple_id
  from couples
  where couples.invite_code = join_couple.invite_code;

  if target_couple_id is null then
    raise exception '유효하지 않은 초대코드입니다.';
  end if;

  -- 이미 2명인 커플에는 합류 불가
  select count(*) into member_count
  from users
  where couple_id = target_couple_id;

  if member_count >= 2 then
    raise exception '이미 두 명이 연동된 가계부입니다.';
  end if;

  -- 유저를 커플에 연결
  update users set couple_id = target_couple_id where id = auth.uid();

  return target_couple_id;
end;
$$;
```

**Step 2: Supabase SQL Editor에서 실행**

`supabase/03_functions.sql` 내용 붙여넣기 → Run

**Step 3: 실행 결과 확인**

Supabase 대시보드 → Database → Functions 탭에서
`create_couple`, `join_couple` 두 함수가 보이는지 확인.

**Step 4: 커밋**

```bash
git add supabase/03_functions.sql
git commit -m "chore: DB 함수 추가 — create_couple, join_couple"
```

---

## Task 4: TypeScript Database 타입 작성

**Files:**
- Create: `types/database.ts`
- Modify: `lib/supabase.ts`

**Step 1: `types/database.ts` 생성**

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      couples: {
        Row: {
          id: string;
          book_name: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          book_name?: string;
          invite_code: string;
          created_at?: string;
        };
        Update: {
          book_name?: string;
          invite_code?: string;
        };
      };
      users: {
        Row: {
          id: string;
          couple_id: string | null;
          nickname: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          couple_id?: string | null;
          nickname: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          couple_id?: string | null;
          nickname?: string;
          avatar_url?: string | null;
        };
      };
      categories: {
        Row: {
          id: string;
          couple_id: string;
          name: string;
          icon: string;
          color: string;
          budget_amount: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          name: string;
          icon?: string;
          color?: string;
          budget_amount?: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
          budget_amount?: number;
          sort_order?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          category_id: string | null;
          amount: number;
          type: 'expense' | 'income';
          tag: 'me' | 'partner' | 'together';
          memo: string | null;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          category_id?: string | null;
          amount: number;
          type: 'expense' | 'income';
          tag: 'me' | 'partner' | 'together';
          memo?: string | null;
          date: string;
          created_at?: string;
        };
        Update: {
          category_id?: string | null;
          amount?: number;
          type?: 'expense' | 'income';
          tag?: 'me' | 'partner' | 'together';
          memo?: string | null;
          date?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          transaction_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
      };
      schedules: {
        Row: {
          id: string;
          couple_id: string;
          user_id: string;
          title: string;
          date: string;
          tag: 'me' | 'partner' | 'together';
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          user_id: string;
          title: string;
          date: string;
          tag: 'me' | 'partner' | 'together';
          created_at?: string;
        };
        Update: {
          title?: string;
          date?: string;
          tag?: 'me' | 'partner' | 'together';
        };
      };
      fixed_expenses: {
        Row: {
          id: string;
          couple_id: string;
          category_id: string | null;
          name: string;
          amount: number;
          due_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          couple_id: string;
          category_id?: string | null;
          name: string;
          amount: number;
          due_day: number;
          created_at?: string;
        };
        Update: {
          category_id?: string | null;
          name?: string;
          amount?: number;
          due_day?: number;
        };
      };
    };
    Functions: {
      create_couple: {
        Args: { book_name: string; invite_code: string };
        Returns: string;
      };
      join_couple: {
        Args: { invite_code: string };
        Returns: string;
      };
      get_my_couple_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
  };
}

// 편의 타입 alias
export type Couple = Database['public']['Tables']['couples']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Category = Database['public']['Tables']['categories']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Schedule = Database['public']['Tables']['schedules']['Row'];
export type FixedExpense = Database['public']['Tables']['fixed_expenses']['Row'];

export type TransactionType = Transaction['type'];
export type Tag = Transaction['tag'];
```

**Step 2: `lib/supabase.ts` 수정 — Database 타입 연결**

```typescript
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

**Step 3: TypeScript 컴파일 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

**Step 4: 커밋**

```bash
git add types/database.ts lib/supabase.ts
git commit -m "feat: TypeScript Database 타입 정의 및 Supabase 클라이언트 타입 연결"
```

---

## Task 5: 인덱스 추가

**Files:**
- Create: `supabase/04_indexes.sql`

**Step 1: SQL 파일 생성**

자주 쿼리하는 컬럼에 인덱스를 추가한다.

`supabase/04_indexes.sql`:

```sql
-- transactions: 날짜별 조회 (홈/가계부/캘린더에서 빈번)
create index if not exists transactions_couple_date_idx
  on transactions(couple_id, date desc);

-- transactions: 카테고리별 집계 (홈 대시보드)
create index if not exists transactions_category_idx
  on transactions(category_id);

-- comments: 거래내역별 조회
create index if not exists comments_transaction_idx
  on comments(transaction_id);

-- schedules: 날짜별 조회
create index if not exists schedules_couple_date_idx
  on schedules(couple_id, date);

-- users: couple_id로 파트너 조회
create index if not exists users_couple_idx
  on users(couple_id);
```

**Step 2: Supabase SQL Editor에서 실행**

`supabase/04_indexes.sql` 내용 붙여넣기 → Run

**Step 3: 커밋**

```bash
git add supabase/04_indexes.sql
git commit -m "chore: DB 인덱스 추가 — 자주 쿼리하는 컬럼 최적화"
```

---

## Task 6: Realtime 구독 설정

**Files:**
- Create: `supabase/05_realtime.sql`

**Step 1: SQL 파일 생성**

`supabase/05_realtime.sql`:

```sql
-- Realtime 구독 허용 테이블 설정
-- (Supabase 대시보드 Database > Replication 에서 설정해도 됨)
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table schedules;
```

**Step 2: Supabase SQL Editor에서 실행**

**Step 3: Supabase 대시보드에서 확인**

Database → Replication → `supabase_realtime` publication에
`transactions`, `comments`, `schedules` 세 테이블이 포함되어 있는지 확인.

**Step 4: 커밋**

```bash
git add supabase/05_realtime.sql
git commit -m "chore: Realtime 구독 테이블 설정"
```

---

## 완료 후 상태

```
chagok/
├── supabase/
│   ├── 01_tables.sql     # 7개 테이블
│   ├── 02_rls.sql        # RLS 정책 (커플 단위 격리)
│   ├── 03_functions.sql  # create_couple, join_couple 함수
│   ├── 04_indexes.sql    # 쿼리 최적화 인덱스
│   └── 05_realtime.sql   # Realtime 구독 설정
├── types/
│   └── database.ts       # TypeScript DB 타입 전체
└── lib/
    └── supabase.ts       # createClient<Database> 타입 연결
```

Supabase에 스키마가 완성되고, TypeScript 타입이 클라이언트에 연결된 상태.
다음 단계: 인증 플로우 (로그인 화면 → 닉네임 설정 → 커플 연동).
