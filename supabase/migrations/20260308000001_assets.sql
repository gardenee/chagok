-- ───────────────────────────────
-- assets 테이블
-- ───────────────────────────────
create table assets (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  name text not null,
  amount bigint not null default 0,
  type text not null default 'bank',
  icon text not null default 'bank',
  color text not null default '#FAD97A',
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- RLS
alter table assets enable row level security;

create policy "커플 자산 조회" on assets
  for select using (couple_id = get_my_couple_id());

create policy "커플 자산 생성" on assets
  for insert with check (couple_id = get_my_couple_id());

create policy "커플 자산 수정" on assets
  for update using (couple_id = get_my_couple_id());

create policy "커플 자산 삭제" on assets
  for delete using (couple_id = get_my_couple_id());

-- 인덱스
create index idx_assets_couple_id on assets(couple_id);
