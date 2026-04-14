-- 회원 탈퇴: auth.users까지 완전 삭제
-- Apple / Google 심사 요건 충족 (동일 소셜 계정으로 재로그인 시 신규 가입 처리)
--
-- 처리 순서:
-- 1. 커플 멤버가 본인 혼자인 경우 → couples 행 삭제 (CASCADE로 하위 데이터 일괄 정리)
-- 2. auth.users 행 삭제 → public.users CASCADE → transactions/comments/schedules/notifications CASCADE
create or replace function delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid            uuid := auth.uid();
  user_couple_id uuid;
  member_count   integer;
begin
  if uid is null then
    raise exception '인증이 필요합니다.';
  end if;

  -- 커플 소속 여부 확인
  select couple_id into user_couple_id
  from users
  where id = uid;

  if user_couple_id is not null then
    select count(*) into member_count
    from users
    where couple_id = user_couple_id;

    -- 혼자인 커플: 커플 및 하위 데이터 모두 삭제
    -- (categories, fixed_expenses, payment_methods, anniversaries, transactions, schedules가 CASCADE 삭제됨)
    if member_count = 1 then
      delete from couples where id = user_couple_id;
    end if;
  end if;

  -- Auth 계정 삭제 → public.users CASCADE → transactions/comments/schedules/notifications CASCADE
  delete from auth.users where id = uid;
end;
$$;
