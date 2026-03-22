-- users, couples 테이블 realtime 구독 허용
-- useCoupleMembers 훅에서 파트너 조인/닉네임 변경 실시간 감지에 필요
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table couples;
