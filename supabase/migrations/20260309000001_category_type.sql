alter table categories
  add column if not exists type text not null default 'expense'
  check (type in ('expense', 'income'));

-- 같은 이름의 지출/수입 카테고리를 허용하기 위해 unique 제약 변경
alter table categories drop constraint if exists categories_couple_id_name_key;
alter table categories add constraint categories_couple_id_name_type_key
  unique (couple_id, name, type);
