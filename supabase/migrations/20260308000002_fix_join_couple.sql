-- join_couple 함수 보완:
-- 1. 이미 커플이 있는 사용자 join 방지
-- 2. 본인이 만든 커플에 본인 join 방지
create or replace function join_couple(invite_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  target_couple_id uuid;
  caller_couple_id uuid;
  member_count integer;
begin
  -- 초대코드로 커플 조회
  select id into target_couple_id
  from couples
  where couples.invite_code = join_couple.invite_code;

  if target_couple_id is null then
    raise exception '유효하지 않은 초대코드입니다.';
  end if;

  -- 호출자의 현재 couple_id 조회
  select couple_id into caller_couple_id
  from users
  where id = auth.uid();

  -- 본인이 만든 커플에 join 시도
  if caller_couple_id = target_couple_id then
    raise exception '본인이 만든 가계부입니다.';
  end if;

  -- 이미 다른 커플에 연동된 경우
  if caller_couple_id is not null then
    raise exception '이미 연동된 가계부가 있습니다.';
  end if;

  -- 인원 초과 확인
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
