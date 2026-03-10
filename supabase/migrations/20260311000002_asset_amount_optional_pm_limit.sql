-- assets.amount를 선택 입력으로 변경 (nullable)
ALTER TABLE assets ALTER COLUMN amount SET DEFAULT 0;
ALTER TABLE assets ALTER COLUMN amount DROP NOT NULL;

-- payment_methods에 한도(limit) 컬럼 추가 (nullable)
ALTER TABLE payment_methods ADD COLUMN IF NOT EXISTS "limit" INTEGER DEFAULT NULL;
