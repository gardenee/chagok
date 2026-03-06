-- Realtime 구독 허용 테이블
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table schedules;
