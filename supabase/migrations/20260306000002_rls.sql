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
-- 인증된 유저는 누구나 SELECT 가능 (초대코드 검색 허용)
-- ───────────────────────────────
create policy "인증된 유저 커플 조회" on couples
  for select using (auth.uid() is not null);

create policy "로그인 유저 커플 생성" on couples
  for insert with check (auth.uid() is not null);

create policy "커플 멤버만 수정" on couples
  for update using (id = get_my_couple_id());

-- ───────────────────────────────
-- users 정책
-- ───────────────────────────────
create policy "커플 멤버 프로필 조회" on users
  for select using (
    couple_id = get_my_couple_id()
    or id = auth.uid()
  );

create policy "본인 프로필 생성" on users
  for insert with check (id = auth.uid());

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
