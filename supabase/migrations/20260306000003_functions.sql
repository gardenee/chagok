-- ───────────────────────────────
-- 커플 생성 + 기본 카테고리 삽입
-- 호출: supabase.rpc('create_couple', { book_name, invite_code })
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
-- 초대코드로 커플 합류
-- 호출: supabase.rpc('join_couple', { invite_code })
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
  select id into target_couple_id
  from couples
  where couples.invite_code = join_couple.invite_code;

  if target_couple_id is null then
    raise exception '유효하지 않은 초대코드입니다.';
  end if;

  select count(*) into member_count
  from users
  where couple_id = target_couple_id;

  if member_count >= 2 then
    raise exception '이미 두 명이 연동된 가계부입니다.';
  end if;

  update users set couple_id = target_couple_id where id = auth.uid();

  return target_couple_id;
end;
$$;
