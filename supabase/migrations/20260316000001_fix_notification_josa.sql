-- 한글 조사(이/가) 처리 함수
-- 마지막 글자의 받침 여부로 조사 결정
create or replace function korean_josa(
  word text,
  josa_with_batchim text,    -- 받침 있을 때 (예: '이')
  josa_without_batchim text  -- 받침 없을 때 (예: '가')
) returns text language plpgsql immutable as $$
declare
  last_char text;
  code_point int;
begin
  if word is null or char_length(word) = 0 then
    return coalesce(word, '') || josa_without_batchim;
  end if;

  last_char := substr(word, char_length(word), 1);
  code_point := ascii(last_char);

  -- 한글 유니코드 범위: 0xAC00(44032) ~ 0xD7A3(55203)
  -- (code_point - 44032) % 28 = 0 이면 받침 없음
  if code_point >= 44032 and code_point <= 55203 then
    if (code_point - 44032) % 28 = 0 then
      return word || josa_without_batchim;
    else
      return word || josa_with_batchim;
    end if;
  end if;

  -- 한글이 아닌 경우 받침 없는 조사 사용
  return word || josa_without_batchim;
end;
$$;

-- 파트너 지출 알림 trigger 함수 수정 (이/가 동적 처리)
create or replace function notify_partner_transaction()
returns trigger language plpgsql
security definer
set search_path = public
as $$
declare
  v_receiver_id    uuid;
  v_sender_nick    text;
  v_category_name  text;
  v_category_icon  text;
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
    korean_josa(coalesce(v_sender_nick, '짝꿍'), '이', '가') || ' 지출을 기록했어요',
    coalesce(v_category_name, '기타') || ' · ' || NEW.amount || '원',
    v_category_icon,
    v_category_color,
    NEW.id
  );

  return NEW;
end;
$$;
