-- transactions: 날짜별 조회 (홈/가계부/캘린더에서 빈번)
create index if not exists transactions_couple_date_idx
  on transactions(couple_id, date desc);

-- transactions: 카테고리별 집계 (홈 대시보드)
create index if not exists transactions_category_idx
  on transactions(category_id);

-- comments: 거래내역별 조회
create index if not exists comments_transaction_idx
  on comments(transaction_id);

-- schedules: 날짜별 조회
create index if not exists schedules_couple_date_idx
  on schedules(couple_id, date);

-- users: couple_id로 파트너 조회
create index if not exists users_couple_idx
  on users(couple_id);
