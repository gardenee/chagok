-- Fix SECURITY DEFINER functions to include search_path and NULL guard in notify_partner_comment

-- 파트너 지출 알림 trigger 함수 (수정)
create or replace function notify_partner_transaction()
returns trigger language plpgsql
security definer
set search_path = public
as $$
declare
  v_receiver_id   uuid;
  v_sender_nick   text;
  v_category_name text;
  v_category_icon text;
  v_category_color text;
begin
  -- 수신자: 같은 커플에서 작성자를 제외한 파트너
  select id into v_receiver_id
  from users
  where couple_id = NEW.couple_id
    and id != NEW.user_id
  limit 1;

  -- 파트너 없으면 알림 생략
  if v_receiver_id is null then
    return NEW;
  end if;

  -- 작성자 닉네임 조회
  select nickname into v_sender_nick
  from users where id = NEW.user_id;

  -- 카테고리 정보 조회 (없을 수 있음)
  if NEW.category_id is not null then
    select name, icon, color
    into v_category_name, v_category_icon, v_category_color
    from categories where id = NEW.category_id;
  end if;

  insert into notifications(user_id, type, title, body, icon, icon_color, reference_id)
  values (
    v_receiver_id,
    'partner_transaction',
    coalesce(v_sender_nick, '짝꿍') || '이 지출을 기록했어요',
    coalesce(v_category_name, '기타') || ' · ' || NEW.amount || '원',
    v_category_icon,
    v_category_color,
    NEW.id
  );

  return NEW;
end;
$$;

-- 댓글 알림 trigger 함수 (수정: NULL guard 추가)
create or replace function notify_partner_comment()
returns trigger language plpgsql
security definer
set search_path = public
as $$
declare
  v_transaction_owner_id uuid;
  v_commenter_nick       text;
begin
  -- 지출 작성자 조회
  select user_id into v_transaction_owner_id
  from transactions where id = NEW.transaction_id;

  -- 트랜잭션 없으면 알림 생략 (삭제 등 엣지 케이스)
  if v_transaction_owner_id is null then
    return NEW;
  end if;

  -- 자기 지출에 자기가 댓글 → 알림 없음 (의도적 설계)
  if v_transaction_owner_id = NEW.user_id then
    return NEW;
  end if;

  -- 댓글 작성자 닉네임 조회
  select nickname into v_commenter_nick
  from users where id = NEW.user_id;

  insert into notifications(user_id, type, title, body, icon, icon_color, reference_id)
  values (
    v_transaction_owner_id,
    'comment',
    '새 댓글이 달렸어요',
    coalesce(v_commenter_nick, '짝꿍') || ': "' || NEW.content || '"',
    null,
    null,
    NEW.transaction_id
  );

  return NEW;
end;
$$;
