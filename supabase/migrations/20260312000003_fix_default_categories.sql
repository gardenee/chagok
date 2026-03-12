-- ───────────────────────────────
-- create_couple 함수 수정
-- 1. 이모지 → Lucide 아이콘 키로 교체
-- 2. 수입 기본 카테고리 추가
-- 3. 색상을 팔레트(butter/peach/lavender)에 맞게 수정
-- ───────────────────────────────
create or replace function create_couple(book_name text, invite_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  new_couple_id uuid;
begin
  insert into couples (book_name, invite_code)
  values (book_name, invite_code)
  returning id into new_couple_id;

  update users set couple_id = new_couple_id where id = auth.uid();

  -- 기본 지출 카테고리
  insert into categories (couple_id, name, icon, color, sort_order, type) values
    (new_couple_id, '식비',     'food',      '#F7B8A0', 1, 'expense'),
    (new_couple_id, '카페',     'cafe',      '#D4C5F0', 2, 'expense'),
    (new_couple_id, '교통',     'transport', '#FAD97A', 3, 'expense'),
    (new_couple_id, '쇼핑',     'shopping',  '#F7B8A0', 4, 'expense'),
    (new_couple_id, '여가',     'party',     '#D4C5F0', 5, 'expense'),
    (new_couple_id, '의료',     'health',    '#FAD97A', 6, 'expense'),
    (new_couple_id, '고정지출', 'home',      '#F7B8A0', 7, 'expense'),
    (new_couple_id, '기타',     'wallet',    '#D4C5F0', 8, 'expense');

  -- 기본 수입 카테고리
  insert into categories (couple_id, name, icon, color, sort_order, type) values
    (new_couple_id, '급여', 'salary',    '#FAD97A', 1, 'income'),
    (new_couple_id, '부업', 'freelance', '#F7B8A0', 2, 'income'),
    (new_couple_id, '투자', 'invest',    '#D4C5F0', 3, 'income'),
    (new_couple_id, '용돈', 'allowance', '#FAD97A', 4, 'income'),
    (new_couple_id, '기타', 'wallet',    '#F7B8A0', 5, 'income');

  return new_couple_id;
end;
$$;

-- ───────────────────────────────
-- 기존 이모지 카테고리를 아이콘 키로 마이그레이션
-- ───────────────────────────────
update categories set icon = 'food'      where icon = '🍚';
update categories set icon = 'cafe'      where icon = '☕';
update categories set icon = 'transport' where icon = '🚌';
update categories set icon = 'shopping'  where icon = '🛍';
update categories set icon = 'party'     where icon = '🎉';
update categories set icon = 'health'    where icon = '💊';
update categories set icon = 'home'      where icon = '🏠';
update categories set icon = 'wallet'    where icon = '📦';
