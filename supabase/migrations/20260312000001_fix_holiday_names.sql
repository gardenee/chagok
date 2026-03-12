-- 공휴일 이름 정규화: '전날/다음날' → '연휴'
UPDATE holidays SET name = '설날 연휴' WHERE name IN ('설날 전날', '설날 다음날');
UPDATE holidays SET name = '추석 연휴' WHERE name IN ('추석 전날', '추석 다음날');
