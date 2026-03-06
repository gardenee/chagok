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
