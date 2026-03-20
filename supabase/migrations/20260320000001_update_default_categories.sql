-- ───────────────────────────────
-- create_couple 함수 업데이트
-- 기본 카테고리를 새 목록으로 교체
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
    (new_couple_id, '식재료',     'food',         '#FFADAD',  1, 'expense'),
    (new_couple_id, '외식',       'restaurant',   '#FBC4AB',  2, 'expense'),
    (new_couple_id, '커피·군것질', 'cafe',         '#FAD97A',  3, 'expense'),
    (new_couple_id, '술·유흥',    'wine',         '#EEB462',  4, 'expense'),
    (new_couple_id, '주거',       'home',         '#95D5B2',  5, 'expense'),
    (new_couple_id, '공과금',     'utility',      '#A2D2FF',  6, 'expense'),
    (new_couple_id, '통신',       'digital',      '#B8A3DE',  7, 'expense'),
    (new_couple_id, '보험',       'insurance',    '#8E9AAF',  8, 'expense'),
    (new_couple_id, '구독료',     'subscription', '#DEABFF',  9, 'expense'),
    (new_couple_id, '교통·자동차', 'transport',   '#A3B18A', 10, 'expense'),
    (new_couple_id, '의료·건강',  'drug',         '#74A892', 11, 'expense'),
    (new_couple_id, '교육',       'study',        '#A2D2FF', 12, 'expense'),
    (new_couple_id, '패션',       'fashion',      '#FF85A1', 13, 'expense'),
    (new_couple_id, '미용',       'beauty',       '#DEABFF', 14, 'expense'),
    (new_couple_id, '생활용품',   'things',       '#C7E9B0', 15, 'expense'),
    (new_couple_id, '여행',       'travel',       '#8ECAE6', 16, 'expense'),
    (new_couple_id, '취미·여가',  'game',         '#B8A3DE', 17, 'expense'),
    (new_couple_id, '경조사',     'cake',         '#F28482', 18, 'expense'),
    (new_couple_id, '선물',       'gift',         '#FFADAD', 19, 'expense'),
    (new_couple_id, '세금',       'tax',          '#CBC0D3', 20, 'expense'),
    (new_couple_id, '수수료',     'fee',          '#DDB892', 21, 'expense'),
    (new_couple_id, '기부',       'donate',       '#95D5B2', 22, 'expense'),
    (new_couple_id, '기타',       'wallet',       '#8E9AAF', 23, 'expense');

  -- 기본 수입 카테고리
  insert into categories (couple_id, name, icon, color, sort_order, type) values
    (new_couple_id, '급여', 'salary',    '#A3B18A', 1, 'income'),
    (new_couple_id, '부업', 'freelance', '#FAD97A', 2, 'income'),
    (new_couple_id, '투자', 'invest',    '#8ECAE6', 3, 'income'),
    (new_couple_id, '용돈', 'candy',     '#DEABFF', 4, 'income'),
    (new_couple_id, '기타', 'wallet',    '#CBC0D3', 5, 'income');

  return new_couple_id;
end;
$$;
