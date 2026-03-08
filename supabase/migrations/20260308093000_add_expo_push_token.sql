-- Expo Push 토큰 저장 컬럼
alter table users
add column if not exists expo_push_token text;
