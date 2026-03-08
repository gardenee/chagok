-- invite_code NULL 허용 (join 후 초기화를 위해)
alter table couples alter column invite_code drop not null;
