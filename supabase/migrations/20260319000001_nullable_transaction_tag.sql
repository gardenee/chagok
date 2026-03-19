-- transactions.tag 컬럼을 nullable로 변경 (태그 미선택 허용)
ALTER TABLE transactions ALTER COLUMN tag DROP NOT NULL;
