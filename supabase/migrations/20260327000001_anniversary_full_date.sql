-- anniversaries.date: MM-DD → YYYY-MM-DD
-- 기존 MM-DD 데이터를 현재 연도 기준으로 변환 (연도 정보가 없으므로 플레이스홀더)
UPDATE anniversaries
SET date = CONCAT(EXTRACT(YEAR FROM now())::text, '-', date)
WHERE date ~ '^\d{2}-\d{2}$';

-- 코멘트 업데이트
COMMENT ON COLUMN anniversaries.date IS 'YYYY-MM-DD format (full date including year)';
