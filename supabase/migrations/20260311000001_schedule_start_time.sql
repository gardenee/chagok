-- 일정 시간 필드 추가 (선택적, HH:MM 형식 텍스트)
alter table schedules add column if not exists start_time text;
